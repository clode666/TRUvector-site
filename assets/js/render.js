/* ============================================================
   TRUvector.dev — render.js (v8)
   Construit les pages à partir de config.json (+ l'aperçu local de
   l'admin). Le HTML statique reste en place comme filet de secours
   (et pour le référencement) : si la config est absente ou vide pour
   une section, rien n'est remplacé.
   Expose window.TVReady (promesse) : les scripts de page attendent
   que le rendu soit fini avant de s'initialiser.
   ============================================================ */
(function(){
  'use strict';
  var me=(document.currentScript&&document.currentScript.src)||'';
  var ROOT=me.replace(/assets\/js\/render\.js.*$/,'');
  var CDN=function(){ return (typeof window.TRU_ASSET_BASE==='string'&&window.TRU_ASSET_BASE)||'https://cdn.jsdelivr.net/gh/clode666/truvector-assets@main'; };
  var done; window.TVReady=new Promise(function(r){ done=r; });
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function vis(a){ return (a||[]).filter(function(x){ return x&&x.visible!==false; }); }
  function $(s,r){ return (r||document).querySelector(s); }
  function safe(n,fn){ try{ fn(); }catch(e){ if(window.console) console.warn('[render] '+n,e); } }
  function fmtDate(iso){ try{ return new Date(iso+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}); }catch(e){ return iso; } }
  function rel(u){ if(!u) return '#'; if(/^(https?:|mailto:|#|\/)/.test(u)) return u; return ROOT+u.replace(/^\.\//,''); }
  function ext(u){ return /^https?:/.test(u||'')&&u.indexOf(location.host)<0; }

  var cfgP=(window.TV&&TV.load)?TV.load(ROOT):fetch(ROOT+'config.json',{cache:'no-cache'}).then(function(r){ return r.json(); });
  var timeout=new Promise(function(r){ setTimeout(function(){ r(null); },2500); });
  var domP=new Promise(function(r){ if(document.readyState!=='loading') r(); else document.addEventListener('DOMContentLoaded',r); });

  Promise.all([Promise.race([cfgP.catch(function(){ return null; }),timeout]),domP]).then(function(res){
    var cfg=res[0]||{}; window.TVCONFIG=cfg;
    var C=cfg.catalog||{};
    var counts={articles:vis(C.articles).length,modules:vis(C.modules).length,pistes:vis(C.musique).length,ebooks:vis(C.ebooks).length,logiciels:vis(C.logiciels).length,creations:vis(cfg.gallery).length};
    var until=(cfg.ebooks&&cfg.ebooks.until)||'';
    function fill(s){ return String(s||'').replace(/\{(\w+)\}/g,function(m,k){ return k==='date'?fmtDate(until):(counts[k]!=null?counts[k]:m); }); }
    var R={cfg:cfg,counts:counts,fill:fill,esc:esc,vis:vis,ROOT:ROOT,CDN:CDN};

    safe('theme',function(){ var t=cfg.theme||{}, st=document.documentElement.style;
      if(t.accent) st.setProperty('--menthe',t.accent); if(t.violet) st.setProperty('--aurore-v',t.violet); });
    safe('nav',navTabs);
    safe('annonce',annonce);
    safe('apercu',previewPill);
    safe('home',home);
    safe('grids',grids);
    safe('musique',musique);
    safe('ebooks',ebooks);
    safe('galerie',galerie);
    safe('dons',dons);

    /* ---------- navigation : libellés et visibilité ---------- */
    function navTabs(){ var tabs=(cfg.nav&&cfg.nav.tabs)||[]; if(!tabs.length) return;
      var links=document.querySelectorAll('.site-nav .tvnav-tab'); if(!links.length) return;
      tabs.forEach(function(t){ var want=new URL(ROOT+(t.path||''),location.href).pathname;
        links.forEach(function(a){ var p=new URL(a.href,location.href).pathname.replace(/index\.html$/,'');
          if(p===want){ if(t.label) a.textContent=t.label; a.hidden=t.visible===false; } }); }); }

    /* ---------- bandeau d'annonce ---------- */
    function annonce(){ var a=cfg.announcement||{}; if(!a.visible||!a.text) return;
      var isHome=!!$('#heroInner'); if(!a.everywhere&&!isHome) return;
      if(a.until&&new Date()>new Date(a.until+'T23:59:59')) return;
      var key='tv_ann_'+(a.text.length+':'+a.text.slice(0,20)); try{ if(sessionStorage.getItem(key)) return; }catch(e){}
      var d=document.createElement('div'); d.className='tv-annonce'; d.setAttribute('role','region'); d.setAttribute('aria-label','Annonce');
      d.innerHTML='<div class="wrap"><span class="t">'+esc(fill(a.text))+'</span>'+(a.url?'<a class="l" href="'+esc(rel(a.url))+'">'+esc(a.label||'En savoir plus')+' →</a>':'')+'<button type="button" aria-label="Masquer l\u2019annonce">✕</button></div>';
      d.querySelector('button').onclick=function(){ d.remove(); try{ sessionStorage.setItem(key,'1'); }catch(e){} };
      var nav=$('.site-nav'); if(nav&&nav.parentNode) nav.parentNode.insertBefore(d,nav.nextSibling); else document.body.insertBefore(d,document.body.firstChild); }

    /* ---------- pastille « aperçu admin » ---------- */
    function previewPill(){ if(!(window.TV&&TV.readLocal&&TV.readLocal())) return;
      var p=document.createElement('div'); p.className='tv-preview-pill';
      p.innerHTML='<span>● Aperçu admin (ce navigateur uniquement)</span><button type="button">Quitter l\u2019aperçu</button>';
      p.querySelector('button').onclick=function(){ TV.clearLocal(); location.reload(); }; document.body.appendChild(p); }

    /* ---------- ACCUEIL ---------- */
    function home(){ var hi=$('#heroInner'); if(!hi) return; var H=cfg.home; if(!H) return;
      var B=H.blocks||{};
      if(H.kicker){ var k=$('.kicker',hi); if(k) k.textContent=H.kicker; }
      if(H.lede){ var l=$('.lede',hi); if(l) l.textContent=fill(H.lede); }
      var ctas=hi.querySelectorAll('.hero-cta a');
      [H.cta1,H.cta2].forEach(function(c,i){ if(c&&ctas[i]){ ctas[i].textContent=c.label; ctas[i].href=rel(c.url); } });
      var sec=$('#sections');
      if(sec){ var h2=$('h2.sec',sec), sub=$('.sub',sec);
        if(H.sectionsTitle&&h2){ var w=fill(H.sectionsTitle).split(' '), last=w.pop(); h2.innerHTML=esc(w.join(' '))+' <span class="g">'+esc(last)+'</span>'; }
        if(H.sectionsSub&&sub) sub.textContent=fill(H.sectionsSub);
        var sc=$('#showcase'); if(sc&&vis(H.cards).length) sc.innerHTML=vis(H.cards).map(function(c){
          return '<a class="sc-card reveal" href="'+esc(rel(c.url))+'"><span class="sc-badge">'+esc(c.badge)+'</span><div class="sc-ic">'+esc(c.icon)+'</div><h3>'+esc(c.title)+'</h3><p>'+esc(fill(c.desc))+'</p><span class="sc-go">'+esc(c.go||'Entrer →')+'</span></a>'; }).join(''); }
      /* sections existantes */
      var feats=$('.features'), whySec=feats&&feats.closest('section');
      if(whySec){ if(B.why===false) whySec.hidden=true; else if(H.why){ var y=H.why;
        var h=$('h2.sec',whySec); if(h&&y.title){ var ww=y.title.split(' '), ll=ww.pop(); h.innerHTML=esc(ww.join(' '))+' <span class="g">'+esc(ll)+'</span>'; }
        var s=$('.sub',whySec); if(s&&y.sub) s.textContent=y.sub;
        if(vis(y.items).length) feats.innerHTML=vis(y.items).map(function(f){ return '<div class="feat reveal"><div class="fi">'+esc(f.icon)+'</div><h3>'+esc(f.title)+'</h3><p>'+esc(f.text)+'</p></div>'; }).join(''); } }
      var mk=$('.maker-card'), mkSec=mk&&mk.closest('section');
      if(mkSec){ if(B.maker===false) mkSec.hidden=true; else if(H.maker){ var m=H.maker;
        var im=$('img',mk); if(im&&m.image) im.src=rel(m.image);
        var mh=$('h3',mk), mp=$('.txt p',mk), ml=$('.links',mk); if(mh) mh.textContent=m.title||''; if(mp) mp.textContent=m.text||'';
        if(ml&&m.links) ml.innerHTML=vis(m.links).map(function(x){ return '<a href="'+esc(rel(x.url))+'"'+(ext(x.url)?' target="_blank" rel="me noopener"':'')+'>'+esc(x.label)+'</a>'; }).join(''); } }
      var cta=$('.cta'), ctaSec=cta&&cta.closest('section');
      if(ctaSec){ if(B.cta===false) ctaSec.hidden=true; else if(H.cta){ var ch=$('h2',cta), cp=$('p',cta), ca=$('a',cta);
        if(ch) ch.textContent=H.cta.title||''; if(cp) cp.textContent=fill(H.cta.text||''); if(ca){ ca.textContent=H.cta.label||''; ca.href=rel(H.cta.url); } } }
      /* ===== nouveaux blocs enrichis, insérés après « Huit espaces » ===== */
      var anchor=sec, html='';
      function add(s){ var d=document.createElement('div'); d.innerHTML=s; var el=d.firstChild; anchor.parentNode.insertBefore(el,anchor.nextSibling); anchor=el; }
      if(B.stats!==false){
        var S=[['articles','articles'],['modules','modules'],['pistes','pistes'],['ebooks','nouvelles'],['logiciels','logiciels'],['creations','créations']].filter(function(s){ return counts[s[0]]; });
        add('<section class="blk wrap tvh-stats" aria-label="En chiffres"><div class="tvh-stat-row">'+S.map(function(s){ return '<div class="tvh-stat"><b data-n="'+counts[s[0]]+'">0</b><span>'+s[1]+'</span></div>'; }).join('')+'</div></section>'); }
      if(B.news!==false&&vis(C.articles).length){
        var arts=vis(C.articles), dated=arts.filter(function(a){ return a.date; });
        var latest=(dated.length?dated.slice().sort(function(a,b){ return a.date<b.date?1:-1; }):arts.slice().reverse()).slice(0,H.newsCount||4);
        add('<section class="blk wrap tvh-news"><div class="eyebrow">// '+(dated.length?'nouveautés':'derniers articles')+'</div><h2 class="sec">Fraîchement <span class="g">publiés</span></h2>'+
          '<div class="sec-grid">'+latest.map(function(a){ return '<a class="sec-card tvh-link" href="'+esc(rel('articles/'+a.url))+'"><span class="badge">'+esc((a.tags||[]).slice(0,2).join(' · ')||'Article')+'</span><h3>'+esc(a.title)+'</h3><p>'+esc(a.excerpt||'')+'</p>'+(a.date?'<span class="date">'+esc(fmtDate(a.date))+'</span>':'')+'<span class="go">Lire →</span></a>'; }).join('')+'</div>'+
          '<p class="tvh-more"><a href="'+rel('articles/')+'">Les '+counts.articles+' articles →</a> <button type="button" class="tvh-k">⌕ Chercher partout <kbd>Ctrl K</kbd></button></p></section>'); }
      if(B.listen!==false&&vis(C.musique).length){
        var tr=vis(C.musique), pick=tr[Math.floor(Math.random()*tr.length)], pi=tr.indexOf(pick);
        add('<section class="blk wrap tvh-listen"><div class="tvh-listen-card"><div class="tvh-disc" aria-hidden="true"></div><div class="tvh-lt"><div class="eyebrow">// à écouter</div><h2>'+esc(pick.title)+'</h2><p>Une des '+counts.pistes+' créations audio TRUvector. Elle peut te suivre pendant toute ta visite.</p>'+
          '<div class="tvh-lb"><button type="button" class="btn" data-i="'+pi+'">▶ Écouter en naviguant</button><a class="btn btn-ghost" href="'+rel('musique/')+'">Toute la musique</a></div></div></div></section>'); }
      if(B.ebooks!==false&&vis(C.ebooks).length){
        var bk=vis(C.ebooks).slice(0,5), pass=(cfg.ebooks&&cfg.ebooks.passphrase)||'truvector';
        add('<section class="blk wrap tvh-ebooks"><div class="tvh-eb"><div class="tvh-eb-t"><div class="eyebrow">// édition limitée</div><h2 class="sec">'+counts.ebooks+' nouvelles, <span class="g">jusqu’au '+esc(fmtDate(until))+'</span></h2>'+
          '<div class="tvh-count" data-until="'+esc(until)+'"><span><b>–</b>jours</span><span><b>–</b>heures</span><span><b>–</b>min</span></div><a class="btn" href="'+rel('ebooks/')+'">Voir le catalogue</a></div>'+
          '<div class="tvh-covers">'+bk.map(function(b,i){ return '<a style="--i:'+i+'" href="'+rel('ebooks/lecteur.html?src='+encodeURIComponent(CDN()+'/ebooks/'+b.slug+'.trubook')+'&k='+encodeURIComponent(pass))+'" aria-label="Lire '+esc(b.title)+'"><img src="'+esc(CDN()+'/ebooks/covers/'+b.slug+'.svg')+'" alt="" loading="lazy" width="120" height="180"></a>'; }).join('')+'</div></div></section>'); }
      if(B.software!==false){ var fs=(H.featuredSoftware||[]).map(function(t){ return vis(C.logiciels).filter(function(p){ return p.title===t; })[0]; }).filter(Boolean);
        if(fs.length) add('<section class="blk wrap tvh-soft"><div class="eyebrow">// logiciels phares</div><h2 class="sec">Des outils <span class="g">qui protègent et automatisent</span></h2><div class="sec-grid">'+
          fs.map(function(p){ return '<a class="sec-card tvh-link" href="'+rel('logiciels/fiche.html?p='+p.slug)+'"><span class="badge">'+esc(p.badge)+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.lead||p.desc)+'</p><span class="go">Voir la fiche →</span></a>'; }).join('')+'</div></section>'); }
      if(B.modules!==false){ var fm=(H.featuredModules||[]).map(function(t){ return vis(C.modules).filter(function(p){ return p.title===t; })[0]; }).filter(Boolean);
        if(fm.length) add('<section class="blk wrap tvh-mods"><div class="eyebrow">// à essayer tout de suite</div><h2 class="sec">Des modules <span class="g">à manipuler</span></h2><div class="sec-grid">'+
          fm.map(function(p){ return '<a class="sec-card tvh-link" href="'+rel('modules/'+p.url)+'" target="_blank" rel="noopener"><span class="badge">'+esc(p.badge)+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.desc)+'</p><span class="go">Ouvrir ↗</span></a>'; }).join('')+'</div></section>'); }
      /* interactions des blocs */
      var io=window.IntersectionObserver?new IntersectionObserver(function(en){ en.forEach(function(e){ if(!e.isIntersecting) return; io.unobserve(e.target);
        var n=+e.target.getAttribute('data-n'), t0=performance.now(); (function step(t){ var p=Math.min(1,(t-t0)/1200); e.target.textContent=Math.round(n*(1-Math.pow(1-p,3))).toLocaleString('fr-FR'); if(p<1) requestAnimationFrame(step); })(t0); }); },{threshold:.4}):null;
      document.querySelectorAll('.tvh-stat b').forEach(function(b){ if(io&&!matchMedia('(prefers-reduced-motion: reduce)').matches) io.observe(b); else b.textContent=b.getAttribute('data-n'); });
      var lb=$('.tvh-listen .btn[data-i]'); if(lb) lb.onclick=function(){ try{ sessionStorage.setItem('tv_music_i',lb.getAttribute('data-i')); sessionStorage.setItem('tv_music_t','0'); sessionStorage.setItem('tv_music_on','1'); sessionStorage.setItem('tv_music_playing','1'); }catch(e){}
        var old=$('.mini-player'); if(old) old.remove(); var s=document.createElement('script'); s.src=ROOT+'assets/js/player.js?v=6&r='+Date.now(); document.body.appendChild(s); lb.textContent='♫ Lecture en fond'; $('.tvh-listen-card').classList.add('on'); };
      var kb=$('.tvh-k'); if(kb) kb.onclick=function(){ if(window.TVFX&&TVFX.openPalette) TVFX.openPalette(); };
      var cd=$('.tvh-count'); if(cd&&until){ var end=new Date(until+'T23:59:59'); (function tick(){ var d=Math.max(0,end-new Date()), b=cd.querySelectorAll('b');
        b[0].textContent=Math.floor(d/864e5); b[1].textContent=Math.floor(d%864e5/36e5); b[2].textContent=Math.floor(d%36e5/6e4); if(d>0) setTimeout(tick,30000); })(); }
    }

    /* ---------- grilles : logiciels, modules, concours ---------- */
    function grids(){ var grid=$('#tv-content .sec-grid'); if(!grid) return; var p=location.pathname;
      function card(badge,t,d,href,label,blank){ return '<div class="sec-card">'+(badge?'<span class="badge">'+esc(badge)+'</span>':'')+'<h3>'+esc(t)+'</h3><p>'+esc(d)+'</p><a class="go" href="'+esc(href)+'"'+(blank?' target="_blank" rel="noopener"':'')+'>'+esc(label)+'</a></div>'; }
      if(/\/logiciels\/(index\.html)?$/.test(p)&&vis(C.logiciels).length) grid.innerHTML=vis(C.logiciels).map(function(x){ return card(x.badge,x.title,x.desc,'fiche.html?p='+x.slug,'Voir la fiche →'); }).join('');
      else if(/\/modules\/(index\.html)?$/.test(p)&&vis(C.modules).length) grid.innerHTML=vis(C.modules).map(function(x){ return card(x.badge,x.title,x.desc,x.url,'Ouvrir ↗',true); }).join('');
      else if(/\/concours\/(index\.html)?$/.test(p)&&cfg.concours){ var L=vis(cfg.concours);
        grid.innerHTML=L.length?L.map(function(x){ return card(x.badge||'',x.title,x.desc,x.url||'#',x.label||'Participer ↗',ext(x.url)); }).join(''):'<div class="empty" style="grid-column:1/-1"><span class="ic">🏆</span>Aucun concours en cours — reviens bientôt.</div>'; } }

    /* ---------- musique ---------- */
    function musique(){ var list=$('#tvlist'), srcs=$('#tvsrcs'); if(!list||!srcs) return; var T=vis(C.musique); if(!T.length) return;
      list.innerHTML=T.map(function(t,i){ return '<li data-i="'+i+'" data-title="'+esc(t.title)+'"><span class="n">'+('0'+(i+1)).slice(-2)+'</span>'+esc(t.title)+'</li>'; }).join('');
      srcs.textContent=JSON.stringify(T.map(function(t){ return t.src; })); }

    /* ---------- e-books ---------- */
    function ebooks(){ var grid=$('.eb-grid'); if(!grid) return; var E=cfg.ebooks||{}, B=vis(C.ebooks), pass=E.passphrase||'truvector'; if(!B.length) return;
      grid.innerHTML=B.map(function(b){ var src='lecteur.html?src='+CDN()+'/ebooks/'+b.slug+'.trubook&amp;k='+encodeURIComponent(pass);
        return '<article class="eb-card" data-slug="'+esc(b.slug)+'"><a class="eb-cover" href="'+src+'" aria-label="Lire : '+esc(b.title)+'"><img src="'+esc(CDN()+'/ebooks/covers/'+b.slug+'.svg')+'" alt="Couverture de '+esc(b.title)+'" loading="lazy" width="320" height="480"><span class="eb-badge">'+esc(b.genre)+'</span></a>'+
          '<div class="eb-body"><h3>'+esc(b.title)+'</h3><p>'+esc(b.blurb)+'</p><div class="eb-foot"><a class="btn eb-read" href="'+src+'">Lire</a><span class="eb-until" data-until="'+esc(b.until||E.until||'')+'"></span></div></div></article>'; }).join('');
      var sh=$('.sec-h small'); if(sh) sh.textContent=B.length+' nouvelles';
      var note=$('.eb-note span:last-child'); if(note&&E.note) note.innerHTML=esc(E.note).replace('{date}','<strong id="eb-globaldate"></strong>')+(E.passphrase?' Clé de lecture : <code>'+esc(E.passphrase)+'</code> — elle est déjà pré-remplie quand tu cliques sur « Lire ».':''); }

    /* ---------- galerie ---------- */
    function galerie(){ var g=$('#tvgal'); if(!g) return; var G=vis(cfg.gallery); if(!G.length) return;
      g.innerHTML=G.map(function(a){ return '<figure class="art '+esc(a.format||'square')+'" data-title="'+esc(a.title)+'" data-slug="'+esc(a.slug)+'"><button class="art-view" aria-label="Agrandir '+esc(a.title)+'"><img alt="'+esc(a.title)+'" loading="lazy"></button><figcaption><span class="art-title">'+esc(a.title)+'</span>'+(a.download!==false?'<a class="dl" download="'+esc(a.slug)+'.png">↓ Image</a>':'')+'</figcaption></figure>'; }).join(''); }

    /* ---------- dons ---------- */
    function dons(){ if(!/\/dons\/(index\.html)?$/.test(location.pathname)) return; var D=cfg.dons; if(!D) return; var box=$('#tv-content'); if(!box) return;
      box.innerHTML='<p class="sub" style="max-width:60ch">'+esc(D.intro||'')+'</p><div class="dons-grid">'+vis(D.links).map(function(l){ return '<a class="btn" href="'+esc(l.url)+'" target="_blank" rel="noopener">'+esc(l.label)+'</a>'; }).join('')+'</div>'; }

    window.TVRender=R;
    done(cfg);
    try{ document.dispatchEvent(new CustomEvent('tv:rendered',{detail:cfg})); }catch(e){}
  });
})();
