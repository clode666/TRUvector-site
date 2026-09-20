/* TRUvector — barre de navigation : onglets de sections DIRECTS (v4).
   Plus de bouton « Sections » : chaque section est un onglet dans la barre.
   Injecte son propre CSS (robuste au cache) et auto-localise la racine via son src. */
(function(){
  var me=(document.currentScript && document.currentScript.src)||'';
  var root=me.replace(/assets\/js\/nav\.js.*$/,'');

  if(!document.getElementById('tvnav-style')){
    var st=document.createElement('style'); st.id='tvnav-style';
    st.textContent=[
".site-nav .nav-links{margin-left:auto;display:flex;align-items:center;gap:15px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12.5px;min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:1px}",
".site-nav .nav-links::-webkit-scrollbar{display:none}",
".tvnav-tab{color:#9db2ae!important;text-decoration:none!important;white-space:nowrap;padding:5px 1px;border-bottom:2px solid transparent;transition:color .15s,border-color .15s;flex:0 0 auto}",
".tvnav-tab:hover{color:#34f5c5!important}",
".tvnav-tab.on{color:#34f5c5!important;border-bottom-color:#34f5c5}",
"@media (max-width:760px){.site-nav .row{gap:10px}.site-nav .nav-links{gap:13px;font-size:12px}.brand span{font-size:16px}}"
].join("\n");
    document.head.appendChild(st);
  }

  var links=document.querySelector('.site-nav .nav-links');
  if(!links) return;

  var tabs=[
    ['','Accueil'],
    ['galerie/','Galerie'],
    ['logiciels/','Logiciels'],
    ['ebooks/','E-books'],
    ['musique/','Musique'],
    ['articles/','Articles'],
    ['modules/','Modules'],
    ['concours/','Concours'],
    ['dons/','Soutenir']
  ];

  function norm(p){ p=p.replace(/index\.html$/,''); if(p.length>1) p=p.replace(/\/+$/,'/'); return p||'/'; }
  var here=norm(location.pathname);

  links.innerHTML='';
  tabs.forEach(function(t){
    var a=document.createElement('a'); a.className='tvnav-tab';
    a.href = t[0] ? (root+t[0]) : (root||'./');
    a.textContent=t[1];
    var ap;
    try{ ap=norm(new URL(a.href, location.href).pathname); }catch(e){ ap=t[0]?('/'+t[0]):'/'; }
    var active = t[0] ? (here.indexOf(ap)===0) : (here===ap);
    if(active){ a.className+=' on'; a.setAttribute('aria-current','page'); }
    links.appendChild(a);
  });

  var on=links.querySelector('.tvnav-tab.on');
  if(on && on.scrollIntoView){ try{ on.scrollIntoView({inline:'center',block:'nearest'}); }catch(e){} }
})();
