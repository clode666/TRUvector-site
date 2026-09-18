/* TRUvector — menu "Sections" autonome (v2).
   Injecte son propre CSS (indépendant de tokens.css → robuste au cache),
   avec des sous-menus groupés. Auto-localise la racine via son src. */
(function(){
  var me=(document.currentScript && document.currentScript.src)||'';
  var root=me.replace(/assets\/js\/nav\.js.*$/,'');

  if(!document.getElementById('tvnav-style')){
    var st=document.createElement('style'); st.id='tvnav-style';
    st.textContent = [
"@media (hover:hover) and (min-width:721px){.tvnav-wrap:hover .tvnav-panel{display:block!important}}",
".tvnav-wrap{position:relative!important;display:inline-block!important}",
".tvnav-btn{background:none;border:0;color:#9db2ae;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:5px;line-height:1}",
".tvnav-btn:hover,.tvnav-wrap.open .tvnav-btn{color:#34f5c5}",
".tvnav-caret{transition:transform .15s}",
".tvnav-wrap.open .tvnav-caret{transform:rotate(180deg)}",
".tvnav-panel{position:absolute!important;right:0;top:calc(100% + 12px);min-width:236px;background:rgba(10,16,24,.98);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(126,240,205,.34);border-radius:14px;padding:8px;display:none!important;box-shadow:0 16px 40px rgba(0,0,0,.6),0 0 22px rgba(52,245,197,.1);z-index:200;max-height:78vh;overflow:auto}",
".tvnav-wrap.open .tvnav-panel{display:block!important}",
".tvnav-h{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#6f8582;padding:9px 10px 4px}",
".tvnav-item{display:flex!important;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;color:#e8f2ee!important;text-decoration:none!important;font-family:'Space Grotesk',system-ui,sans-serif;font-size:14px;white-space:nowrap}",
".tvnav-item:hover{background:rgba(52,245,197,.09);color:#34f5c5!important}",
".tvnav-i{width:20px;text-align:center;flex:0 0 auto}",
".tvnav-l{flex:1}",
".tvnav-s{margin-left:auto;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;color:#6f8582}",
"@media (max-width:720px){.tvnav-panel{right:auto;left:0;min-width:206px}}"
].join("\n");
    document.head.appendChild(st);
  }

  var links=document.querySelector('.site-nav .nav-links');
  if(!links) return;
  [].slice.call(links.querySelectorAll('a')).forEach(function(a){ var h=a.getAttribute('href')||''; if(h.indexOf('#sections')>-1) a.parentNode.removeChild(a); });
  var oldm=links.querySelector('.has-menu, .tvnav-wrap'); if(oldm) oldm.parentNode.removeChild(oldm);

  var groups=[
    ['Créations', [
      ['galerie/','🎨','Galerie','libres'],
      ['logiciels/','💾','Logiciels','apps'],
      ['ebooks/','📖','E-books','pubs'],
      ['musique/','🎵','Musique','audio'],
      ['articles/','📝','Articles','tutos'],
      ['modules/','🧩','Modules','interactif']
    ]],
    ['Communauté', [
      ['concours/','🏆','Concours','défis'],
      ['dons/','💚','Soutenir','dons']
    ]]
  ];
  var wrap=document.createElement('div'); wrap.className='tvnav-wrap';
  var btn=document.createElement('button'); btn.type='button'; btn.className='tvnav-btn';
  btn.setAttribute('aria-haspopup','true'); btn.setAttribute('aria-expanded','false');
  btn.innerHTML='Sections <span class="tvnav-caret">\u25BE</span>';
  var panel=document.createElement('div'); panel.className='tvnav-panel';
  groups.forEach(function(g){
    var h=document.createElement('div'); h.className='tvnav-h'; h.textContent=g[0]; panel.appendChild(h);
    g[1].forEach(function(it){
      var a=document.createElement('a'); a.className='tvnav-item'; a.href=root+it[0];
      a.innerHTML='<span class="tvnav-i">'+it[1]+'</span><span class="tvnav-l">'+it[2]+'</span><span class="tvnav-s">'+it[3]+'</span>';
      panel.appendChild(a);
    });
  });
  wrap.appendChild(btn); wrap.appendChild(panel);
  var first=links.querySelector('a');
  if(first && first.nextSibling) links.insertBefore(wrap, first.nextSibling);
  else links.appendChild(wrap);

  function close(){ wrap.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
  btn.addEventListener('click',function(e){ e.stopPropagation(); var o=wrap.classList.toggle('open'); btn.setAttribute('aria-expanded',o?'true':'false'); });
  panel.addEventListener('click',function(e){ e.stopPropagation(); });
  document.addEventListener('click',close);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
})();
