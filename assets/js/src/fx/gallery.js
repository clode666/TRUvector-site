/* TVFX · module Galerie — l'image s'agrandit depuis sa vignette (View
   Transitions), navigation ←/→, mosaïque qui se recompose en glissant,
   profondeur au gyroscope sur mobile. Remplace la lightbox d'origine. */
(function(){ var X=window.TVFX; if(!X) return;
  var gal=document.querySelector('.gallery'); if(!gal) return;
  X.safe('lightbox',function(){
    var figs=function(){ return [].slice.call(gal.querySelectorAll('.art')).filter(function(f){ return f.offsetParent!==null; }); };
    var lb=document.createElement('div'); lb.id='tvfx-lb'; lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true'); lb.setAttribute('aria-label','Image agrandie');
    lb.innerHTML='<figure><img alt=""><figcaption></figcaption></figure><button class="x" aria-label="Fermer">✕</button><button class="nv p" aria-label="Image précédente">‹</button><button class="nv n" aria-label="Image suivante">›</button>';
    document.body.appendChild(lb);
    var big=lb.querySelector('img'), cap=lb.querySelector('figcaption'), idx=-1, thumb=null;
    function vt(fn){ /* l'animation est un bonus : l'état change toujours, même si la transition cale */
      var done=false; function run(){ if(done) return; done=true; fn(); }
      if(document.startViewTransition&&!X.reduce&&!X.off){ try{ document.startViewTransition(run); }catch(e){ run(); } setTimeout(run,350); } else run(); }
    function srcOf(f){ var im=f.querySelector('img'); return im.currentSrc||im.src; }
    function show(i,morph){ var L=figs(); if(!L.length) return; idx=(i+L.length)%L.length; var f=L[idx];
      var go=function(){ if(thumb) thumb.style.viewTransitionName=''; thumb=f.querySelector('img');
        big.src=srcOf(f); big.alt=f.getAttribute('data-title')||''; cap.textContent=(f.getAttribute('data-title')||'')+'  ·  '+(idx+1)+' / '+L.length;
        lb.classList.add('on'); document.body.style.overflow='hidden'; lb.querySelector('.x').focus({preventScroll:true}); big.style.viewTransitionName='tv-art'; };
      if(morph){ f.querySelector('img').style.viewTransitionName='tv-art'; vt(function(){ f.querySelector('img').style.viewTransitionName=''; go(); }); }
      else go(); X.blip(700,.04); }
    function close(){ if(!lb.classList.contains('on')) return; var t=thumb;
      big.style.viewTransitionName=''; lb.classList.remove('on'); document.body.style.overflow='';   /* fermeture immédiate, sans minuterie */
      if(t) t.closest('.art').querySelector('.art-view').focus({preventScroll:true}); }
    /* capture : on intercepte avant la lightbox d'origine */
    document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('.gallery .art-view'); if(!b) return;
      e.stopPropagation(); e.preventDefault(); show(figs().indexOf(b.closest('.art')),true); },true);
    lb.querySelector('.x').onclick=close; lb.querySelector('.p').onclick=function(){ show(idx-1); }; lb.querySelector('.n').onclick=function(){ show(idx+1); };
    lb.addEventListener('click',function(e){ if(e.target===lb) close(); });
    addEventListener('keydown',function(e){ if(!lb.classList.contains('on')) return; if(e.key==='Escape'){ e.stopPropagation(); close(); } if(e.key==='ArrowRight') show(idx+1); if(e.key==='ArrowLeft') show(idx-1); },true);
    var sx=0; lb.addEventListener('touchstart',function(e){ sx=e.touches[0].clientX; },{passive:true});
    lb.addEventListener('touchend',function(e){ var dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>50) show(idx+(dx<0?1:-1)); },{passive:true});
  });
  X.safe('mosaic',function(){
    gal.classList.add('tvfx-mosaic'); if(X.reduce||X.off) return;
    var items=function(){ return [].slice.call(gal.children); }, last=null;
    function rects(){ var m=new Map(); items().forEach(function(el){ m.set(el,el.getBoundingClientRect()); }); return m; }
    last=rects(); var tm=0;
    function flip(){ var now=rects(); items().forEach(function(el){ var a=last.get(el), b=now.get(el); if(!a||!b) return; var dx=a.left-b.left, dy=a.top-b.top;
      if(Math.abs(dx)+Math.abs(dy)<2) return; el.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'}); }); last=now; }
    addEventListener('resize',function(){ clearTimeout(tm); tm=setTimeout(flip,60); });
    if(window.ResizeObserver) new ResizeObserver(function(){ clearTimeout(tm); tm=setTimeout(flip,60); }).observe(gal);
    items().forEach(function(el,i){ el.animate([{opacity:0,transform:'translateY(24px) scale(.97)'},{opacity:1,transform:'none'}],{duration:600,delay:i*70,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}); });
  });
  X.safe('gyro',function(){
    if(X.reduce||!X.full||X.fine||!window.DeviceOrientationEvent) return;
    function on(e){ var gx=Math.max(-20,Math.min(20,e.gamma||0))/20, gy=Math.max(-20,Math.min(20,(e.beta||45)-45))/20;
      gal.style.setProperty('--gx',(gx*8).toFixed(1)+'px'); gal.style.setProperty('--gy',(gy*8).toFixed(1)+'px'); }
    if(typeof DeviceOrientationEvent.requestPermission==='function'){
      var b=document.createElement('button'); b.className='btn btn-ghost tvfx-gyro'; b.type='button'; b.textContent='✦ Activer la profondeur 3D';
      b.onclick=function(){ DeviceOrientationEvent.requestPermission().then(function(s){ if(s==='granted'){ addEventListener('deviceorientation',on); gal.classList.add('tvfx-depth'); b.remove(); } }).catch(function(){}); };
      gal.parentNode.insertBefore(b,gal);
    } else { addEventListener('deviceorientation',on); gal.classList.add('tvfx-depth'); }
  });
})();
