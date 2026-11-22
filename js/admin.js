(function(){
  'use strict';
  var $=function(i){return document.getElementById(i);};
  function h(t,a){var e=document.createElement(t);a=a||{};Object.keys(a).forEach(function(k){var v=a[k];if(k==='class')e.className=v;else if(k.indexOf('on')===0)e.addEventListener(k.slice(2),v);else if(k in e)e[k]=v;else e.setAttribute(k,v);});for(var i=2;i<arguments.length;i++){[].concat(arguments[i]).forEach(function(c){if(c!=null&&c!==false)e.append(c);});}return e;}
  var S=null,sha=null,cfg=null,cur=0,dirty=false,mode='github',PATH='data/content.js';
  var TYPES={profile:'Profile header',lead:'Intro text',heading:'Heading',text:'Paragraphs',note:'Small note',image:'Image',video:'Video',links:'Link list',gallery:'Photo gallery',posts:'Writing posts'};
  var LBL={name:'Name',subtitle:'Subtitle',text:'Text',image:'Profile picture',src:'File',alt:'Alt text (describe the image)',caption:'Caption',poster:'Video cover image',title:'Title',date:'Date',body:'Text (blank line = new stanza)',label:'Label',desc:'Short description',page:'Page slug to link to'};
  var FIELDS={
    profile:[['image','img'],['name','text'],['subtitle','text'],['alt','text']],
    lead:[['text','area']],heading:[['text','text']],text:[['text','area']],note:[['text','area']],
    image:[['src','img'],['alt','text'],['caption','text']],
    video:[['src','vid'],['poster','img'],['caption','text']],
    links:[['items','list',[['label','text'],['desc','text'],['page','text']]]],
    gallery:[['items','list',[['src','img'],['alt','text'],['caption','text']]]],
    posts:[['items','list',[['title','text'],['date','date'],['body','area']]]]
  };
  function blank(t){var b={type:t};FIELDS[t].forEach(function(f){b[f[0]]=f[1]==='list'?[]:'';});return b;}
  function say(t,bad){var m=$('msg');m.textContent=t;m.className='meta'+(bad?' bad':'');}
  function mark(){dirty=true;$('state').textContent='Unsaved changes';}
  window.addEventListener('beforeunload',function(e){if(dirty){e.preventDefault();e.returnValue='';}});
  function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}

  // ---- GitHub helpers
  function gh(p,o){o=o||{};return fetch('https://api.github.com/repos/'+cfg.repo+p,{method:o.method||'GET',headers:{'Authorization':'Bearer '+cfg.token,'Accept':'application/vnd.github+json','Content-Type':'application/json'},body:o.body?JSON.stringify(o.body):undefined});}
  function b64(buf){var b=new Uint8Array(buf),s='',n=0x8000;for(var i=0;i<b.length;i+=n)s+=String.fromCharCode.apply(null,b.subarray(i,i+n));return btoa(s);}
  function unb64(s){var bin=atob(s.replace(/\s/g,'')),b=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);return new TextDecoder().decode(b);}
  function parse(t){return JSON.parse(t.slice(t.indexOf('{')).replace(/;\s*$/,''));}
  function outText(){return '// Edited by admin.html. You can also edit by hand.\nwindow.SITE = '+JSON.stringify(S,null,2)+';\n';}
  function store(){try{var s=JSON.stringify(cfg);localStorage.removeItem('np_cfg');sessionStorage.removeItem('np_cfg');(($('remember').checked)?localStorage:sessionStorage).setItem('np_cfg',s);}catch(e){}}
  function ref(){return '?ref='+encodeURIComponent(cfg.branch);}

  async function connect(){
    cfg={repo:$('repo').value.trim(),branch:$('branch').value.trim()||'main',token:$('token').value.trim()};
    if(!/^[\w.-]+\/[\w.-]+$/.test(cfg.repo)||!cfg.token){say('Enter the repo as owner/name and your token.',1);return;}
    say('Connecting...');
    try{
      var r=await gh('/contents/'+PATH+ref());
      if(r.status===401||r.status===403){say('GitHub refused the token. It needs Contents read and write for this repo.',1);return;}
      if(r.status===404){say('Could not find data/content.js on that repo and branch. Check the names and that the site files are uploaded.',1);return;}
      if(!r.ok){say('GitHub returned error '+r.status+'.',1);return;}
      var j=await r.json();sha=j.sha;S=parse(unb64(j.content));
      store();mode='github';start();
    }catch(e){say('Could not reach GitHub: '+e.message,1);}
  }
  function startLocal(){S=JSON.parse(JSON.stringify(window.SITE));mode='local';start();}
  function start(){$('login').hidden=true;$('app').hidden=false;cur=0;dirty=false;$('state').textContent='';$('mode').textContent=mode==='github'?cfg.repo:'Local mode (download only)';say('');draw();}
  function disconnect(){if(dirty&&!confirm('You have unsaved changes. Leave anyway?'))return;try{localStorage.removeItem('np_cfg');sessionStorage.removeItem('np_cfg');}catch(e){}dirty=false;location.reload();}

  function validate(){
    var seen={};
    for(var i=0;i<S.pages.length;i++){var p=S.pages[i];p.slug=slug(p.slug||p.title);
      if(!p.slug){say('Every page needs a slug.',1);return false;}
      if(seen[p.slug]){say('Two pages share the slug "'+p.slug+'". Make them different.',1);return false;}seen[p.slug]=1;}
    return true;
  }
  function download(){var a=h('a',{href:URL.createObjectURL(new Blob([outText()],{type:'text/javascript'})),download:'content.js'});document.body.append(a);a.click();a.remove();}
  async function save(){
    if(!validate())return;
    if(mode==='local'){download();dirty=false;$('state').textContent='';say('Downloaded content.js. Put it in the data folder of your site.');return;}
    say('Saving...');
    try{
      var body={message:'Update site content',content:b64(new TextEncoder().encode(outText())),branch:cfg.branch,sha:sha};
      var r=await gh('/contents/'+PATH,{method:'PUT',body:body});
      if(r.status===409||r.status===422){var g=await gh('/contents/'+PATH+ref());body.sha=(await g.json()).sha;r=await gh('/contents/'+PATH,{method:'PUT',body:body});}
      if(!r.ok){say('Save failed (error '+r.status+'). Check your token permissions.',1);return;}
      sha=(await r.json()).content.sha;dirty=false;$('state').textContent='All changes saved';
      say('Saved. The live site updates in about a minute.');draw();
    }catch(e){say('Save failed: '+e.message,1);}
  }
  async function upload(file,kind){
    if(mode!=='github')throw new Error('Uploads need GitHub mode. Copy the file into the site folder and type its path instead.');
    var folder=kind==='img'?'images/':'videos/',ext=kind==='img'?'.jpg':(file.name.match(/\.[a-z0-9]+$/i)||['.mp4'])[0].toLowerCase(),buf;
    if(kind==='img'){
      try{var bm=await createImageBitmap(file),sc=Math.min(1,1600/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*sc);c.height=Math.round(bm.height*sc);var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(bm,0,0,c.width,c.height);buf=await (await new Promise(function(r){c.toBlob(r,'image/jpeg',0.82);})).arrayBuffer();}
      catch(e){buf=await file.arrayBuffer();ext=(file.name.match(/\.[a-z0-9]+$/i)||['.jpg'])[0].toLowerCase();}
    }else{
      if(file.size>30*1024*1024)throw new Error('That video is over 30 MB. Compress it first.');
      buf=await file.arrayBuffer();
    }
    var path=folder+(slug(file.name.replace(/\.[^.]+$/,''))||'file')+'-'+Date.now().toString(36)+ext;
    say('Uploading '+path+'...');
    var r=await gh('/contents/'+path,{method:'PUT',body:{message:'Upload '+path,content:b64(buf),branch:cfg.branch}});
    if(!r.ok)throw new Error('Upload failed (error '+r.status+').');
    return path;
  }

  // ---- editor UI
  var LBLKEYS=function(key,kind){return kind==='vid'&&key==='src'?'Video file':(LBL[key]||key);};
  function field(obj,key,kind,label){
    var id='f'+Math.random().toString(36).slice(2),lab=h('label',{for:id},label||LBLKEYS(key,kind)),inp;
    if(kind==='img'||kind==='vid'){
      var prev=kind==='img'?h('img',{class:'thumb',alt:'',src:obj[key]||''}):null;
      inp=h('input',{id:id,type:'text',value:obj[key]||'',oninput:function(e){obj[key]=e.target.value;if(prev)prev.src=e.target.value;mark();}});
      var f=h('input',{type:'file',accept:kind==='img'?'image/*':'video/*',onchange:function(e){var file=e.target.files[0];if(!file)return;upload(file,kind).then(function(p){obj[key]=p;inp.value=p;if(prev)prev.src=URL.createObjectURL(file);mark();say('Uploaded '+p+'. Remember to Save.');}).catch(function(er){say(er.message,1);});}});
      return h('div',{},lab,inp,f,prev);
    }
    if(kind==='area')inp=h('textarea',{id:id,class:key==='body'?'tall':'',value:obj[key]||'',oninput:function(e){obj[key]=e.target.value;mark();}});
    else inp=h('input',{id:id,type:kind==='date'?'date':'text',value:obj[key]||'',oninput:function(e){obj[key]=e.target.value;mark();}});
    return h('div',{},lab,inp);
  }
  function acts(arr,i,redraw){
    function mv(d){var j=i+d;if(j<0||j>=arr.length)return;var t=arr[i];arr[i]=arr[j];arr[j]=t;mark();redraw();}
    return h('div',{class:'row'},
      h('button',{type:'button',class:'btn alt sm',onclick:function(){mv(-1);}},'Up'),
      h('button',{type:'button',class:'btn alt sm',onclick:function(){mv(1);}},'Down'),
      h('button',{type:'button',class:'btn alt sm',onclick:function(){if(confirm('Remove this?')){arr.splice(i,1);mark();redraw();}}},'Remove'));
  }
  function listField(obj,f){
    var key=f[0],subs=f[2],wrap=h('div',{});
    function dr(){wrap.textContent='';obj[key].forEach(function(it,i){wrap.append(h('div',{class:'sub'},h('div',{class:'bh'},h('strong',{},'Item '+(i+1)),acts(obj[key],i,dr)),subs.map(function(s){return field(it,s[0],s[1]);})));});
      wrap.append(h('button',{type:'button',class:'btn alt sm',onclick:function(){var n={};subs.forEach(function(s){n[s[0]]='';});obj[key].push(n);mark();dr();}},'Add item'));}
    dr();return wrap;
  }
  function drawSite(){var c=$('siteFields');c.textContent='';c.append(field(S,'name','text','Your name'),field(S,'handle','text','Short name shown in the menu'),field(S,'footer','text','Footer text (use {year} for the current year)'));}
  function drawPages(){
    var c=$('pages');c.textContent='';var p=S.pages[cur];
    var sel=h('select',{id:'psel',onchange:function(e){cur=+e.target.value;drawPages();}},S.pages.map(function(q,i){return h('option',{value:i,selected:i===cur},q.title||q.slug);}));
    var newT=h('input',{type:'text',placeholder:'New page title',autocomplete:'off'});
    function mvPage(d){var j=cur+d;if(j<0||j>=S.pages.length)return;var t=S.pages[cur];S.pages[cur]=S.pages[j];S.pages[j]=t;cur=j;mark();drawPages();}
    c.append(h('label',{for:'psel'},'Page to edit'),sel,
      h('div',{class:'row'},
        h('button',{type:'button',class:'btn alt sm',onclick:function(){mvPage(-1);}},'Move earlier in menu'),
        h('button',{type:'button',class:'btn alt sm',onclick:function(){mvPage(1);}},'Move later in menu'),
        h('button',{type:'button',class:'btn alt sm',onclick:function(){if(S.pages.length<2){say('Keep at least one page.',1);return;}if(confirm('Delete the page "'+p.title+'"?')){S.pages.splice(cur,1);cur=0;mark();drawPages();}}},'Delete this page')),
      h('label',{},'Add a page'),newT,
      h('div',{class:'row'},h('button',{type:'button',class:'btn alt sm',onclick:function(){var t=newT.value.trim();if(!t){say('Type a title for the new page.',1);return;}S.pages.push({slug:slug(t),title:t,showTitle:true,blocks:[]});cur=S.pages.length-1;mark();say('');drawPages();}},'Add page')));
    var tf=field(p,'title','text','Page title');tf.querySelector('input').addEventListener('change',drawPages);
    c.append(h('h3',{},'This page'),tf,field(p,'slug','text','Page slug (the part after # in the address)'),
      h('label',{class:'chk'},h('input',{type:'checkbox',checked:p.showTitle!==false,onchange:function(e){p.showTitle=e.target.checked;mark();}}),'Show the page title at the top'));
    var bw=h('div',{});
    function drB(){bw.textContent='';p.blocks.forEach(function(b,i){
      bw.append(h('div',{class:'block'},h('div',{class:'bh'},h('strong',{},TYPES[b.type]||b.type),acts(p.blocks,i,drB)),
        (FIELDS[b.type]||[]).map(function(f){return f[1]==='list'?listField(b,f):field(b,f[0],f[1]);})));});}
    drB();
    var ts=h('select',{id:'ntype'},Object.keys(TYPES).map(function(k){return h('option',{value:k},TYPES[k]);}));
    c.append(h('h3',{},'Content blocks'),bw,h('label',{for:'ntype'},'Add a block'),ts,
      h('div',{class:'row'},h('button',{type:'button',class:'btn alt sm',onclick:function(){p.blocks.push(blank(ts.value));mark();drB();}},'Add block')));
  }
  function draw(){drawSite();drawPages();}

  // ---- wire up
  $('connect').addEventListener('click',connect);
  $('local').addEventListener('click',startLocal);
  $('save').addEventListener('click',save);
  $('dl').addEventListener('click',download);
  $('out').addEventListener('click',disconnect);
  try{var sv=JSON.parse(localStorage.getItem('np_cfg')||sessionStorage.getItem('np_cfg')||'null');if(sv){$('repo').value=sv.repo;$('branch').value=sv.branch;$('token').value=sv.token;$('remember').checked=!!localStorage.getItem('np_cfg');}}catch(e){}
  if(!$('repo').value){var m=location.hostname.match(/^([^.]+)\.github\.io$/);if(m){var seg=location.pathname.split('/')[1];$('repo').value=m[1]+'/'+((!seg||/\.html$/.test(seg))?m[1]+'.github.io':seg);}}
})();
