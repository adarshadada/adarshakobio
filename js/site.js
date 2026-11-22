(function(){
  'use strict';
  function h(t,a){var e=document.createElement(t);a=a||{};Object.keys(a).forEach(function(k){var v=a[k];if(k==='class')e.className=v;else if(k in e)e[k]=v;else e.setAttribute(k,v);});for(var i=2;i<arguments.length;i++){[].concat(arguments[i]).forEach(function(c){if(c!=null&&c!==false&&c!=='')e.append(c);});}return e;}
  var S=window.SITE,nav=document.getElementById('nav'),main=document.getElementById('main'),foot=document.getElementById('foot');
  if(!S||!S.pages||!S.pages.length){main.textContent='The site content failed to load.';return;}
  function paras(t,c){return String(t||'').split(/\n\s*\n/).filter(function(p){return p.trim();}).map(function(p){return h('p',{class:c},p.trim());});}
  function fmt(d){var x=d?new Date(d+'T00:00:00'):null;return x&&!isNaN(x)?x.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}):'';}
  var R={
    profile:function(b){return h('div',{class:'profile'},b.image&&h('img',{class:'avatar',src:b.image,alt:b.alt||''}),h('div',{},h('h1',{},b.name||''),b.subtitle&&h('p',{class:'meta'},b.subtitle)));},
    lead:function(b){return paras(b.text,'lead pre');},
    heading:function(b){return h('h2',{},b.text||'');},
    text:function(b){return paras(b.text,'pre');},
    note:function(b){return h('p',{class:'meta pre'},b.text||'');},
    image:function(b){return h('figure',{class:'single'},h('img',{class:'photo',src:b.src||'',alt:b.alt||''}),b.caption&&h('figcaption',{},b.caption));},
    video:function(b){return h('div',{class:'vid'},h('video',{controls:true,preload:'metadata',playsInline:true,poster:b.poster||'',src:b.src||''}),b.caption&&h('p',{class:'meta'},b.caption));},
    links:function(b){return h('ul',{class:'links'},(b.items||[]).map(function(i){return h('li',{},h('a',{href:'#'+i.page},i.label,h('span',{},i.desc||'')));}));},
    gallery:function(b){return h('div',{class:'gal'},(b.items||[]).map(function(i){return h('figure',{},h('img',{src:i.src||'',alt:i.alt||'',loading:'lazy'}),i.caption&&h('figcaption',{},i.caption));}));},
    posts:function(b){return (b.items||[]).slice().sort(function(a,c){return String(c.date).localeCompare(String(a.date));}).map(function(p){return h('article',{},h('h2',{},p.title||'Untitled'),fmt(p.date)&&h('p',{class:'meta'},fmt(p.date)),h('div',{class:'post-body'},p.body||''));});}
  };
  nav.append(h('a',{class:'id',href:'#'+S.pages[0].slug},S.handle||S.name));
  S.pages.forEach(function(p){nav.append(h('a',{href:'#'+p.slug,'data-slug':p.slug},p.title));});
  foot.textContent=String(S.footer||'').replace('{year}',new Date().getFullYear());
  function route(){
    var slug=decodeURIComponent(location.hash.slice(1));
    var p=S.pages.filter(function(x){return x.slug===slug;})[0]||S.pages[0];
    main.textContent='';
    document.title=(p===S.pages[0]?'':p.title+' | ')+S.name+' ('+S.handle+')';
    if(p.showTitle!==false)main.append(h('h1',{},p.title));
    (p.blocks||[]).forEach(function(b){var f=R[b.type];if(f)[].concat(f(b)).forEach(function(n){if(n)main.append(n);});});
    Array.prototype.forEach.call(nav.querySelectorAll('a[data-slug]'),function(a){if(a.dataset.slug===p.slug)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    window.scrollTo(0,0);
  }
  window.addEventListener('hashchange',route);route();
  var dlg=document.getElementById('viewer'),big=dlg.querySelector('img');
  main.addEventListener('click',function(e){var im=e.target.closest&&e.target.closest('.gal img');if(im){big.src=im.src;big.alt=im.alt;dlg.showModal();}});
  dlg.addEventListener('click',function(e){if(e.target===dlg||e.target.tagName==='BUTTON')dlg.close();});
})();
