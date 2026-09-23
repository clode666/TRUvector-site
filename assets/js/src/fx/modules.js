/* TVFX · module Modules — aperçu animé en direct au survol (l'app tourne
   réduite dans la carte) et records locaux des jeux. */
(function(){ var X=window.TVFX; if(!X) return;
  var REC={'tru-2048':['tv_2048_best','Record'],'neon-serpent':['tv_serpent_best','Record'],'photon-break':['tv_photon_best','Record'],'cipherlock':['tv_cipher_solved','Énigmes résolues']};
  var cards=[].slice.call(document.querySelectorAll('.sec-grid .sec-card'));
  X.safe('records',function(){ cards.forEach(function(c){ var a=c.querySelector('a.go'); if(!a) return;
    var slug=(a.getAttribute('href')||'').split('/').pop().replace('.html',''), r=REC[slug]; if(!r) return;
    var v=+X.ls(r[0])||0, s=document.createElement('span'); s.className='tvfx-rec'+(v?'':' zero'); s.textContent=v?('🏆 '+r[1]+' : '+v.toLocaleString('fr-FR')):'🏆 Pas encore de record — à toi de jouer';
    c.insertBefore(s,a); }); });
  X.safe('preview',function(){
    if(!X.fine||X.off) return;
    var t=0, frame=null, host=null;
    function stop(){ clearTimeout(t); if(frame){ frame.remove(); frame=null; } if(host){ host.classList.remove('tvfx-pv-on'); host=null; } }
    cards.forEach(function(c){ var a=c.querySelector('a.go'); if(!a) return; var href=a.getAttribute('href'); if(!/^apps\//.test(href)) return;
      c.addEventListener('pointerenter',function(){ stop(); t=setTimeout(function(){ host=c;
        var box=c.querySelector('.tvfx-pv'); if(!box){ box=document.createElement('div'); box.className='tvfx-pv'; box.setAttribute('aria-hidden','true'); c.insertBefore(box,c.firstChild); }
        frame=document.createElement('iframe'); frame.src=href; frame.tabIndex=-1; frame.title=''; frame.setAttribute('loading','lazy');
        frame.setAttribute('sandbox','allow-scripts allow-same-origin'); frame.setAttribute('allow','microphone \'none\'; camera \'none\'; autoplay \'none\'');
        box.appendChild(frame); c.classList.add('tvfx-pv-on'); },450); });
      c.addEventListener('pointerleave',stop); });
  });
})();
