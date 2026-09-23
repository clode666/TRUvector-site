/* TVFX · module Musique — visualiseur (anneau autour du disque + barres),
   aurore et disque qui pulsent sur les basses. Web Audio exige CORS
   (jsDelivr l'autorise). Si un hébergeur le refuse, repli automatique
   en lecture simple AVANT de brancher l'analyseur : jamais de silence. */
(function(){ var X=window.TVFX; if(!X) return; X.safe('music',function(){
  var audio=document.getElementById('tvaudio'), pl=document.getElementById('tvpl'); if(!audio||!pl) return;
  var actx=null, an=null, data=null, running=false, nocors=false;
  function withCors(){ if(nocors||audio.crossOrigin==='anonymous') return;
    var was=!audio.paused, t=audio.currentTime, src=audio.getAttribute('src'); audio.crossOrigin='anonymous';
    if(src){ audio.src=src; if(t) audio.addEventListener('loadedmetadata',function o(){ audio.removeEventListener('loadedmetadata',o); try{ audio.currentTime=t; }catch(e){} }); if(was) audio.play().catch(function(){}); } }
  withCors();
  audio.addEventListener('error',function(){ if(actx||nocors||audio.crossOrigin!=='anonymous') return;
    nocors=true; var src=audio.getAttribute('src'); audio.removeAttribute('crossorigin'); if(src){ audio.src=src; audio.play().catch(function(){}); } });
  if(X.off) return;
  var disc=pl.querySelector('.disc');
  var ring=document.createElement('canvas'); ring.className='tvfx-ring'; ring.setAttribute('aria-hidden','true'); if(disc) disc.appendChild(ring);
  var bars=document.createElement('canvas'); bars.className='tvfx-viz'; bars.setAttribute('aria-hidden','true');
  var ctrls=pl.querySelector('.ctrls'); pl.insertBefore(bars,ctrls?ctrls.nextSibling:null);
  var gr=ring.getContext('2d'), gb=bars.getContext('2d'), dpr=window.devicePixelRatio>1?2:1;
  function size(){ bars.width=bars.clientWidth*dpr; bars.height=bars.clientHeight*dpr; ring.width=ring.clientWidth*dpr; ring.height=ring.clientHeight*dpr; }
  size(); addEventListener('resize',size);
  function setup(){ if(actx) return true; if(nocors) return false;
    try{ var AC=window.AudioContext||window.webkitAudioContext; actx=new AC(); var s=actx.createMediaElementSource(audio);
      an=actx.createAnalyser(); an.fftSize=256; an.smoothingTimeConstant=.8; s.connect(an); an.connect(actx.destination); data=new Uint8Array(an.frequencyBinCount); return true;
    }catch(e){ actx=null; return false; } }
  function draw(){ if(!running) return; requestAnimationFrame(draw);
    an.getByteFrequencyData(data);
    var n=48, w=bars.width/n, bass=0; gb.clearRect(0,0,bars.width,bars.height);
    for(var i=0;i<n;i++){ var v=data[Math.floor(i*data.length/n*.7)]/255; if(i<5) bass+=v/5;
      var hh=Math.max(2,v*bars.height*.94), g=gb.createLinearGradient(0,bars.height,0,bars.height-hh);
      g.addColorStop(0,'#34f5c5'); g.addColorStop(1,i>n/2?'#c98bf5':'#59e39a'); gb.fillStyle=g; gb.fillRect(i*w+w*.18,bars.height-hh,w*.64,hh); }
    var W=ring.width, cx=W/2, r0=W*.30, rays=64; gr.clearRect(0,0,W,W); gr.lineCap='round'; gr.lineWidth=Math.max(1.5,W/90);
    for(var k=0;k<rays;k++){ var v2=data[Math.floor((k<rays/2?k:rays-k)*data.length/rays*.9)]/255, a=k/rays*Math.PI*2-Math.PI/2, len=r0*.08+v2*W*.17;
      gr.strokeStyle=k%2?'rgba(201,139,245,'+(.35+v2*.65)+')':'rgba(52,245,197,'+(.35+v2*.65)+')';
      gr.beginPath(); gr.moveTo(cx+Math.cos(a)*r0,cx+Math.sin(a)*r0); gr.lineTo(cx+Math.cos(a)*(r0+len),cx+Math.sin(a)*(r0+len)); gr.stroke(); }
    X.bass=Math.max(0,bass-.35)*1.6; if(disc) disc.style.setProperty('--lvl',X.bass.toFixed(2)); }
  audio.addEventListener('playing',function(){ if(!setup()){ pl.classList.add('tvfx-noviz'); return; } if(actx.state==='suspended') actx.resume(); if(!running){ running=true; draw(); } });
  audio.addEventListener('pause',function(){ running=false; X.bass=0; if(disc) disc.style.setProperty('--lvl',0); gb.clearRect(0,0,bars.width,bars.height); gr.clearRect(0,0,ring.width,ring.height); });
}); })();
