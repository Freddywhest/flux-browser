// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var ById = function (id) {
    return document.getElementById(id);
}
var jsonfile = require('jsonfile');
var FastAverageColor = require('fast-average-color');
var fac = new FastAverageColor();
var favicon = require('favicon-getter').default;
var path = require('path');
var fs = require('fs');
var uuid = require('uuid');
var viewsE = ById('views');
var omni = ById('url');
var tabsE = ById('tabsp');
var sessionData = {
    tabs: [],
    active: 0
};
var tabObjs = [];
var activeTab=null;
var fastColorScriptP=path.join(__dirname, 'fastacolor.js');
var fastColorScript=fs.readFileSync(fastColorScriptP,'utf8')

var sessionPath = path.join(__dirname, 'session.json');
function view(){
    return activeTab.view;
}
function Tab() {
    this.view = document.createElement("webview");
    this.view.classList.add("page");
    this.view.setAttribute("autosize","on");
    this.view.src="http://www.google.com/";
    viewsE.appendChild(this.view);
    this.tab = document.createElement("a");
    this.tab.classList.add("tab");
    this.tab.innerHTML = `
    <img class="favicon"></img>
            <span class="title">${"New Tab"}</span>
            <div class="close">
              <i class="fa fa-times"></i>
            </div>
          `;
          tabsE.appendChild(this.tab);
          this.tab.querySelector(".close").onclick=(e)=>{
e.preventDefault();
e.stopPropagation();
            if(tabObjs.length>1){
                var n=tabObjs.indexOf(this);
                if(activeTab===this){
                tabObjs[(n-1+tabObjs.length)%tabObjs.length].activate();
                }
                tabObjs.splice(n,1);
                this.remove();
                // /tabObjs[(n-1+tabObjs.length)%tabObjs.length].activate();
                
            }else{

            }
          }
          this.view.addEventListener('did-finish-load', ()=>{
              try{
              this.tab.querySelector(".title").innerText = this.view.getTitle();
              }catch(e){

              }
              favicon(this.view.src).then((f)=>{
                this.tab.querySelector(".favicon").src=f;
              })
              if(this===activeTab){
                  try{
                document.title=(activeTab.view.getTitle?activeTab.view.getTitle():"")+" - Crystal";
                  }  catch(e){
                  
              }
            }
         
          });
          
    
    
    this.tab.onclick=()=>this.activate();
    return this;
}
ById("add-tab").onclick=newTab;
Tab.prototype.deactivate = function () {
    this.tab.classList.remove("active");
    this.view.classList.remove("active");
}
Tab.prototype.remove = function () {
    this.tab.parentElement.removeChild(this.tab);
    this.view.parentElement.removeChild(this.view);
}
Tab.prototype.activate = function () {
    tabObjs.forEach(t=>t.deactivate());
    this.tab.classList.add("active");
    this.view.classList.add("active");
    activeTab=this;
    if(omni){
    omni.value = view().src;
    }
    // console.log(activeTab.view);
    try{
    document.title=(activeTab.view.getTitle?activeTab.view.getTitle():"")+" - Crystal";
    }catch(e){
                  
    }
}
newTab();
function loadSession(session) {
    sessionData = session;
}

function newTab() {
    tabObjs.push(new Tab());
    console.log(tabObjs[tabObjs.length-1])
    tabObjs[tabObjs.length-1].activate();
    tabObjs[tabObjs.length-1].view.addEventListener('did-finish-load', updateNav);
}

function saveSession() {
    jsonfile.writeFile(sessionPath, sessionData, function (err) {})
}
jsonfile.readFile(sessionPath, function (err, curr) {
    loadSession(curr);
})
var bookmarks = path.join(__dirname, 'bookmarks.json');


var back = ById('back'),
    forward = ById('forward'),
    refresh = ById('refresh'),
    
    dev = ById('console'),
    fave = ById('fave'),
    list = ById('list'),
    popup = ById('fave-popup');

function reloadView() {
    view().reload();
    themeIt();
}

function backView() {
    view().goBack();
    themeIt();
}

function forwardView() {
    view().goForward();
    themeIt();
}

function updateURL(event) {
    if (event.keyCode === 13) {
        omni.blur();
        let val = omni.value;
        let https = val.slice(0, 8).toLowerCase();
        let http = val.slice(0, 7).toLowerCase();
        if (https === 'https://') {
            view().loadURL(val);
        } else if (http === 'http://' || ["file", "data"].map(x => (val.slice(0, (x + "://").length).toLowerCase() === x + "://")).reduce((a, b) => a || b, false)) {
            view().loadURL(val);
        } else if (val[0] === "/") {
            view().loadURL('file://' + val);
        } else {
            view().loadURL('http://' + val);
        }
        console.log("N", val)
        themeIt();
    }
}

var Bookmark = function (id, url, faviconUrl, title) {
    this.id = id;
    this.url = url;
    this.icon = faviconUrl;
    this.title = title;
}

Bookmark.prototype.ELEMENT = function () {
    var a_tag = document.createElement('a');
    a_tag.href = this.url;
    a_tag.className = 'link';
    a_tag.textContent = this.title;
    var favimage = document.createElement('img');
    favimage.src = this.icon;
    favimage.className = 'favicon';
    a_tag.insertBefore(favimage, a_tag.childNodes[0]);
    return a_tag;
}

function addBookmark() {
    let url = view().src;
    let title = view().getTitle();
    favicon(url).then(function (fav) {
        let book = new Bookmark(uuid.v1(), url, fav, title);
        jsonfile.readFile(bookmarks, function (err, curr) {
            curr.push(book);
            jsonfile.writeFile(bookmarks, curr, function (err) {})
        })
    })
}

function openPopUp(event) {
    let state = popup.getAttribute('data-state');
    if (state === 'closed') {
        popup.innerHTML = '';
        jsonfile.readFile(bookmarks, function (err, obj) {
            if (obj.length !== 0) {
                for (var i = 0; i < obj.length; i++) {
                    let url = obj[i].url;
                    let icon = obj[i].icon;
                    let id = obj[i].id;
                    let title = obj[i].title;
                    let bookmark = new Bookmark(id, url, icon, title);
                    let el = bookmark.ELEMENT();
                    popup.appendChild(el);
                }
            }
            popup.style.display = 'block';
            popup.setAttribute('data-state', 'open');
        });
    } else {
        popup.style.display = 'none';
        popup.setAttribute('data-state', 'closed');
    }
}

function handleUrl(event) {
    if (event.target.className === 'link') {
        event.preventDefault();
        view().loadURL(event.target.href);
    } else if (event.target.className === 'favicon') {
        event.preventDefault();
        view().loadURL(event.target.parentElement.href);
    }
}

function handleDevtools() {
    if (view().isDevToolsOpened()) {
        view().closeDevTools();
    } else {
        view().openDevTools({
            mode: "right"
        });
    }
}

function updateNav(event) {
    omni.value = view().src;
    themeIt();

}
//sol = DSolve[{x'[t] == -(1/((x[t]+y[t]+z[t])/(x[t]*y[t])-1))-x[t]/(x[t]+y[t]+z[t]), y'[t] == -(y[t]/(y[t]+z[t]))-y[t]/(x[t]+y[t]+z[t]), z'[t] == -(1/((x[t]+y[t]+z[t])/(x[t]*y[t])-1))-z[t]/(x[t]+y[t]+z[t])-(z[t]/(y[t]+z[t])),x[0]==20,y[0]==200,z[0]==10}, {x, y, z}, t]
function themeIt() {
    console.log((fastColorScript));
    
    // view().webContents.on('did-finish-load', () => {
        // view().executeJavaScript( fastColorScript);
    view().executeJavaScript(fastColorScript+`
    window.setTimeout( function() {
    var fac = new FastAverageColor();
    var v=document.createElement("style");
        v.innerHTML="body,html,.darkmode-background,.darkmode-layer,html,.trans:not(.quaz),html[dark]{background-color:transparent !important;}::-webkit-scrollbar {    background-color:#ffffff00;    width:8px;height:8px;}::-webkit-scrollbar-track {    background-color:#ffffff00;width:16px;height:16px;}::-webkit-scrollbar-thumb {    background-color:#babac080;    border-radius:8px;    border:4px solid transparent}::-webkit-scrollbar-button {display:none}";
        document.body.append(v);
        function getBkColor(el){
            var c=window.getComputedStyle( el , null).getPropertyValue( "background-color" );
            var mt=/${"\\d"}+/g;
            if(c.match(mt)){
                var q=c.match(mt).map(parseFloat);
                return q.length<4?q.concat([1]):q;
        }
        return [0,0,0,0];
        }
        function bkInfluence(e){
            if(!e.parentElement){
                return 0;
            }
            var a=getBkColor(e);
            var b=getBkColor(e.parentElement);
            var diff=[Math.abs(a[0]-b[0])/255,Math.abs(a[1]-b[1])/255,Math.abs(a[2]-b[2])/255];
            return (diff[0]+diff[2]+diff[2])*a[3]/3;
        }
        function shouldT(e){
            var c=window.getComputedStyle( e , null).getPropertyValue( "background-color" );
            var mt=/${"\\d"}+/g;
if(c.match(mt)){
                var cc=c.match(mt).map(parseFloat);
                var tcond=(!(cc.length>3&&cc[3]<0.25)||e.classList.contains("trans"));
                if(cc[0]+cc[1]+cc[2]>127*3||tcond){
                    if(tcond&&e.parentElement){
                        return !shouldT(e.parentElement);
                    }
                    return true;
                }
}
return false;
        }
        function colorWild(color){
            var ave=(color[0]+color[1]+color[2])/255/3;
            var st=(color.slice(0,3).map(x=>(x/255-ave)**2).reduce((a,b)=>a+b)/2)**0.5;
            return st;
        }
        var tim=0;
        function bkImgUrl(bi){
            var val=/url\\((.+)\\)/g.exec(bi);
            //console.log(val);
            if(val && val[1]){
                val=val[1];
                if((val[0]=="'"||val[0]=='"') && val[0]===val[val.length-1]){
                    val=val.substring(1,val.length-2);
                }
                if(val[0]=="/" && val[1]=="/"){
                    val=window.location.protocol+val;
                }
                return val;
            }else{
                return null;
            }
        }
        function magicWandTheme(){
            tim+=1;
            var all=document.querySelectorAll(tim%10===0?"*":"*:not(.dark-checked)");
            for(var i=0;i<all.length;i++){
                var e=all[i];
                e.classList.add("dark-checked");
                var c=window.getComputedStyle( e , null).getPropertyValue( "background-color" );
                var bi=window.getComputedStyle( e , null).getPropertyValue( "background-image" );
                var cd=window.getComputedStyle( e , null).getPropertyValue( "position" );
            var mt=/${"\\d"}+/g;
if(c.match(mt)){
                var cc=c.match(mt).map(parseFloat);
                if(cc[0]+cc[1]+cc[2]<127*3/4){
                    e.style.backgroundColor="rgba(0,0,0,0)";
                    if(!(cc.length>3&&cc[3]<0.25)){
                    e.classList.add("trans")
                    }
                }
                if(e.classList.contains("docos-avatar")){
                    e.style.zIndex=1;//fix google doc avatar
                }
                if(e.tagName.toLowerCase()=="img" && !e.classList.contains("done-img-ave")){
                    var dark=fac.getColor(e).isDark;
                    if(dark){
                        e.style.filter="invert()";
                    }
                    e.classList.add("done-img-ave");
                }
                //var bkImgUrlV=bkImgUrl(bi);
                if(!e.classList.contains("done-img-ave")){
                    var bkImgUrlV=bkImgUrl(bi);
                if(bkImgUrlV && !e.classList.contains("done-img-ave")){
                    var imnge=document.createElement("img");
                    imnge.src=bkImgUrlV;
                    var dark=fac.getColor(imnge).isDark;
                    if(dark){
                        e.style.filter="invert()";
                    }
                    e.classList.add("done-img-ave");
                }
            }
            
                if(shouldT(e)||(bkInfluence(e)<1/3||cc[0]+cc[1]+cc[2]>127*3||(e.style.backgroundImage.substring(0,"linear-gradient".length)=="linear-gradient"))){//||(cc.length>3&&cc[3]<0.25)){
                    //e.style.backgroundColor="rgba(0,0,0,0)";
                    e.style.backgroundColor="rgba("+cc[0]+","+cc[1]+","+cc[2]+","+Math.max(colorWild(cc),0)+")";
                    if(cc.length<4 && colorWild(cc)>0.125){
                        e.classList.add("quaz")
                    }
                    if(!(cc.length>3&&cc[3]<0.25)){
                    e.classList.add("trans")
                    }
                    if(!(bi.length>3&&(bi.substring(0,3)==="non"))){//||bi.substring(0,3)==="url"))){
                       // console.log(e.style.backgroundImage.substring(0,3));
                       if(bi.match("gradient")||e.webkitMatchesSelector(".vectorTabs li") ){//}.substring(0,"linear-gradient".length)=="linear-gradient"||e.webkitMatchesSelector(".vectorTabs li")  ){
                    e.style.backgroundImage="none";
                       }
                    }
                    
                    var tcond=(!(cc.length>3&&cc[3]<0.25)||e.classList.contains("trans"));
                    if(tcond||e.tagName.toLowerCase()!=="span"||true && !(e.webkitMatchesSelector("pre code span")))e.style.color="rgba(255,255,255,1)";
                    var nt=bkInfluence(e)>1/2||e.style.boxShadow!="none";
                    if(tcond&&((cd==="absolute"||cd==="fixed"||cd==="sticky"||!(e.parentElement && shouldT(e.parentElement)))||(nt&&!(e.parentElement && shouldT(e.parentElement))))){
                        if((!(e.parentElement && e.parentElement.innerText&&e.parentElement.innerText.length<e.innerText.length+2)||nt) 
                        &&(!e.webkitMatchesSelector("ytd-app,ytd-watch-flexy"))) {
                            
                            
                            if(e.innerHTML.length<1){
                                //console.log(e);
                                e.style.backdropFilter="";
                            }else{
                                e.style.backdropFilter="blur(5px) opacity(0.8)";
                            }
                            //if(cc[0]+cc[1]+cc[2]<255*3/2){
                                e.style.backdropFilter="opacity("+(1-Math.abs((cc[0]+cc[1]+cc[2])/255/3-0.5)/5*2)+") blur(5px)";
                            //}
                            if(cc.length<4){
                                e.style.backgroundColor="rgba("+cc[0]+","+cc[1]+","+cc[2]+","+Math.max(colorWild(cc),0)+")";
                                if(colorWild(cc)>0.125)e.classList.add("quaz")
                            }
                            e.style.boxShadow="none";
                        }
                    }
                }
}
var c=window.getComputedStyle( e , null).getPropertyValue( "border-left-color" );
            var mt=/${"\\d"}+/g;
if(c.match(mt)){
                var cc=c.match(mt).map(parseFloat);
                if(cc[0]+cc[1]+cc[2]>127*3&&(cc.length<4||cc[3]>0.25)){
                    e.style.borderLeftColor="rgba(255,255,255,0.16)";
                }
}
var c=window.getComputedStyle( e , null).getPropertyValue( "border-right-color" );
            var mt=/${"\\d"}+/g;
if(c.match(mt)){
                var cc=c.match(mt).map(parseFloat);
                if(cc[0]+cc[1]+cc[2]>127*3&&(cc.length<4||cc[3]>0.25)){
                    e.style.borderRightColor="rgba(255,255,255,0.16)";
                }
}
var c=window.getComputedStyle( e , null).getPropertyValue( "border-top-color" );
            var mt=/${"\\d"}+/g;
if(c.match(mt)){
                var cc=c.match(mt).map(parseFloat);
                if(cc[0]+cc[1]+cc[2]>127*3&&(cc.length<4||cc[3]>0.25)){
                    e.style.borderTopColor="rgba(255,255,255,0.16)";
                }
}
var c=window.getComputedStyle( e , null).getPropertyValue( "border-bottom-color" );
            var mt=/${"\\d"}+/g;
if(c.match(mt)){
                var cc=c.match(mt).map(parseFloat);
                if(cc[0]+cc[1]+cc[2]>127*3&&(cc.length<4||cc[3]>0.25)){
                    e.style.borderBottomColor="rgba(255,255,255,0.16)";
                }
}
            }
        }
        window.setInterval(magicWandTheme,10);
        //var v2=document.createElement("script");
        //v2.src="https://cdn.jsdelivr.net/npm/darkmode-js@1.5.3/lib/darkmode-js.min.js";
        //document.body.append(v2);
        //window.setTimeout(()=>{window.dark=new Darkmode();if(!window.dark.isActivated()){window.dark.toggle();}},1000);
    },1)`)
    // });
}

refresh.addEventListener('click', reloadView);
back.addEventListener('click', backView);
forward.addEventListener('click', forwardView);
omni.addEventListener('keydown', updateURL);
fave.addEventListener('click', addBookmark);
list.addEventListener('click', openPopUp);
popup.addEventListener('click', handleUrl);
dev.addEventListener('click', handleDevtools);
view().addEventListener('did-finish-load', updateNav);
// https://github.com/hokein/electron-sample-apps/blob/master/webview/browser/browser.js#L5
// To Do add dev tools open ✔️
// update url ✔️
// add bookmark by pressing button ✔️
// load all bookmarks when list is clicked ✔️



// To Do / Continue 
// Feedback when loading
// Feedback with favorite icon to show that bookmark is not-added/added/already-added
// Tabs !:@
// Option to remove bookmarks.  