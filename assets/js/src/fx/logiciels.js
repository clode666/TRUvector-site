/* TVFX · module Logiciels — terminal qui tape de vraies commandes. */
(function(){ var X=window.TVFX; if(!X) return; X.safe('terminal',function(){
  if(document.querySelector('.tvfx-term')) return;
  var host=document.querySelector('[data-tvfx-term]'), grid=document.querySelector('.sec-grid'); if(!host&&!grid) return;
  var anchor=host?null:(grid.previousElementSibling&&grid.previousElementSibling.classList.contains('tvf')?grid.previousElementSibling:grid);
  var box=document.createElement('div'); box.className='tvfx-term';
  box.innerHTML='<div class="bar"><i></i><i></i><i></i><span>truvector@atelier — ~/logiciels</span></div><pre aria-label="Démonstration de commandes"></pre>';
  if(host) host.appendChild(box); else anchor.parentNode.insertBefore(box,anchor);
  var pre=box.querySelector('pre'), esc=X.esc;
  var L=(window.TV_TERM_LINES)||[['ironlock encrypt app.py --bind machine','✓ 8 sources de fingerprint · AES-256-GCM · licence signée ECDSA P-384'],
    ['uxc pack ./release -o setup.uxc --level max','✓ 214 fichiers · intégrité SHA-256 · archive auto-réparable'],
    ['growvault track --organism basilic --daily','✓ courbe de croissance mise à jour · 42 relevés'],
    ['automation run sequence.json --headless','✓ 18 étapes · OCR + SSH · 0 erreur'],
    ['pdfconvert rapport.docx --to pdf','✓ 1 fichier converti · 32+ formats pris en charge']];
  if(X.reduce||X.off){ pre.innerHTML=L.map(function(l){ return '<span class="p">$</span> '+esc(l[0])+'\n<span class="ok">'+esc(l[1])+'</span>'; }).join('\n'); return; }
  var li=0, out=[], vis=true;
  if(window.IntersectionObserver) new IntersectionObserver(function(e){ vis=e[0].isIntersecting; }).observe(box);
  function render(ty,cur){ pre.innerHTML=out.join('\n')+(ty!==null?(out.length?'\n':'')+'<span class="p">$</span> '+esc(ty)+(cur?'<span class="cur"></span>':''):''); }
  function next(){ var l=L[li%L.length], k=0; li++;
    (function type(){ if(document.hidden||!vis) return setTimeout(type,400);
      render(l[0].slice(0,k),true);
      if(k<l[0].length){ k++; setTimeout(type,28+Math.random()*50); }
      else setTimeout(function(){ out.push('<span class="p">$</span> '+esc(l[0])); out.push('<span class="dim">…</span>'); render(null);
        setTimeout(function(){ out.pop(); out.push('<span class="ok">'+esc(l[1])+'</span>'); if(out.length>6) out=out.slice(-6); render('',true); setTimeout(next,1400); },650); },350); })(); }
  next();
}); })();
