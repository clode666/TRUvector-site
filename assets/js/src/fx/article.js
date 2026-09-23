/* TVFX · module Article — barre de lecture, temps de lecture, bouton Copier,
   sommaire qui suit le scroll, « Tu aimeras aussi » (tags communs). */
(function(){ var X=window.TVFX; if(!X) return; var esc=X.esc;
  var art=document.querySelector('.article'); if(!art) return;
  X.safe('reading',function(){
    var words=(art.textContent||'').trim().split(/\s+/).length, min=Math.max(1,Math.round(words/220));
    var hero=document.querySelector('.art-hero .in')||document.querySelector('.art-hero');
    if(hero&&!hero.querySelector('.tvfx-rt')){ var rt=document.createElement('span'); rt.className='tvfx-rt'; rt.textContent='⏱ '+min+' min de lecture · '+words.toLocaleString('fr-FR')+' mots'; hero.appendChild(rt); }
    var bar=document.createElement('div'); bar.id='tvfx-progress'; bar.setAttribute('aria-hidden','true'); document.body.appendChild(bar);
    var tk=0; function upd(){ tk=0; var r=art.getBoundingClientRect(), tot=r.height-innerHeight*.6, p=Math.min(1,Math.max(0,(-r.top+innerHeight*.2)/Math.max(1,tot))); bar.style.setProperty('--p',p.toFixed(4)); }
    addEventListener('scroll',function(){ if(!tk) tk=requestAnimationFrame(upd); },{passive:true}); upd();
  });
  X.safe('copy',function(){ art.querySelectorAll('pre').forEach(function(pre){ var b=document.createElement('button'); b.type='button'; b.className='tvfx-copy'; b.textContent='Copier';
    b.onclick=function(){ var txt=(pre.querySelector('code')||pre).innerText.replace(/\n?Copier$/,'');
      (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){ b.textContent='Copié ✓'; b.classList.add('done'); setTimeout(function(){ b.textContent='Copier'; b.classList.remove('done'); },1600); })
      .catch(function(){ X.toast('Copie impossible dans ce navigateur'); }); };
    pre.appendChild(b); }); });
  X.safe('toc',function(){
    var hs=[].slice.call(art.querySelectorAll('h2')); if(hs.length<3) return;
    hs.forEach(function(h,i){ if(!h.id) h.id='s-'+(i+1)+'-'+X.norm(h.textContent).replace(/[^a-z0-9]+/g,'-').slice(0,40); });
    var nav=document.createElement('nav'); nav.className='tvfx-toc'; nav.setAttribute('aria-label','Sommaire de l\u2019article');
    nav.innerHTML='<details open><summary>Sommaire</summary><ol>'+hs.map(function(h){ return '<li><a href="#'+h.id+'">'+esc(h.textContent.trim())+'</a></li>'; }).join('')+'</ol></details>';
    /* large écran : dans la marge (hors du voile, dont le flou piégerait position:fixed) ; sinon au-dessus de l'article */
    if(matchMedia('(min-width:1180px)').matches) document.body.appendChild(nav); else { art.parentNode.insertBefore(nav,art); nav.querySelector('details').removeAttribute('open'); }
    var links=nav.querySelectorAll('a');
    function mark(){ var cur=0; hs.forEach(function(h,i){ if(h.getBoundingClientRect().top<innerHeight*.3) cur=i; });
      links.forEach(function(a,i){ a.classList.toggle('on',i===cur); if(i===cur) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current'); }); }
    var tk=0; addEventListener('scroll',function(){ if(!tk) tk=requestAnimationFrame(function(){ tk=0; mark(); }); },{passive:true}); mark();
  });
  X.safe('related',function(){
    X.config().then(function(cfg){ var list=((cfg.catalog||{}).articles)||[]; if(!list.length) return;
      var here=location.pathname.split('/').pop(), me=null; list.forEach(function(a){ if((a.url||'').split('/').pop()===here) me=a; }); if(!me) return;
      var tags=me.tags||[];
      var scored=list.filter(function(a){ return a!==me; }).map(function(a){ var s=0; (a.tags||[]).forEach(function(t){ if(tags.indexOf(t)>=0) s+=2; }); return [a,s+Math.random()*.5]; })
        .filter(function(p){ return p[1]>=2; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0,3);
      if(!scored.length) return;
      var sec=document.createElement('section'); sec.className='tvfx-rel'; sec.setAttribute('aria-label','Tu aimeras aussi');
      sec.innerHTML='<h2>Tu aimeras aussi</h2><div class="g">'+scored.map(function(p){ var a=p[0];
        return '<a href="'+esc(new URL(a.url,X.root+'articles/').href)+'"><span class="tg">'+esc((a.tags||[]).join(' · '))+'</span><h3>'+esc(a.title)+'</h3><p>'+esc(a.excerpt||'')+'</p></a>'; }).join('')+'</div>';
      art.parentNode.insertBefore(sec,art.nextSibling);
      sec.querySelectorAll('a').forEach(function(a){ a.classList.add('tvfx-card'); });
    });
  });
})();
