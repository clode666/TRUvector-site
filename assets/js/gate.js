/* TRUvector — portail d'accès générique piloté par la config.
   Utilise <body data-section="xxx"> + window.TV_FALLBACK_CODE (repli).
   Code réel : config.access.sections[section]. Verrou léger — vraie
   protection = Cloudflare Access (voir le manuel). */
(function(){
  function init(){
    var section=document.body.getAttribute('data-section');
    var gate=document.getElementById('gate'), inp=document.getElementById('gate-code'),
        go=document.getElementById('gate-go'), err=document.getElementById('gate-err');
    var CODE = window.TV_FALLBACK_CODE || '';
    var skey='tv_access_'+section;
    if(gate){
      function unlock(){ try{sessionStorage.setItem(skey,'1');}catch(e){} gate.classList.add('hidden'); document.dispatchEvent(new CustomEvent('tv:unlocked',{detail:{section:section}})); }
      try{ if(sessionStorage.getItem(skey)==='1'){ gate.classList.add('hidden'); } }catch(e){}
      function attempt(){ if(inp.value.trim()===CODE){ err.textContent=''; unlock(); } else { err.textContent='Code incorrect — réessaie.'; inp.select(); } }
      if(go) go.addEventListener('click',attempt);
      if(inp){ inp.addEventListener('keydown',function(e){ if(e.key==='Enter') attempt(); }); inp.focus(); }
    }
    if(window.TV){ TV.load('../').then(function(cfg){
      if(cfg.access && cfg.access.sections && cfg.access.sections[section]){ CODE=cfg.access.sections[section]; }
      if(cfg.theme && cfg.theme.accent){ document.documentElement.style.setProperty('--menthe', cfg.theme.accent); }
      document.dispatchEvent(new CustomEvent('tv:config',{detail:cfg}));
    }); }
  }
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();
