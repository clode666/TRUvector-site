/* TRUvector — mini-lecteur global : la musique continue de page en page.
   État conservé dans sessionStorage. Ne tourne pas sur la page Musique
   (qui a son propre lecteur complet). Démarrage depuis la page Musique
   (case « lecture en fond (tout le site) »). */
(function(){
  if(document.body && document.body.getAttribute('data-section')==='musique') return;
  var me=(document.currentScript && document.currentScript.src)||'';
  var root=me.replace(/assets\/js\/player\.js.*$/,'');
  function ss(k){ try{return sessionStorage.getItem(k);}catch(e){return null;} }
  function set(k,v){ try{sessionStorage.setItem(k,v);}catch(e){} }
  if(ss('tv_music_on')!=='1') return;                 // activé seulement depuis la page Musique

  function tracksThen(cb){
    var out=[];
    function withLocal(){ try{ var l=JSON.parse(localStorage.getItem('tv_config')||'null'); if(l&&l.catalog&&l.catalog.musique&&l.catalog.musique.length) out=l.catalog.musique; }catch(e){} cb(out); }
    fetch(root+'config.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():null;})
      .then(function(j){ if(j&&j.catalog&&j.catalog.musique) out=j.catalog.musique; withLocal(); })
      .catch(withLocal);
  }

  tracksThen(function(tracks){
    if(!tracks.length) return;
    var i=parseInt(ss('tv_music_i')||'0',10); if(isNaN(i)||i<0||i>=tracks.length) i=0;
    var t=parseFloat(ss('tv_music_t')||'0')||0;
    var vol=parseFloat(ss('tv_music_vol')||'0.9'); if(isNaN(vol)) vol=0.9;
    var wantPlay=ss('tv_music_playing')!=='0';

    var audio=new Audio(); audio.preload='auto'; audio.volume=vol; audio.src=root+'musique/assets/'+tracks[i].src;
    audio.addEventListener('loadedmetadata',function(){ try{ if(t>0 && t<audio.duration) audio.currentTime=t; }catch(e){} });

    var box=document.createElement('div'); box.className='mini-player';
    box.innerHTML='<div class="mp-disc"></div><div class="mp-tt"></div>'+
      '<button class="mp-b mp-pp" aria-label="Lecture/pause">▶</button>'+
      '<button class="mp-b mp-next" aria-label="Suivant">⏭</button>'+
      '<button class="mp-b mp-x" aria-label="Couper la musique">✕</button>';
    document.body.appendChild(box);
    var pp=box.querySelector('.mp-pp'), tt=box.querySelector('.mp-tt');
    function label(){ tt.textContent=tracks[i].title||tracks[i].src; }
    function setPlay(on){ box.classList.toggle('playing',on); pp.textContent=on?'⏸':'▶'; set('tv_music_playing',on?'1':'0'); }
    function go(idx,play){ i=(idx+tracks.length)%tracks.length; audio.src=root+'musique/assets/'+tracks[i].src; set('tv_music_i',String(i)); label(); if(play) audio.play().catch(function(){}); }
    audio.addEventListener('play',function(){setPlay(true);});
    audio.addEventListener('pause',function(){setPlay(false);});
    audio.addEventListener('ended',function(){ go(i+1,true); });
    audio.addEventListener('timeupdate',function(){ set('tv_music_t',String(audio.currentTime||0)); });
    pp.onclick=function(){ if(audio.paused) audio.play().catch(function(){}); else audio.pause(); };
    box.querySelector('.mp-next').onclick=function(){ go(i+1,true); };
    box.querySelector('.mp-x').onclick=function(){ set('tv_music_on','0'); audio.pause(); box.remove(); };
    window.addEventListener('pagehide',function(){ set('tv_music_t',String(audio.currentTime||0)); set('tv_music_i',String(i)); });
    label();
    if(wantPlay){ audio.play().catch(function(){ setPlay(false); }); }
  });
})();
