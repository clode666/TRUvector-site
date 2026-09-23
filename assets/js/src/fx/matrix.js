/* TVFX · module Matrix aurore (code Konami) — chargé à la demande. */
(function(){ var X=window.TVFX; if(!X) return; var toast=X.toast;
  var mOn=false;
  function matrix(){
    if(mOn) return; mOn=true;
    var cv=document.createElement('canvas'); cv.id='tvfx-matrix'; cv.setAttribute('aria-hidden','true'); document.body.appendChild(cv);
    var g=cv.getContext('2d'); cv.width=innerWidth; cv.height=innerHeight;
    var fs=16, cols=Math.ceil(cv.width/fs), dr=[]; for(var i=0;i<cols;i++) dr[i]=Math.random()*-50;
    var ch='TRUvector01アカサタナハマヤラワ☘⟁∴◊λΣπ'.split('');
    requestAnimationFrame(function(){ cv.classList.add('on'); });
    try{ var a=new (window.AudioContext||window.webkitAudioContext)();
      [523,659,784,1047,784,1047,1319].forEach(function(f,k){ var o=a.createOscillator(), gg=a.createGain(), t=a.currentTime+k*.09; o.type='square'; o.frequency.value=f; gg.gain.setValueAtTime(.04,t); gg.gain.exponentialRampToValueAtTime(.0001,t+.08); o.connect(gg); gg.connect(a.destination); o.start(t); o.stop(t+.09); }); }catch(e){}
    var end=Date.now()+9000;
    (function loop(){ if(Date.now()>end){ cv.classList.remove('on'); setTimeout(function(){ cv.remove(); mOn=false; },700); return; }
      requestAnimationFrame(loop); g.fillStyle='rgba(4,8,12,.14)'; g.fillRect(0,0,cv.width,cv.height); g.font=fs+'px JetBrains Mono, monospace';
      for(var i=0;i<cols;i++){ var y=dr[i]*fs; g.fillStyle=Math.random()>.94?'#e8fff7':(i%3?'#34f5c5':'#c98bf5'); g.fillText(ch[(Math.random()*ch.length)|0],i*fs,y);
        if(y>cv.height&&Math.random()>.975) dr[i]=0; dr[i]+=.9; } })();
    toast('Mode Matrix aurore ✦');
  }
  X.matrix=matrix; matrix();
})();
