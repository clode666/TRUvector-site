/* TVFX · module Palette Ctrl+K — chargée au premier usage (budget poids). */
(function(){ var X=window.TVFX; if(!X||X.palette) return;
  var ROOT=X.root, CDN=X.cdn, ls=X.ls, ss=X.ss, norm=X.norm, esc=X.esc, toast=X.toast, config=X.config, favs=X.favs, blip=X.blip, matrix=X.matrix, path=location.pathname;
  /* ---------- PHASE 5 · palette de commande Ctrl+K ---------- */

    var SECTIONS=[['🏠','Accueil',''],['🖼️','Galerie','galerie/'],['💾','Logiciels','logiciels/'],['📚','E-books','ebooks/'],['🎵','Musique','musique/'],
      ['📝','Articles','articles/'],['🧩','Modules','modules/'],['🏆','Concours','concours/'],['💚','Soutenir','dons/'],['🗺️','Roadmap visuelle','roadmap-effets.html'],['📘','Manuel du site','manuel.html']];
    var items=null, recent=[], loading=null, books=[];
    function abs(u,base){ if(!u) return ROOT+base; if(/^(https?:)?\/\//.test(u)||u.charAt(0)==='/') return u; return ROOT+base+u; }
    function build(){ if(loading) return loading;
      var list=SECTIONS.map(function(s){ return {g:'Sections',ic:s[0],t:s[1],u:ROOT+s[2],k:'section'}; }); items=list;
      var p1=config().then(function(cfg){ var c=(cfg&&cfg.catalog)||{};
        var V=function(a){ return (a||[]).filter(function(x){ return x&&x.visible!==false; }); };
        var arts=V(c.articles).map(function(a){ return {g:'Articles',ic:'📝',t:a.title,u:abs(a.url,'articles/'),k:(a.tags||[]).slice(0,2).join(' · ')||'article',x:(a.tags||[]).join(' ')+' '+(a.excerpt||''),d:a.date||''}; });
        list=list.concat(arts);
        V(c.musique).forEach(function(m,i){ list.push({g:'Musique',ic:'🎧',t:m.title,k:'piste',act:'track',i:i}); });
        var mods=V(c.modules).filter(function(m){ return m.title; }).map(function(m){ return {g:'Modules',ic:'🧩',t:m.title,u:abs(m.url,'modules/'),k:m.badge||'module',x:m.desc||'',d:m.date||''}; });
        list=list.concat(mods);
        V(c.logiciels).forEach(function(m){ if(m.title) list.push({g:'Logiciels',ic:'💾',t:m.title,u:ROOT+'logiciels/fiche.html?p='+(m.slug||norm(m.title).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')),k:m.badge||'logiciel',x:m.desc||''}); });
        /* Nouveautés : par date si le catalogue en fournit, sinon derniers ajoutés (fin de liste) */
        function newest(a,n){ var dated=a.filter(function(i){ return i.d; }); return (dated.length?dated.sort(function(x,y){ return x.d<y.d?1:-1; }):a.slice().reverse()).slice(0,n); }
        recent=newest(arts,4).concat(newest(mods,2)).map(function(i){ var o={}; for(var k in i) o[k]=i[k]; o.g=arts.some(function(a){ return a.d; })?'Nouveautés':'Derniers ajouts'; return o; });
        items=list; if(pal.classList.contains('on')) render();
      });
      var p2=fetch(CDN+'/ebooks/manifest.json').then(function(r){ return r.ok?r.json():null; }).catch(function(){ return null; }).then(function(m){
        ((m&&m.books)||[]).forEach(function(b){ books.push({g:'E-books',ic:'📖',t:b.title,k:b.genre||'e-book',x:b.blurb||'',
          u:ROOT+'ebooks/lecteur.html?src='+encodeURIComponent(CDN+'/ebooks/'+b.trubook)+'&k='+encodeURIComponent(b.passphrase_public||'truvector')}); }); if(pal.classList.contains('on')) render(); });
      loading=Promise.all([p1,p2]); return loading; }
    function actions(){ var fx=ls('tv_fx')||'auto', on=ls('tv_sfx')==='1';
      return [{g:'Actions',ic:'▶️',t:'Lancer la musique en fond',k:'action',act:'music'},
        {g:'Actions',ic:'🎲',t:'Un article au hasard',k:'action',act:'random'},
        {g:'Actions',ic:'✨',t:'Effets : complets',k:fx==='full'?'actif':'',act:'fx',v:'full'},
        {g:'Actions',ic:'🍃',t:'Effets : légers (économie)',k:fx==='lite'?'actif':'',act:'fx',v:'lite'},
        {g:'Actions',ic:'⏸️',t:'Effets : désactivés',k:fx==='off'?'actif':'',act:'fx',v:'off'},
        {g:'Actions',ic:'🤖',t:'Effets : automatique',k:fx==='auto'?'actif':'',act:'fx',v:'auto'},
        {g:'Actions',ic:on?'🔇':'🔊',t:on?'Couper les sons d\u2019interface':'Activer les sons d\u2019interface',k:'action',act:'sfx'},
        {g:'Actions',ic:'🌌',t:'Mode Matrix aurore',k:'↑↑↓↓←→←→BA',act:'matrix'}]; }
    var pal=document.createElement('div'); pal.id='tvfx-pal'; pal.setAttribute('role','dialog'); pal.setAttribute('aria-modal','true'); pal.setAttribute('aria-label','Recherche globale');
    pal.innerHTML='<div class="box"><input type="text" autocomplete="off" spellcheck="false" placeholder="Rechercher sur TRUvector… (articles, pistes, e-books, actions)" aria-label="Rechercher"><div class="list" role="listbox"></div><div class="foot"><span>↑↓ naviguer</span><span>↵ ouvrir</span><span>Échap fermer</span><span>♥ favoris en tête</span></div></div>';
    document.body.appendChild(pal);
    var inp=pal.querySelector('input'), listEl=pal.querySelector('.list'), sel=0, cur=[];
    function hl(t,q){ if(!q) return esc(t); var i=norm(t).indexOf(q); if(i<0) return esc(t); return esc(t.slice(0,i))+'<mark>'+esc(t.slice(i,i+q.length))+'</mark>'+esc(t.slice(i+q.length)); }
    function score(it,q){ var t=norm(it.t); if(t.indexOf(q)===0) return 3; if(t.indexOf(q)>=0) return 2; if(norm((it.x||'')+' '+(it.k||'')+' '+it.g).indexOf(q)>=0) return 1; return 0; }
    function render(){
      var q=norm(inp.value.trim()), all=(items||[]).concat(books,actions()), fav=favs().map(function(f){ return {g:'♥ Favoris',ic:'♥',t:f.t,u:f.u,k:f.s||''}; });
      if(!q) cur=fav.slice(0,6).concat(recent, all.filter(function(i){ return i.g==='Sections'||i.g==='Actions'; }));
      else cur=fav.concat(all).map(function(i){ return [i,score(i,q)]; }).filter(function(p){ return p[1]>0; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0,40).map(function(p){ return p[0]; });
      if(sel>=cur.length) sel=0;
      if(!cur.length){ listEl.innerHTML='<div class="empty">Aucun résultat pour « '+esc(inp.value)+' ».</div>'; return; }
      var html='', lastG='';
      cur.forEach(function(it,i){ if(it.g!==lastG){ html+='<div class="grp">'+esc(it.g)+'</div>'; lastG=it.g; }
        html+='<div class="it'+(i===sel?' sel':'')+'" role="option" aria-selected="'+(i===sel)+'" data-i="'+i+'"><span class="ic">'+it.ic+'</span><span class="t">'+hl(it.t,q)+'</span><span class="k">'+esc(it.k||'')+'</span></div>'; });
      if(!items) html+='<div class="grp">Chargement du catalogue…</div>';
      listEl.innerHTML=html; var s=listEl.querySelector('.sel'); if(s&&s.scrollIntoView) s.scrollIntoView({block:'nearest'}); }
    function run(it){ if(!it) return; close();
      if(it.act==='music'||it.act==='track'){ if(it.act==='track'){ ss('tv_music_i',String(it.i)); ss('tv_music_t','0'); } ss('tv_music_on','1'); ss('tv_music_playing','1');
        if(/\/musique\//.test(path)){ var li=document.querySelectorAll('#tvlist li')[it.i||0]; if(li) li.click(); return; }
        var old=document.querySelector('.mini-player'); if(old) old.remove();
        var s=document.createElement('script'); s.src=ROOT+'assets/js/player.js?v=6&r='+Date.now(); document.body.appendChild(s); toast('Musique en fond ♫'); return; }
      if(it.act==='random'){ var arts=(items||[]).filter(function(i){ return i.g==='Articles'; }); if(arts.length) location.href=arts[(Math.random()*arts.length)|0].u; return; }
      if(it.act==='fx'){ ls('tv_fx',it.v==='auto'?null:it.v); location.reload(); return; }
      if(it.act==='sfx'){ var on=ls('tv_sfx')==='1'; ls('tv_sfx',on?'0':'1'); if(!on) blip(660,.08); toast(on?'Sons coupés':'Sons activés'); return; }
      if(it.act==='matrix'){ matrix(); return; }
      if(it.u) location.href=it.u; }
    var opener=null;
    function open(){ opener=document.activeElement; pal.classList.add('on'); inp.value=''; sel=0; render(); build().then(render); setTimeout(function(){ inp.focus(); },20); blip(520,.06); }
    function close(){ pal.classList.remove('on'); if(opener&&opener.focus) try{ opener.focus(); }catch(e){} }
    TVFX.palette=open; TVFX.closePalette=close; TVFX.paletteOpen=function(){ return pal.classList.contains('on'); };
    inp.addEventListener('input',function(){ sel=0; render(); });
    listEl.addEventListener('click',function(e){ var it=e.target.closest('.it'); if(it) run(cur[+it.getAttribute('data-i')]); });
    listEl.addEventListener('mousemove',function(e){ var it=e.target.closest('.it'); if(!it) return; var i=+it.getAttribute('data-i'); if(i===sel) return; sel=i;
      listEl.querySelectorAll('.it').forEach(function(n){ n.classList.toggle('sel',+n.getAttribute('data-i')===sel); }); });
    pal.addEventListener('click',function(e){ if(e.target===pal) close(); });
    addEventListener('keydown',function(e){ var k=(e.key||'').toLowerCase();
      if(!pal.classList.contains('on')) return;
      if(k==='escape'){ e.preventDefault(); close(); }
      else if(k==='arrowdown'){ e.preventDefault(); sel=(sel+1)%Math.max(1,cur.length); render(); }
      else if(k==='arrowup'){ e.preventDefault(); sel=(sel-1+cur.length)%Math.max(1,cur.length); render(); }
      else if(k==='enter'){ e.preventDefault(); run(cur[sel]); }
      else if(k==='tab'){ e.preventDefault(); inp.focus(); } });
  open();
})();
