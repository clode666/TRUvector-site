/* TRUvector — filters.js (v3 : multi-sélection, fondu + glissement)
   Recherche + filtres par catégorie + tri, ajoutés automatiquement aux listes du site.
   Aucune modification du HTML des pages : le script repère les grilles connues.
   - Logiciels / Modules / Concours : .sec-grid > .sec-card   (catégorie = .badge)
   - E-books                          : .eb-grid  > .eb-card    (catégorie = .eb-badge)
   - Articles                         : #posts    > .post-card  (catégories = .tg, rendu dynamique)
   - Musique                          : #tvlist   > li          (recherche seule)
   L'état est gardé dans l'URL (#q=…&f=…) : un lien filtré se partage.
   Raccourci : « / » place le curseur dans la recherche. */
(function(){
  var SPECS=[
    { grid:'#posts',   item:'.post-card', cat:'.tg',       title:'h3', label:'article',  existingSearch:'#q' },
    { grid:'.eb-grid', item:'.eb-card',   cat:'.eb-badge', title:'h3', label:'e-book' },
    { grid:'.sec-grid',item:'.sec-card',  cat:'.badge',    title:'h3', label:'élément', min:5 },
    { grid:'#tvlist',  item:'li',         cat:null,        title:null, label:'piste', min:8, noSort:true }
  ];

  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function el(tag,cls,txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
  function readHash(){ var o={}; (location.hash||'').replace(/^#/,'').split('&').forEach(function(p){ var kv=p.split('='); if(kv[0]) o[kv[0]]=decodeURIComponent(kv[1]||''); }); return o; }
  function writeHash(q,f){
    var parts=[]; if(q) parts.push('q='+encodeURIComponent(q)); if(f) parts.push('f='+encodeURIComponent(f));
    var h=parts.length?'#'+parts.join('&'):'';
    try{ history.replaceState(null,'',location.pathname+location.search+h); }catch(e){}
  }

  function setup(spec){
    var grid=document.querySelector(spec.grid); if(!grid || grid._tvf) return false;
    grid._tvf=1;
    var state=readHash(), q=state.q||'', F=(state.f||'').split(',').filter(Boolean), sort='default';
    var ext=spec.existingSearch?document.querySelector(spec.existingSearch):null;

    var bar=el('div','tvf'); bar.setAttribute('role','search');
    var top=el('div','tvf-top'), search=null, input=ext;
    if(!ext){
      search=el('label','tvf-search'); input=el('input'); input.type='search';
      input.placeholder='Rechercher un '+spec.label+'…'; input.setAttribute('aria-label','Rechercher');
      search.appendChild(input); search.appendChild(el('kbd',null,'/')); top.appendChild(search);
    }
    var sel=null;
    if(!spec.noSort){
      sel=el('select','tvf-sort'); sel.setAttribute('aria-label','Trier');
      [['default','Ordre du site'],['az','A → Z'],['za','Z → A']].forEach(function(o){ var op=el('option',null,o[1]); op.value=o[0]; sel.appendChild(op); });
      top.appendChild(sel);
    }
    var count=el('span','tvf-count'); count.setAttribute('aria-live','polite'); top.appendChild(count);
    var chips=el('div','tvf-chips');
    bar.appendChild(top); bar.appendChild(chips);
    var empty=el('div','tvf-empty tvf-hide');
    empty.appendChild(el('div',null,'Rien ne correspond à ces critères.'));
    var reset=el('button','btn btn-ghost','Tout afficher'); empty.appendChild(reset);

    if(ext){ var oldCount=document.getElementById('count'); if(oldCount) oldCount.style.display='none'; }
    grid.parentNode.insertBefore(bar,grid);
    grid.parentNode.insertBefore(empty,grid.nextSibling);
    if(ext && q) ext.value=q; else if(input) input.value=q;

    function items(){ return Array.prototype.slice.call(grid.querySelectorAll(spec.item)).filter(function(n){ return n.parentNode===grid || grid.contains(n); }); }
    function cats(n){ if(!spec.cat) return []; return Array.prototype.map.call(n.querySelectorAll(spec.cat),function(c){ return c.textContent.trim(); }).filter(Boolean); }
    function title(n){ var t=spec.title?n.querySelector(spec.title):n; return (t?t.textContent:n.textContent).trim(); }

    function buildChips(){
      chips.innerHTML='';
      if(!spec.cat) { chips.style.display='none'; return; }
      var counts={}, order=[];
      items().forEach(function(n){ cats(n).forEach(function(c){ if(!(c in counts)){ counts[c]=0; order.push(c); } counts[c]++; }); });
      if(order.length<2){ chips.style.display='none'; return; }
      chips.style.display='';
      order.sort(function(a,b){ return counts[b]-counts[a] || a.localeCompare(b,'fr'); });
      var all=el('button','tvf-chip','Tout'); all.type='button'; all.setAttribute('aria-pressed',F.length?'false':'true');
      all.onclick=function(){ F=[]; apply(); }; chips.appendChild(all);
      var MAX=9, extra=[];
      order.forEach(function(c,k){
        var b=el('button','tvf-chip',c); b.type='button'; b.appendChild(el('span','n',String(counts[c])));
        b.setAttribute('aria-pressed',F.indexOf(c)>=0?'true':'false');
        b.title='Clic : ajouter/retirer · plusieurs catégories = l\u2019une OU l\u2019autre';
        b.onclick=function(){ var j=F.indexOf(c); if(j>=0) F.splice(j,1); else F.push(c); apply(); };
        if(k>=MAX && F.indexOf(c)<0 && !chips._open){ b.classList.add('tvf-hide'); extra.push(b); }
        chips.appendChild(b);
      });
      if(extra.length){
        var more=el('button','tvf-chip tvf-more','+ '+extra.length+' autres'); more.type='button';
        more.onclick=function(){ chips._open=1; extra.forEach(function(b){ b.classList.remove('tvf-hide'); }); more.remove(); };
        chips.appendChild(more);
      }
    }

    var original=null;
    function applySort(list){
      if(!sel) return;
      if(!original) original=list.slice();
      var arr = sort==='default' ? original.filter(function(n){ return list.indexOf(n)>=0; })
              : list.slice().sort(function(a,b){ var r=title(a).localeCompare(title(b),'fr',{sensitivity:'base'}); return sort==='za'?-r:r; });
      if(sort==='default'&&grid.querySelector('.tv-grp')) return;   /* ordre d'origine : on ne déplace rien, les intertitres restent à leur place */
      arr.forEach(function(n){ grid.appendChild(n); });
    }

    var applying=false, mo=null;
    function apply(){
      applying=true;
      q=(ext?ext.value:input.value)||'';
      var nq=norm(q.trim()), list=items(), shown=0;
      var before=new Map(); if(list.length<=80 && !(window.TVFX&&(TVFX.reduce||TVFX.off))) list.forEach(function(n){ if(!n.classList.contains('tvf-hide')) before.set(n,n.getBoundingClientRect()); });
      var leaving=[];
      list.forEach(function(n){
        var cs=cats(n), okC=!F.length || F.some(function(x){ return cs.indexOf(x)>=0; });
        var okQ=!nq || norm(n.textContent).indexOf(nq)>=0;
        var ok=okC&&okQ, was=!n.classList.contains('tvf-hide');
        if(!ok&&was&&before.size){ leaving.push(n); } else n.classList.toggle('tvf-hide',!ok);
        if(ok) shown++;
      });
      grid.classList.toggle('tvf-active',!!(nq||F.length||sort!=='default'));
      applySort(list);
      /* les exclus s'effacent en fondu, les restants glissent vers leur nouvelle place (FLIP) */
      var pend=leaving.length; leaving.forEach(function(n){ var r=before.get(n); if(!r){ n.classList.add('tvf-hide'); if(--pend===0) flip(); return; }
        n.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.92)'}],{duration:180,easing:'ease-in'}).onfinish=function(){ n.classList.add('tvf-hide'); if(--pend===0) flip(); }; });
      function flip(){ list.forEach(function(n){ if(n.classList.contains('tvf-hide')) return; var a=before.get(n), b=n.getBoundingClientRect();
        if(!a){ n.animate([{opacity:0,transform:'scale(.94)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'}); return; }
        var dx=a.left-b.left, dy=a.top-b.top; if(Math.abs(dx)+Math.abs(dy)>1) n.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'}); }); before=new Map(); }
      if(before.size && !leaving.length) flip();
      count.textContent=shown+' / '+list.length+' '+spec.label+(list.length>1?'s':'');
      empty.classList.toggle('tvf-hide',shown>0 || !list.length);
      Array.prototype.forEach.call(chips.querySelectorAll('.tvf-chip'),function(b){
        if(b.classList.contains('tvf-more')) return;
        var val=b.firstChild?b.firstChild.nodeValue:''; b.setAttribute('aria-pressed', (val==='Tout'?!F.length:F.indexOf(val)>=0)?'true':'false');
      });
      writeHash(q.trim(),F.join(','));
      if(mo) mo.takeRecords();       /* nos propres déplacements (tri) ne doivent pas relancer l'observateur */
      applying=false;
    }

    (ext||input).addEventListener('input',function(){ setTimeout(apply,0); });
    if(sel) sel.addEventListener('change',function(){ sort=sel.value; apply(); });
    reset.onclick=function(){ F=[]; if(ext) ext.value=''; else input.value=''; apply(); if(ext) ext.dispatchEvent(new Event('input')); };

    /* grilles rendues en JS (Articles) : on se ré-applique quand le contenu change */
    if(window.MutationObserver){
      mo=new MutationObserver(function(){ if(applying) return; original=null; buildChips(); apply(); });
      mo.observe(grid,{childList:true});
    }
    buildChips(); apply();
    return true;
  }

  function init(){
    SPECS.forEach(function(spec){
      var g=document.querySelector(spec.grid); if(!g) return;
      var n=g.querySelectorAll(spec.item).length;
      if(spec.min && n<spec.min && !spec.existingSearch) return;   /* inutile sur une petite liste */
      setup(spec);
    });
    document.addEventListener('keydown',function(e){
      if(e.key!=='/' || e.ctrlKey || e.metaKey) return;
      var t=e.target; if(t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable)) return;
      var box=document.querySelector('.tvf-search input, #q'); if(box){ e.preventDefault(); box.focus(); }
    });
  }
  (window.TVReady||new Promise(function(r){ if(document.readyState!=='loading') r(); else document.addEventListener('DOMContentLoaded',r); })).then(init);
})();
