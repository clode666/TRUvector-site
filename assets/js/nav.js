/* TRUvector — menu déroulant "Sections" injecté dans la nav de chaque page.
   Auto-localise la racine (via son propre src) pour des liens corrects
   quelle que soit la profondeur de la page. */
(function(){
  var me=(document.currentScript && document.currentScript.src)||'';
  var root=me.replace(/assets\/js\/nav\.js.*$/,'');
  var links=document.querySelector('.site-nav .nav-links');
  if(!links) return;
  // retirer l'ancien lien "Sections" (ancre #sections)
  [].slice.call(links.querySelectorAll('a')).forEach(function(a){
    var h=a.getAttribute('href')||''; if(h.indexOf('#sections')>-1) a.parentNode.removeChild(a);
  });
  var items=[
    ['galerie/','🎨','Galerie','libres'],
    ['logiciels/','💾','Logiciels','apps'],
    ['ebooks/','📖','E-books','pubs'],
    ['musique/','🎵','Musique','audio'],
    ['articles/','📝','Articles','tutos'],
    ['modules/','🧩','Modules','interactif'],
    ['concours/','🏆','Concours','défis'],
    ['dons/','💚','Soutenir','dons']
  ];
  var wrap=document.createElement('div'); wrap.className='has-menu';
  var btn=document.createElement('button');
  btn.className='menu-btn'; btn.type='button';
  btn.setAttribute('aria-haspopup','true'); btn.setAttribute('aria-expanded','false');
  btn.innerHTML='Sections \u25BE';
  var menu=document.createElement('div'); menu.className='menu';
  items.forEach(function(it){
    var a=document.createElement('a'); a.href=root+it[0];
    a.innerHTML='<span class="mi">'+it[1]+'</span><span>'+it[2]+'</span><span class="ms">'+it[3]+'</span>';
    menu.appendChild(a);
  });
  wrap.appendChild(btn); wrap.appendChild(menu);
  var first=links.querySelector('a');
  if(first && first.nextSibling) links.insertBefore(wrap, first.nextSibling);
  else if(first) links.appendChild(wrap);
  else links.appendChild(wrap);
  btn.addEventListener('click',function(e){ e.stopPropagation(); var o=wrap.classList.toggle('open'); btn.setAttribute('aria-expanded',o?'true':'false'); });
  document.addEventListener('click',function(){ wrap.classList.remove('open'); btn.setAttribute('aria-expanded','false'); });
})();
