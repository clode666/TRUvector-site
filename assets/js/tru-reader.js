/* TRUvector — tru-reader.js
   Visionneuse d'e-books protégée. Formats : PDF, images, CBZ, EPUB, TXT/MD/HTML.
   Protection : rendu canvas (PDF/images), filigrane acheteur, durée de lecture,
   pages max, expiration, nombre d'ouvertures, anti-copie. Tout côté client.
   RAPPEL HONNÊTE : aucune visionneuse web n'empêche une capture d'écran. Ces
   couches DISSUADENT fortement la recopie et rendent une fuite traçable. */
(function(){
  var TR_BASE = window.TR_BASE || '../';
  var $ = function(id){ return document.getElementById(id); };
  var stage,view,wm,lockOv,gate,book=null,payload=null,bookId='',policy={},buyer={};
  var mode='paged';           // 'paged' (canvas) ou 'flow' (reflow)
  var pages=[], idx=0, zoom=1, fitMode='width';
  var pdfDoc=null, imgBlobs=null, flowSections=null;
  var elapsed=0, timer=null, locked=false, allowedIdx=Infinity;

  function key(k){ return 'trubk_'+bookId+'_'+k; }
  function lsGet(k,d){ try{ var v=localStorage.getItem(key(k)); return v==null?d:v; }catch(e){ return d; } }
  function lsSet(k,v){ try{ localStorage.setItem(key(k),String(v)); }catch(e){} }
  function toast(m){ var t=$('tr-toast'); if(!t)return; t.textContent=m; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(function(){t.classList.remove('show');},1900); }

  /* ---------- détection de format ---------- */
  function ext(name){ var m=/\.([a-z0-9]+)$/i.exec(name||''); return m?m[1].toLowerCase():''; }
  function detect(bytes,name){
    var e=ext(name);
    if(e==='pdf' || (bytes[0]===0x25&&bytes[1]===0x50&&bytes[2]===0x44&&bytes[3]===0x46)) return 'pdf';
    if(['png','jpg','jpeg','gif','webp','bmp'].indexOf(e)>=0) return 'image';
    if(bytes[0]===0x50&&bytes[1]===0x4B){ /* zip */ if(e==='epub') return 'epub'; if(e==='cbz') return 'cbz';
      try{ var u=fflate.unzipSync(bytes); if(u['META-INF/container.xml']) return 'epub'; return 'cbz'; }catch(_){ return 'cbz'; } }
    if(['txt','text','log','csv'].indexOf(e)>=0) return 'txt';
    if(['md','markdown','mdown'].indexOf(e)>=0) return 'md';
    if(['html','htm','xhtml'].indexOf(e)>=0) return 'html';
    /* dernier recours : texte si décodable, sinon image */
    return 'txt';
  }

  /* ---------- portail (passphrase / fichier-clé) ---------- */
  function showGate(meta){
    gate.classList.remove('hidden');
    if(meta){ $('tr-gate-title').textContent=meta.title||'E-book protégé'; if(meta.author) $('tr-gate-sub').textContent='par '+meta.author; }
    var pass=$('tr-pass'), fileInp=$('tr-file'), drop=$('tr-keydrop'), err=$('tr-err'), go=$('tr-go');
    var keyBytes=null;
    function readKey(f){ var r=new FileReader(); r.onload=function(){ try{ keyBytes=TRUcrypto.keyfileBytesFrom(r.result); drop.classList.add('ok'); drop.textContent='Fichier-clé chargé : '+f.name; err.textContent=''; }catch(e){ err.textContent='Fichier-clé illisible.'; } }; r.readAsText(f); }
    fileInp.onchange=function(){ if(fileInp.files[0]) readKey(fileInp.files[0]); };
    ['dragover','dragenter'].forEach(function(ev){ drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.add('over');}); });
    ['dragleave','drop'].forEach(function(ev){ drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.remove('over');}); });
    drop.addEventListener('drop',function(e){ if(e.dataTransfer.files[0]) readKey(e.dataTransfer.files[0]); });
    function attempt(){ err.textContent='Déchiffrement…';
      TRUcrypto.open(book,{passphrase:pass.value,keyfileBytes:keyBytes}).then(function(obj){ err.textContent=''; gate.classList.add('hidden'); onDecrypted(obj); })
      .catch(function(){ err.textContent='Clé incorrecte — réessaie.'; if(pass.select)pass.select(); }); }
    go.onclick=attempt; pass.onkeydown=function(e){ if(e.key==='Enter') attempt(); }; pass.focus();
  }

  /* ---------- chargement de la source ---------- */
  function loadFromBytes(bytes,name){
    var txt; try{ txt=new TextDecoder().decode(bytes.subarray(0,Math.min(bytes.length,4096))); }catch(e){ txt=''; }
    var isTru = /"tru"\s*:\s*"trubook-v1"/.test(txt) || ext(name)==='trubook';
    if(isTru){ try{ book=JSON.parse(new TextDecoder().decode(bytes)); }catch(e){ toast('Fichier .trubook illisible'); return; } showGate({title:book.title,author:book.author}); }
    else { onDecrypted({ format:detect(bytes,name), name:name, policy:{}, buyer:{}, bytes:bytes }); } /* mode aperçu local */
  }
  function loadFromURL(url){
    fetch(url,{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.arrayBuffer(); })
      .then(function(ab){ loadFromBytes(new Uint8Array(ab), url.split('/').pop().split('?')[0]); })
      .catch(function(){ toast('Impossible de charger le fichier.'); showDrop(); });
  }
  function showDrop(){ var d=$('tr-drop'); if(d) d.classList.remove('hidden'); }
  function hideDrop(){ var d=$('tr-drop'); if(d) d.classList.add('hidden'); }

  /* ---------- après déchiffrement : politique + contenu ---------- */
  function onDecrypted(obj){
    payload=obj; policy=obj.policy||{}; buyer=obj.buyer||{}; hideDrop();
    TRUcrypto.sha256hex(obj.bytes).then(function(h){ bookId=h.slice(0,16); afterId(obj); })
      .catch(function(){ bookId='local'; afterId(obj); });
  }
  function afterId(obj){
    if(policy.expires){ var exp=new Date(policy.expires+'T23:59:59'); if(new Date()>exp) return hardLock('Accès expiré','Cet e-book n\u2019est plus accessible (échéance : '+policy.expires+').'); }
    if(!lsGet('first','')) lsSet('first',new Date().toISOString());
    var opens=(parseInt(lsGet('opens','0'),10)||0)+1; lsSet('opens',opens);
    if(policy.maxOpens && opens>policy.maxOpens) return hardLock('Quota d\u2019ouvertures atteint','Limite de '+policy.maxOpens+' ouverture(s) dépassée pour cet appareil.');
    elapsed=parseInt(lsGet('elapsed','0'),10)||0;
    allowedIdx = policy.maxPages ? (policy.maxPages-1) : Infinity;
    $('tr-title').textContent=(book&&book.title)||obj.name||'E-book';
    buildWatermark(); wireAntiCopy(); startTimer(); loadContent(obj);
  }

  function loadContent(obj){
    var f=obj.format;
    if(f==='pdf') return loadPDF(obj.bytes);
    if(f==='image') return loadImage(obj.bytes);
    if(f==='cbz') return loadCBZ(obj.bytes);
    if(f==='epub') return loadEPUB(obj.bytes);
    return loadText(obj.bytes, f);
  }

  /* ---------- utilitaires DOM viewport ---------- */
  var canvas=null, ctx=null;
  function ensurePaged(){ mode='paged'; view.innerHTML=''; canvas=document.createElement('canvas'); canvas.className='tr-canvas'; view.appendChild(canvas); ctx=canvas.getContext('2d'); }
  function ensureFlow(){ mode='flow'; view.innerHTML=''; var d=document.createElement('div'); d.className='tr-flow'; view.appendChild(d); return d; }
  function setPageCount(n){ pages=new Array(n); updateBars(); }
  function totalPages(){ return pages.length; }

  /* ---------- PDF ---------- */
  function loadPDF(bytes){ ensurePaged();
    pdfjsLib.GlobalWorkerOptions.workerSrc=TR_BASE+'assets/vendor/pdfjs/pdf.worker.min.js';
    pdfjsLib.getDocument({data:bytes}).promise.then(function(doc){ pdfDoc=doc; imgBlobs=null; setPageCount(doc.numPages); gotoPage(0); })
      .catch(function(){ toast('PDF illisible'); });
  }
  function renderPDF(i){ if(!pdfDoc)return; pdfDoc.getPage(i+1).then(function(page){
    var vp0=page.getViewport({scale:1}); var availW=view.clientWidth-28, availH=view.clientHeight-28;
    var base=fitMode==='height'?(availH/vp0.height):(availW/vp0.width);
    var scale=Math.max(0.1,base*zoom); var dpr=Math.min(window.devicePixelRatio||1,2);
    var vp=page.getViewport({scale:scale*dpr});
    canvas.width=vp.width; canvas.height=vp.height; canvas.style.width=(vp.width/dpr)+'px'; canvas.style.height=(vp.height/dpr)+'px';
    page.render({canvasContext:ctx,viewport:vp});
  }); }

  /* ---------- images / CBZ ---------- */
  function loadImage(bytes){ ensurePaged(); pdfDoc=null; imgBlobs=[URL.createObjectURL(new Blob([bytes]))]; setPageCount(1); gotoPage(0); }
  function loadCBZ(bytes){ ensurePaged(); pdfDoc=null; var u; try{u=fflate.unzipSync(bytes);}catch(e){ return toast('Archive CBZ illisible'); }
    var names=Object.keys(u).filter(function(n){ return /\.(png|jpe?g|gif|webp|bmp)$/i.test(n) && n.indexOf('__MACOSX')<0; }).sort();
    if(!names.length) return toast('Aucune image dans l\u2019archive');
    imgBlobs=names.map(function(n){ return URL.createObjectURL(new Blob([u[n]])); }); setPageCount(imgBlobs.length); gotoPage(0);
  }
  function renderImage(i){ var im=new Image(); im.onload=function(){
    var availW=view.clientWidth-28, availH=view.clientHeight-28;
    var base=fitMode==='height'?(availH/im.height):(availW/im.width); var scale=Math.max(0.1,base*zoom); var dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=im.width*scale*dpr; canvas.height=im.height*scale*dpr; canvas.style.width=(im.width*scale)+'px'; canvas.style.height=(im.height*scale)+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(im,0,0,im.width*scale,im.height*scale);
  }; im.src=imgBlobs[i]; }

  /* ---------- texte / markdown / html ---------- */
  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function mdInline(s){ return s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g,'$1<em>$2</em>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<span class="lk">$1</span>'); }
  function mdToHtml(src){ var out=[],lines=src.split(/\r?\n/),inList=false;
    lines.forEach(function(l){ var h=/^(#{1,6})\s+(.*)$/.exec(l);
      if(h){ if(inList){out.push('</ul>');inList=false;} out.push('<h'+h[1].length+'>'+mdInline(escapeHtml(h[2]))+'</h'+h[1].length+'>'); return; }
      var li=/^\s*[-*]\s+(.*)$/.exec(l);
      if(li){ if(!inList){out.push('<ul>');inList=true;} out.push('<li>'+mdInline(escapeHtml(li[1]))+'</li>'); return; }
      if(inList){out.push('</ul>');inList=false;}
      if(l.trim()==='') out.push(''); else out.push('<p>'+mdInline(escapeHtml(l))+'</p>');
    }); if(inList)out.push('</ul>'); return out.join('\n'); }
  function sanitize(html){ var d=document.createElement('div'); d.innerHTML=html;
    d.querySelectorAll('script,style,link,iframe,object,embed,meta,base,form').forEach(function(n){ n.remove(); });
    d.querySelectorAll('*').forEach(function(n){ Array.prototype.slice.call(n.attributes).forEach(function(a){ if(/^on/i.test(a.name)||(a.name==='href'&&/javascript:/i.test(a.value))) n.removeAttribute(a.name); }); });
    return d.innerHTML; }
  function paginateText(raw){ var per=1700,out=[],i=0; raw=raw.replace(/\r\n/g,'\n');
    while(i<raw.length){ var end=Math.min(raw.length,i+per); if(end<raw.length){ var nl=raw.lastIndexOf('\n',end),sp=raw.lastIndexOf(' ',end),cut=Math.max(nl,sp); if(cut>i+500)end=cut; } out.push(raw.slice(i,end)); i=end; } return out.length?out:['']; }
  function loadText(bytes,fmt){ var s=new TextDecoder().decode(bytes);
    if(fmt==='html'){ flowSections=[sanitize(s)]; }
    else { var chunks=paginateText(s); flowSections=chunks.map(function(c){ return fmt==='md'?mdToHtml(c):'<pre class="tr-pre">'+escapeHtml(c)+'</pre>'; }); }
    setPageCount(flowSections.length); gotoPage(0);
  }

  /* ---------- EPUB ---------- */
  function resolvePath(base,rel){ if(/^(https?:|data:|blob:)/i.test(rel))return rel; var parts=(base+rel).split('/'),st=[]; parts.forEach(function(p){ if(p==='..')st.pop(); else if(p!=='.'&&p!=='')st.push(p); }); return st.join('/'); }
  function loadEPUB(bytes){ var u; try{u=fflate.unzipSync(bytes);}catch(e){ return toast('EPUB illisible'); }
    var cont=u['META-INF/container.xml']; if(!cont) return toast('EPUB invalide');
    var cdoc=new DOMParser().parseFromString(fflate.strFromU8(cont),'application/xml');
    var rf=cdoc.querySelector('rootfile'); if(!rf) return toast('EPUB invalide');
    var opfPath=rf.getAttribute('full-path'); var opfDir=opfPath.indexOf('/')>=0?opfPath.slice(0,opfPath.lastIndexOf('/')+1):'';
    var opf=new DOMParser().parseFromString(fflate.strFromU8(u[opfPath]),'application/xml');
    var items={}; Array.prototype.forEach.call(opf.querySelectorAll('manifest > item'),function(it){ items[it.getAttribute('id')]={href:it.getAttribute('href')}; });
    var spine=Array.prototype.map.call(opf.querySelectorAll('spine > itemref'),function(ir){ return items[ir.getAttribute('idref')]; }).filter(Boolean);
    var blobCache={};
    function urlFor(path){ if(blobCache[path])return blobCache[path]; if(!u[path])return ''; var b=URL.createObjectURL(new Blob([u[path]])); blobCache[path]=b; return b; }
    flowSections=spine.map(function(it){ return {epub:true, path:resolvePath(opfDir,it.href), u:u, urlFor:urlFor}; });
    if(!flowSections.length) return toast('EPUB sans contenu'); setPageCount(flowSections.length); gotoPage(0);
  }
  function renderFlow(i){ var host=ensureFlow(); var sec=flowSections[i];
    if(typeof sec==='string'){ host.innerHTML=sec; host.scrollTop=0; view.scrollTop=0; return; }
    /* section EPUB */ var raw=fflate.strFromU8(sec.u[sec.path]||new Uint8Array()); var html=sanitize(raw);
    var d=document.createElement('div'); d.innerHTML=html; var dir=sec.path.indexOf('/')>=0?sec.path.slice(0,sec.path.lastIndexOf('/')+1):'';
    d.querySelectorAll('img').forEach(function(im){ var src=im.getAttribute('src'); if(src) im.src=sec.urlFor(resolvePath(dir,src)); im.loading='lazy'; });
    d.querySelectorAll('a').forEach(function(a){ a.removeAttribute('href'); });
    host.innerHTML=d.innerHTML; host.scrollTop=0; view.scrollTop=0;
  }

  /* ---------- navigation & rendu ---------- */
  function render(){ if(mode==='paged'){ if(pdfDoc)renderPDF(idx); else if(imgBlobs)renderImage(idx); } else renderFlow(idx); updateBars(); }
  function gotoPage(i){ if(i<0)i=0; var max=totalPages()-1; if(i>max)i=max; if(i>allowedIdx)i=allowedIdx; idx=i; render(); }
  function next(){ if(idx>=allowedIdx && allowedIdx<totalPages()-1){ return softLock('Aperçu limité','Limite de '+(allowedIdx+1)+' page(s) atteinte pour cet aperçu. Procure-toi la version complète pour lire la suite.'); } if(idx<totalPages()-1) gotoPage(idx+1); }
  function prev(){ if(idx>0) gotoPage(idx-1); }
  function updateBars(){ var t=totalPages(); var pi=$('tr-pageinfo'); if(pi) pi.textContent=(idx+1)+' / '+t+((allowedIdx!==Infinity&&allowedIdx<t-1)?'  · aperçu '+(allowedIdx+1):''); var bar=$('tr-bar'); if(bar) bar.style.width=(t>1?(idx/(t-1))*100:100)+'%'; }

  /* ---------- filigrane dynamique ---------- */
  function buildWatermark(){ if(policy.watermark===false){ wm.style.display='none'; return; }
    var who=[buyer.name,buyer.email,buyer.order].filter(Boolean).join('  \u00b7  ') || (book&&book.title) || 'TRUvector.dev';
    function draw(){ var stamp=who+'   \u2014   '+new Date().toLocaleString('fr-FR');
      var c=document.createElement('canvas'); c.width=540; c.height=210; var x=c.getContext('2d');
      x.translate(270,105); x.rotate(-Math.PI/7); x.font='600 15px JetBrains Mono, monospace'; x.fillStyle='rgba(230,242,238,0.10)'; x.textAlign='center'; x.fillText(stamp,0,0);
      wm.style.backgroundImage='url('+c.toDataURL('image/png')+')'; wm.style.backgroundRepeat='repeat'; wm.style.display='block'; }
    draw(); if(wm._t)clearInterval(wm._t); wm._t=setInterval(draw,60000);
  }

  /* ---------- minuteur de lecture ---------- */
  function fmtTime(s){ var m=Math.floor(s/60),ss=s%60; return m+':'+('0'+ss).slice(-2); }
  function startTimer(){ if(timer)clearInterval(timer); timer=setInterval(tick,1000); tick(); }
  function tick(){ if(locked||document.hidden)return; elapsed++; if(elapsed%5===0)lsSet('elapsed',elapsed);
    var el=$('tr-time');
    if(policy.minutes){ var left=policy.minutes*60-elapsed; if(el)el.textContent='\u23f1 '+fmtTime(Math.max(0,left)); if(left<=0){ lsSet('elapsed',elapsed); hardLock('Temps de lecture écoulé','La durée autorisée ('+policy.minutes+' min) est atteinte pour cet appareil.'); } }
    else if(el){ el.textContent='\u23f1 '+fmtTime(elapsed); }
  }

  /* ---------- verrous ---------- */
  function showLock(t,s,hard){ lockOv.classList.remove('hidden'); $('tr-lock-t').textContent=t; $('tr-lock-s').textContent=s; var b=$('tr-lock-x'); if(b) b.style.display=hard?'none':'inline-flex'; }
  function softLock(t,s){ showLock(t,s,false); }
  function hardLock(t,s){ locked=true; if(timer)clearInterval(timer); if(wm&&wm._t)clearInterval(wm._t); showLock(t,s,true); }

  /* ---------- anti-copie ---------- */
  function wireAntiCopy(){ if(window._trAC)return; window._trAC=1;
    document.addEventListener('contextmenu',function(e){ if(e.target.closest('#tr-stage')) e.preventDefault(); });
    document.addEventListener('dragstart',function(e){ if(e.target.closest('#tr-stage')) e.preventDefault(); });
    document.addEventListener('copy',function(e){ if(e.target.closest&&e.target.closest('#tr-stage')){ e.preventDefault(); } });
    document.addEventListener('keydown',function(e){ var k=(e.key||'').toLowerCase();
      if((e.ctrlKey||e.metaKey)&&['s','p','c','u'].indexOf(k)>=0){ e.preventDefault(); toast('Action désactivée sur un document protégé'); }
      if(k==='printscreen'){ flash(); } });
    if(policy.blurOnBlur!==false){ document.addEventListener('visibilitychange',function(){ stage.classList.toggle('tr-hide',document.hidden); }); window.addEventListener('blur',function(){ stage.classList.add('tr-hide'); }); window.addEventListener('focus',function(){ stage.classList.remove('tr-hide'); }); }
  }
  function flash(){ stage.classList.add('tr-hide'); setTimeout(function(){ stage.classList.remove('tr-hide'); },1200); toast('Capture détectée — contenu masqué'); }

  /* ---------- init ---------- */
  function fileToBytes(f){ var r=new FileReader(); r.onload=function(){ loadFromBytes(new Uint8Array(r.result), f.name); }; r.readAsArrayBuffer(f); }
  function init(){ stage=$('tr-stage'); view=$('tr-view'); wm=$('tr-wm'); lockOv=$('tr-lock'); gate=$('tr-gate'); if(!stage)return;
    $('tr-prev').onclick=prev; $('tr-next').onclick=next;
    $('tr-zin').onclick=function(){ zoom=Math.min(4,zoom*1.15); render(); };
    $('tr-zout').onclick=function(){ zoom=Math.max(0.3,zoom/1.15); render(); };
    $('tr-fit').onclick=function(){ fitMode=(fitMode==='width'?'height':'width'); zoom=1; render(); };
    $('tr-fs').onclick=function(){ if(!document.fullscreenElement){ (stage.requestFullscreen||stage.webkitRequestFullscreen||function(){}).call(stage); } else document.exitFullscreen(); };
    var lx=$('tr-lock-x'); if(lx) lx.onclick=function(){ lockOv.classList.add('hidden'); };
    document.addEventListener('keydown',function(e){ if(gate&&!gate.classList.contains('hidden'))return; if(['ArrowRight','PageDown',' '].indexOf(e.key)>=0){ e.preventDefault(); next(); } else if(['ArrowLeft','PageUp'].indexOf(e.key)>=0){ e.preventDefault(); prev(); } });
    window.addEventListener('resize',function(){ clearTimeout(window._trR); window._trR=setTimeout(function(){ if(pages.length)render(); },150); });
    document.addEventListener('fullscreenchange',function(){ setTimeout(function(){ if(pages.length)render(); },80); });
    var d=$('tr-drop'), fi=$('tr-drop-file');
    if(fi) fi.onchange=function(){ if(fi.files[0]) fileToBytes(fi.files[0]); };
    if(d){ ['dragover','dragenter'].forEach(function(ev){ d.addEventListener(ev,function(e){ e.preventDefault(); d.classList.add('over'); }); });
      ['dragleave','drop'].forEach(function(ev){ d.addEventListener(ev,function(e){ e.preventDefault(); d.classList.remove('over'); }); });
      d.addEventListener('drop',function(e){ if(e.dataTransfer.files[0]) fileToBytes(e.dataTransfer.files[0]); }); }
    var q=new URLSearchParams(location.search); var src=q.get('src');
    if(src){ loadFromURL(src); }
    else if(q.get('preview')){ try{ var pj=sessionStorage.getItem('tru_preview'); if(pj){ loadFromBytes(new TextEncoder().encode(pj),'preview.trubook'); } else showDrop(); }catch(e){ showDrop(); } }
    else { showDrop(); }
  }
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
