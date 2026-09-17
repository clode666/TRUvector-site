/* TRUvector — compte à rebours (piloté par la config) */
(function(){
  var d=document.getElementById('cd-d'), h=document.getElementById('cd-h'),
      m=document.getElementById('cd-m'), s=document.getElementById('cd-s'),
      grid=document.getElementById('cd-grid'), gate=document.getElementById('launch-gate');
  function pad(n){return (n<10?'0':'')+n;}
  function openNow(){ if(grid){grid.innerHTML='<div class="cd-open">🌌 Le site est ouvert — bienvenue</div>';} if(gate){gate.dataset.open='1';} }

  function run(cfg){
    var TARGET = new Date(cfg.launchDate).getTime();
    var status = cfg.status || 'auto';
    if(cfg.theme && cfg.theme.accent){ document.documentElement.style.setProperty('--menthe', cfg.theme.accent); }
    if(status==='open'){ openNow(); return; }
    var timer=setInterval(tick,1000); tick();
    function tick(){
      var diff = TARGET - Date.now();
      if(status==='auto' && diff<=0){ openNow(); clearInterval(timer); return; }
      var sec=Math.max(0, Math.floor(diff/1000));
      if(d) d.textContent=Math.floor(sec/86400);
      if(h) h.textContent=pad(Math.floor(sec%86400/3600));
      if(m) m.textContent=pad(Math.floor(sec%3600/60));
      if(s) s.textContent=pad(sec%60);
    }
  }
  if(window.TV){ TV.load('').then(run); }
  else { run({launchDate:'2026-09-21T00:00:00+02:00', status:'auto'}); }
})();
