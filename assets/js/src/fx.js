/* ============================================================
   TRUvector.dev — FX v2 · NOYAU (source lisible)
   Build : tools/build-fx.sh → assets/js/fx.js (minifié)
   Le noyau gère ce qui sert partout ; les effets propres à une page
   sont des modules chargés à la demande (assets/js/fx/<nom>.js) :
     music · article · gallery · modules · logiciels
   ============================================================ */
(function(){
  'use strict';
  if(window.TVFX) return;
  var root=document.documentElement;
  var me=(document.currentScript&&document.currentScript.src)||'';
  var ROOT=me.replace(/assets\/js\/fx\.js.*$/,'');
  var VER=(/[?&]v=([^&]+)/.exec(me)||[])[1]||'2';
  var CDN=(typeof window.TRU_ASSET_BASE==='string'&&window.TRU_ASSET_BASE)||'https://cdn.jsdelivr.net/gh/clode666/truvector-assets@main';
  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){ return null; } }
  function ss(k,v){ try{ if(v===undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k,v); }catch(e){ return null; } }
  function mq(q){ return window.matchMedia?matchMedia(q).matches:false; }
  function safe(n,fn){ try{ fn(); }catch(e){ if(window.console) console.warn('[TVFX] '+n,e); } }
  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  var path=location.pathname, reduce=mq('(prefers-reduced-motion: reduce)'), fine=mq('(pointer:fine)');
  /* v8 : on attend que render.js ait construit la page depuis config.json, puis on applique les réglages de l'admin (cfg.fx) */
  (window.TVReady||Promise.resolve(null)).then(function(){ boot(window.TVCONFIG||{}); });
  function boot(CFG){
  var F=CFG.fx||{}; function on(k){ return F[k]!==false; }

  /* ---------- PHASE 1 · détecteur de puissance ---------- */
  function detect(){
    var p=ls('tv_fx'); if(p==='full'||p==='lite'||p==='off') return p;
    if(F.level==='full'||F.level==='lite'||F.level==='off') return (F.level==='full'&&reduce)?'lite':F.level;
    if(reduce) return 'lite';
    var c=navigator.connection; if(c&&c.saveData) return 'lite';
    if((navigator.deviceMemory||8)<=2||(navigator.hardwareConcurrency||8)<=2) return 'lite';
    return 'full';
  }
  var LEVEL=detect(); root.setAttribute('data-fx',LEVEL);
  var FULL=LEVEL==='full', OFF=LEVEL==='off';
  var cfgP=null;
  function config(){ if(window.TVCONFIG&&window.TVCONFIG.catalog) return Promise.resolve(window.TVCONFIG); return cfgP||(cfgP=fetch(ROOT+'config.json',{cache:'no-cache'}).then(function(r){ return r.ok?r.json():{}; }).catch(function(){ return {}; })); }
  function toast(m){ var t=document.querySelector('.tvfx-toast'); if(!t){ t=document.createElement('div'); t.className='tvfx-toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
    t.textContent=m; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(function(){ t.classList.remove('show'); },2200); }
  var TVFX=window.TVFX={ level:LEVEL, full:FULL, off:OFF, reduce:reduce, fine:fine, root:ROOT, cdn:CDN, bass:0,
    ls:ls, ss:ss, safe:safe, norm:norm, esc:esc, toast:toast, config:config };

  /* ---------- chargeur de modules de page ---------- */
  function need(name){ var s=document.createElement('script'); s.src=ROOT+'assets/js/fx/'+name+'.js?v='+VER; s.async=true; document.body.appendChild(s); }
  safe('loader',function(){
    if(document.getElementById('tvaudio')) need('music');
    if(document.querySelector('.article')) need('article');
    if(document.querySelector('.gallery .art')) need('gallery');
    if(/\/modules\/(index\.html)?$/.test(path)) need('modules');
    if(/\/logiciels\/(index\.html)?$/.test(path)||document.querySelector('[data-tvfx-term]')) need('logiciels');
  });

  /* ---------- PHASE 6 · ciel selon l'heure ---------- */
  function skyColors(){ var h=new Date().getHours();
    if(h>=5&&h<9)   return [[1,.48,.71],[.96,.77,.42],[.69,.29,.93]];
    if(h>=9&&h<18)  return [[.35,.89,.6],[.49,.78,1],[.69,.29,.93]];
    if(h>=18&&h<22) return [[1,.48,.71],[.69,.29,.93],[.2,.96,.77]];
    return [[.35,.89,.6],[.2,.96,.77],[.69,.29,.93]]; }

  /* ---------- PHASE 2 · aurore WebGL + ciel étoilé en parallaxe ---------- */
  safe('sky',function(){
    if(!FULL||!on('sky')) return;
    var cv=document.createElement('canvas'); cv.id='tvfx-sky'; cv.setAttribute('aria-hidden','true');
    document.body.insertBefore(cv,document.body.firstChild);
    var gl=cv.getContext('webgl',{antialias:false,alpha:false,powerPreference:'low-power'});
    if(!gl){ cv.remove(); return; }
    var fs=[
      'precision mediump float;uniform vec2 r;uniform float t,b,sc,sy;uniform vec2 m;uniform vec3 c0,c1,c2;',
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
      'float fbm(vec2 p){float v=0.,a=.5;for(int k=0;k<5;k++){v+=a*n(p);p*=2.02;a*=.5;}return v;}',
      'float st(vec2 fc,float d,float off,float th){vec2 p=floor((fc+vec2(0.,off))*d);return step(th,h(p))*(.45+.55*sin(t*(1.+h(p+7.)*2.)+h(p+3.)*40.));}',
      'void main(){vec2 uv=gl_FragCoord.xy/r;vec2 q=uv;q.x*=r.x/r.y;float lean=(m.x-.5)*.35;',
      ' vec3 col=vec3(.027,.043,.067);',
      ' for(int k=0;k<3;k++){float fk=float(k);float x=q.x*1.3+fk*1.7+lean*(1.+fk*.4);',
      '  float w=fbm(vec2(x*1.2,t*.06+fk))*.5+.52+fk*.07+(m.y-.5)*.06+sc*.25;',
      '  float d=uv.y-w;float cu=exp(-abs(d)*(9.-fk*2.))*smoothstep(-.35,.05,d);',
      '  float ra=.55+.45*fbm(vec2(x*9.,t*.18+fk*3.));',
      '  vec3 c=k==0?c0:(k==1?c1:c2);col+=c*cu*ra*(.5-fk*.08)*(1.+b*1.6);}',
      /* 3 couches d'étoiles, chacune défile à sa vitesse avec le scroll (parallaxe) */
      ' float s='+(on('stars')?'':'0.;//')+'st(gl_FragCoord.xy,.9,sy*.08*r.y,.9982)*.45+st(gl_FragCoord.xy,.55,sy*.22*r.y,.9985)*.7+st(gl_FragCoord.xy,.32,sy*.5*r.y,.9983);',
      ' col+=vec3(s)*.8*smoothstep(.05,.7,uv.y);',
      ' col*=mix(1.,.55,sc);gl_FragColor=vec4(col,1.);}'].join('\n');
    function sh(tp,src){ var s=gl.createShader(tp); gl.shaderSource(s,src); gl.compileShader(s); return s; }
    var pr=gl.createProgram(); gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}')); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){ cv.remove(); return; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    var loc=gl.getAttribLocation(pr,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    var U={}; 'r t b sc sy m c0 c1 c2'.split(' ').forEach(function(k){ U[k]=gl.getUniformLocation(pr,k); });
    var P=on('skyByHour')?skyColors():[[.35,.89,.6],[.2,.96,.77],[.69,.29,.93]]; gl.uniform3fv(U.c0,P[0]); gl.uniform3fv(U.c1,P[1]); gl.uniform3fv(U.c2,P[2]);
    var mx=.5,my=.5,tx=.5,ty=.5,last=0,t0=performance.now(),bs=0,scr=0;
    function size(){ var d=Math.min(window.devicePixelRatio||1,1.5)*.5; cv.width=Math.max(1,innerWidth*d|0); cv.height=Math.max(1,innerHeight*d|0); gl.viewport(0,0,cv.width,cv.height); }
    size(); addEventListener('resize',size);
    addEventListener('pointermove',function(e){ tx=e.clientX/innerWidth; ty=1-e.clientY/innerHeight; },{passive:true});
    function frame(now){ requestAnimationFrame(frame);
      if(document.hidden||now-last<33) return; last=now;
      mx+=(tx-mx)*.05; my+=(ty-my)*.05; bs+=(TVFX.bass-bs)*.35;
      var y=(window.scrollY||0)/innerHeight, s=Math.min(1,y/1.2); scr+=(s-scr)*.1;
      gl.uniform2f(U.r,cv.width,cv.height); gl.uniform1f(U.t,(now-t0)/1000); gl.uniform2f(U.m,mx,my);
      gl.uniform1f(U.b,bs); gl.uniform1f(U.sc,scr); gl.uniform1f(U.sy,y); gl.drawArrays(gl.TRIANGLES,0,3); }
    requestAnimationFrame(frame);
    root.classList.add('fx-gl');
    if(on('shooting')) (function shoot(){ setTimeout(function(){ if(!document.hidden){ var s=document.createElement('i'); s.className='tvfx-shoot';
      s.style.left=(45+Math.random()*50)+'vw'; s.style.top=(4+Math.random()*28)+'vh'; document.body.appendChild(s); setTimeout(function(){ s.remove(); },1300); }
      shoot(); },14000+Math.random()*16000); })();
  });

  /* ---------- PHASE 2 · guirlandes reliées en constellation ---------- */
  safe('lights',function(){
    if(!FULL||!fine||!on('lights')) return;
    var hero=document.querySelector('.section-hero,.art-hero,header.hero'); if(!hero) return;
    var L=hero.querySelector('.lights');
    if(!L){ L=document.createElement('div'); L.className='lights'; L.setAttribute('aria-hidden','true'); L.innerHTML=new Array(15).join('<i></i>'); hero.insertBefore(L,hero.firstChild); }
    if(getComputedStyle(hero).position==='static') hero.style.position='relative';
    var cv=document.createElement('canvas'); cv.className='tvfx-const'; cv.setAttribute('aria-hidden','true'); hero.insertBefore(cv,L);
    var g=cv.getContext('2d'), pts=[], mx=-999, my=-999, raf=0, dpr=Math.min(window.devicePixelRatio||1,2);
    function measure(){ var hr=hero.getBoundingClientRect(); cv.width=hr.width*dpr; cv.height=Math.min(hr.height,260)*dpr; cv.style.height=Math.min(hr.height,260)+'px';
      pts=[].map.call(L.querySelectorAll('i'),function(i){ var r=i.getBoundingClientRect(); return {x:(r.left-hr.left+r.width/2)*dpr,y:(r.top-hr.top+r.height/2)*dpr}; }); draw(); }
    function draw(){ raf=0; g.clearRect(0,0,cv.width,cv.height); var R=150*dpr, near=[];
      pts.forEach(function(p){ var d=Math.hypot(p.x-mx,p.y-my); if(d<R) near.push([p,1-d/R]); });
      g.lineWidth=1.2*dpr;
      near.forEach(function(a,i){ g.strokeStyle='rgba(244,197,107,'+(a[1]*.75).toFixed(3)+')'; g.beginPath(); g.moveTo(a[0].x,a[0].y); g.lineTo(mx,my); g.stroke();
        for(var j=i+1;j<near.length;j++){ var b=near[j]; g.strokeStyle='rgba(143,243,217,'+(Math.min(a[1],b[1])*.55).toFixed(3)+')'; g.beginPath(); g.moveTo(a[0].x,a[0].y); g.lineTo(b[0].x,b[0].y); g.stroke(); } });
      if(near.length){ g.fillStyle='rgba(244,197,107,.9)'; g.beginPath(); g.arc(mx,my,2.4*dpr,0,7); g.fill(); } }
    hero.addEventListener('pointermove',function(e){ var r=hero.getBoundingClientRect(); mx=(e.clientX-r.left)*dpr; my=(e.clientY-r.top)*dpr; if(!raf) raf=requestAnimationFrame(draw); });
    hero.addEventListener('pointerleave',function(){ mx=my=-999; if(!raf) raf=requestAnimationFrame(draw); });
    addEventListener('resize',measure); setTimeout(measure,200);
  });

  /* ---------- PHASE 2 · triskèle qui se dessine ---------- */
  safe('triskele',function(){
    if(OFF||reduce||ss('tvfx_drawn')) return;
    var t=document.querySelector('.section-hero .triskele, .hero .triskele, .art-hero .triskele'); if(!t) return;
    t.querySelectorAll('path').forEach(function(p){ p.setAttribute('pathLength','1'); });
    t.classList.add('tvfx-draw'); ss('tvfx_drawn','1');
  });

  /* ---------- PHASE 3 · cartes 3D + projecteur ---------- */
  var CARDS='.sec-card,.post-card,.eb-card,.hub-card,.sc-card,.maker-card,.tvfx-rel a';
  TVFX.CARDS=CARDS;
  safe('cards',function(){
    if(OFF) return;
    document.querySelectorAll(CARDS).forEach(function(c){ c.classList.add('tvfx-card'); });
    if(!fine||!FULL||!on('cards3d')) return;
    var cur=null,raf=0,ev=null;
    function leave(c){ c.classList.remove('tvfx-on'); c.style.transform=''; }
    document.addEventListener('pointermove',function(e){ ev=e; if(raf) return; raf=requestAnimationFrame(function(){ raf=0;
      var c=ev.target&&ev.target.closest?ev.target.closest(CARDS):null;
      if(c!==cur){ if(cur) leave(cur); cur=c; if(c) c.classList.add('tvfx-card','tvfx-on'); }
      if(!c) return;
      var r=c.getBoundingClientRect(), x=(ev.clientX-r.left)/r.width, y=(ev.clientY-r.top)/r.height;
      c.style.setProperty('--mx',(x*100).toFixed(1)+'%'); c.style.setProperty('--my',(y*100).toFixed(1)+'%');
      c.style.transform='perspective(900px) rotateX('+((.5-y)*6).toFixed(2)+'deg) rotateY('+((x-.5)*8).toFixed(2)+'deg) translateY(-3px)'; }); },{passive:true});
    document.addEventListener('pointerleave',function(){ if(cur){ leave(cur); cur=null; } });
  });

  /* ---------- PHASE 3 · boutons magnétiques + onde ---------- */
  safe('buttons',function(){
    if(OFF) return;
    document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('.btn'); if(!b) return;
      var r=b.getBoundingClientRect(), d=Math.max(r.width,r.height), s=document.createElement('span');
      s.className='tvfx-rip'; s.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';
      b.appendChild(s); setTimeout(function(){ s.remove(); },650); });
    if(!fine||!FULL||!on('magnetic')) return;
    var mag=null;
    document.addEventListener('pointermove',function(e){ var b=e.target.closest&&e.target.closest('.btn:not(:disabled)');
      if(mag&&mag!==b){ mag.style.transform=''; mag=null; } if(!b) return; mag=b;
      var r=b.getBoundingClientRect(); b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.18).toFixed(1)+'px,'+((e.clientY-r.top-r.height/2)*.28).toFixed(1)+'px)'; },{passive:true});
  });

  /* ---------- PHASE 3 · apparitions au scroll ---------- */
  safe('reveal',function(){ if(!FULL||!on('reveal')) return;
    document.querySelectorAll('.sec-card,.eb-card,.post-card,.player,.playlist li,.legal section,.article h2,.article pre,.article table').forEach(function(el){ if(!el.classList.contains('reveal')) el.classList.add('tvfx-reveal'); }); });

  /* ---------- PHASE 3 · halo curseur ---------- */
  safe('halo',function(){
    if(!FULL||!fine||!on('halo')) return;
    var h=document.createElement('div'); h.id='tvfx-halo'; h.setAttribute('aria-hidden','true'); document.body.appendChild(h);
    var x=-100,y=-100,hx=-100,hy=-100;
    addEventListener('pointermove',function(e){ x=e.clientX; y=e.clientY; h.classList.add('on');
      h.classList.toggle('big',!!(e.target.closest&&e.target.closest('a,button,[role=button],input,select,textarea,label,.art-view'))); },{passive:true});
    document.addEventListener('pointerleave',function(){ h.classList.remove('on'); });
    (function loop(){ requestAnimationFrame(loop); if(Math.abs(x-hx)+Math.abs(y-hy)<.3) return; hx+=(x-hx)*.22; hy+=(y-hy)*.22; h.style.transform='translate('+hx.toFixed(1)+'px,'+hy.toFixed(1)+'px)'; })();
  });

  /* ---------- PHASE 5 · favoris ♥ ---------- */
  function favs(){ try{ return JSON.parse(ls('tv_favs')||'[]'); }catch(e){ return []; } }
  TVFX.favs=favs;
  safe('favs',function(){
    if(OFF) return;
    function info(card){ var h=card.querySelector('h3'), a=card.matches('a')?card:card.querySelector('a[href]');
      return {t:h?h.textContent.trim():'', u:a?new URL(a.getAttribute('href'),location.href).href:location.href}; }
    function add(card){ if(card.querySelector(':scope > .tvfx-fav')) return; var i=info(card); if(!i.t) return;
      var on=favs().some(function(f){ return f.u===i.u; }), b=document.createElement('button');
      b.type='button'; b.className='tvfx-fav'; b.setAttribute('aria-label','Favori : '+i.t); b.setAttribute('aria-pressed',on?'true':'false'); b.textContent=on?'♥':'♡';
      b.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); var list=favs(), k=-1;
        list.forEach(function(f,j){ if(f.u===i.u) k=j; });
        if(k>=0){ list.splice(k,1); b.textContent='♡'; b.setAttribute('aria-pressed','false'); toast('Retiré des favoris'); }
        else { list.unshift({t:i.t,u:i.u,s:document.title.split('—')[0].trim()}); b.textContent='♥'; b.setAttribute('aria-pressed','true'); toast('Ajouté aux favoris — retrouve-les avec Ctrl+K'); }
        ls('tv_favs',JSON.stringify(list.slice(0,80))); });
      card.appendChild(b); }
    function scan(){ document.querySelectorAll('.post-card,.eb-card,.sec-card').forEach(add); }
    scan(); TVFX.rescan=scan;
    var posts=document.getElementById('posts'); if(posts&&window.MutationObserver) new MutationObserver(scan).observe(posts,{childList:true});
  });

  /* ---------- PHASE 6 · sons d'interface (optionnels) ---------- */
  var sfx=null;
  if(F.sounds===true&&ls('tv_sfx')==null) ls('tv_sfx','1');
  function blip(f,d,type){ if(ls('tv_sfx')!=='1') return; try{ sfx=sfx||new (window.AudioContext||window.webkitAudioContext)();
    var o=sfx.createOscillator(), g=sfx.createGain(); o.type=type||'sine'; o.frequency.value=f; g.gain.setValueAtTime(.05,sfx.currentTime); g.gain.exponentialRampToValueAtTime(.0001,sfx.currentTime+(d||.07));
    o.connect(g); g.connect(sfx.destination); o.start(); o.stop(sfx.currentTime+(d||.07)); }catch(e){} }
  TVFX.blip=blip;
  document.addEventListener('click',function(e){ if(e.target.closest&&e.target.closest('a,button')) blip(880,.05,'triangle'); },true);

  /* ---------- PHASE 6 · Konami → Matrix aurore ---------- */
  function matrix(){ if(TVFX._mx&&TVFX.matrix!==matrix){ return TVFX.matrix(); } TVFX._mx=1; need('matrix'); }
  TVFX.matrix=matrix;
  (function(){ var seq=['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'], k=0;
    if(on('konami')) addEventListener('keydown',function(e){ var key=(e.key||'').toLowerCase(); k=(key===seq[k])?k+1:(key===seq[0]?1:0); if(k===seq.length){ k=0; matrix(); } }); })();

  /* ---------- PHASE 5 · palette Ctrl+K : bouton + raccourci ; module chargé au 1er usage ---------- */
  function openPal(){ if(TVFX.palette) return TVFX.palette(); if(TVFX._pl) return; TVFX._pl=1; need('palette'); }
  if(on('palette')) addEventListener('keydown',function(e){ if(!(e.ctrlKey||e.metaKey)||(e.key||'').toLowerCase()!=='k') return; e.preventDefault();
    if(TVFX.paletteOpen&&TVFX.paletteOpen()) TVFX.closePalette(); else openPal(); });
  TVFX.openPalette=openPal;
  safe('kbtn',function(){ if(!on('palette')) return; var row=document.querySelector('.site-nav .row'); if(!row) return;
    var b=document.createElement('button'); b.type='button'; b.className='tvfx-kbtn'; b.setAttribute('aria-label','Recherche globale (Ctrl+K)');
    b.innerHTML='<span aria-hidden="true">⌕</span><kbd>Ctrl K</kbd>'; b.onclick=openPal; row.appendChild(b); });

  /* précharge le catalogue quand le navigateur est inactif : palette instantanée */
  (window.requestIdleCallback||function(f){ setTimeout(f,1500); })(function(){ config(); });

  /* ---------- PHASE 6 · site installable (PWA) ---------- */
  safe('pwa',function(){ if(!on('pwa')||!('serviceWorker' in navigator)||location.protocol!=='https:') return;
    addEventListener('load',function(){ navigator.serviceWorker.register(ROOT+'sw.js').catch(function(){}); }); });
  } /* fin boot */
})();
