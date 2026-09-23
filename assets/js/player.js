/* TRUvector — mini-lecteur global (v3) : la musique continue de page en page.
   État conservé dans sessionStorage. Ne tourne pas sur la page Musique
   (qui a son propre lecteur complet). Activation depuis la page Musique
   (case « Écouter en navigant »).
   v3 : base CDN garantie même si assets.js est absent ou périmé,
        repli automatique en cas d'erreur de chargement, anti-boucle. */
(function(){
  if(document.body && document.body.getAttribute('data-section')==='musique') return;
  if(/\/musique\/(index\.html)?$/.test(location.pathname)) return;

  var CDN_DEFAULT='https://cdn.jsdelivr.net/gh/clode666/truvector-assets@main';
  var me=(document.currentScript && document.currentScript.src)||'';
  var root=me.replace(/assets\/js\/player\.js.*$/,'');

  function ss(k){ try{return sessionStorage.getItem(k);}catch(e){return null;} }
  function set(k,v){ try{sessionStorage.setItem(k,v);}catch(e){} }
  if(ss('tv_music_on')!=='1') return;

  /* Candidats d'URL pour une piste, du plus probable au repli. */
  function candidates(file){
    var list=[], base=(typeof window.TRU_ASSET_BASE==='string')?window.TRU_ASSET_BASE:CDN_DEFAULT;
    if(base) list.push(base.replace(/\/+$/,'')+'/musique/'+file);
    if(base!==CDN_DEFAULT) list.push(CDN_DEFAULT+'/musique/'+file);
    list.push(root+'musique/assets/'+file);           /* mode monolithique */
    return list.filter(function(u,i){ return list.indexOf(u)===i; });
  }

  function tracksThen(cb){
    var out=[];
    function withLocal(){ try{ var l=JSON.parse(localStorage.getItem('tv_config')||'null'); if(l&&l.catalog&&l.catalog.musique&&l.catalog.musique.length) out=l.catalog.musique; }catch(e){} cb(out); }
    fetch(root+'config.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null;})
      .then(function(j){ if(j&&j.catalog&&j.catalog.musique) out=j.catalog.musique; withLocal(); })
      .catch(withLocal);
  }

  tracksThen(function(tracks){
    if(!tracks.length) return;
    var i=parseInt(ss('tv_music_i')||'0',10); if(isNaN(i)||i<0||i>=tracks.length) i=0;
    var t=parseFloat(ss('tv_music_t')||'0')||0;
    var vol=parseFloat(ss('tv_music_vol')||'0.9'); if(isNaN(vol)) vol=0.9;
    var wantPlay=ss('tv_music_playing')!=='0';
    var cand=[], ci=0, fails=0, restoreT=t;

    var audio=new Audio(); audio.preload='auto'; audio.volume=vol;

    var box=document.createElement('div'); box.className='mini-player';
    box.innerHTML='<div class="mp-disc"></div><div class="mp-tt"></div>'+
      '<button class="mp-b mp-pp" aria-label="Lecture/pause">▶</button>'+
      '<button class="mp-b mp-next" aria-label="Suivant">⏭</button>'+
      '<a class="mp-b mp-go" aria-label="Ouvrir la page Musique" title="Page Musique">♫</a>'+
      '<button class="mp-b mp-x" aria-label="Couper la musique">✕</button>';
    document.body.appendChild(box);
    box.querySelector('.mp-go').href=root+'musique/';
    var pp=box.querySelector('.mp-pp'), tt=box.querySelector('.mp-tt');

    function label(){ tt.textContent=tracks[i].title||tracks[i].src; tt.title=tt.textContent; }
    function setPlay(on){ box.classList.toggle('playing',on); pp.textContent=on?'⏸':'▶'; set('tv_music_playing',on?'1':'0'); }
    function setSrc(){ audio.src=cand[ci]; }
    function go(idx,play){
      i=(idx+tracks.length)%tracks.length; cand=candidates(tracks[i].src); ci=0;
      setSrc(); set('tv_music_i',String(i)); label();
      if(play) audio.play().catch(function(){ setPlay(false); });
    }

    audio.addEventListener('loadedmetadata',function(){
      fails=0;
      if(restoreT>0){ try{ if(restoreT<audio.duration) audio.currentTime=restoreT; }catch(e){} restoreT=0; }
    });
    audio.addEventListener('error',function(){
      if(ci<cand.length-1){ ci++; var p=!audio.paused||wantPlay; setSrc(); if(p) audio.play().catch(function(){}); return; }
      fails++;
      if(fails>=3){ tt.textContent='Musique indisponible'; setPlay(false); return; }   /* anti-boucle */
      setTimeout(function(){ go(i+1,true); },600);
    });
    audio.addEventListener('play',function(){setPlay(true);});
    audio.addEventListener('pause',function(){setPlay(false);});
    audio.addEventListener('ended',function(){ go(i+1,true); });
    audio.addEventListener('timeupdate',function(){ set('tv_music_t',String(audio.currentTime||0)); });
    audio.addEventListener('volumechange',function(){ set('tv_music_vol',String(audio.volume)); });

    pp.onclick=function(){ if(audio.paused) audio.play().catch(function(){}); else audio.pause(); };
    box.querySelector('.mp-next').onclick=function(){ restoreT=0; go(i+1,true); };
    box.querySelector('.mp-x').onclick=function(){ set('tv_music_on','0'); audio.pause(); box.remove(); };
    window.addEventListener('pagehide',function(){ set('tv_music_t',String(audio.currentTime||0)); set('tv_music_i',String(i)); });

    go(i,false);
    if(wantPlay){ audio.play().catch(function(){ setPlay(false); }); }  /* autoplay parfois bloqué : ▶ reste dispo */
  });
})();
