/* TRUvector — kit commun des modules « boîte à outils » (v1).
   K.api() appelle le Worker du site (/api/tools/…) : aucun service tiers dans la page. */
(function(){
  var K=window.K={};
  K.$=function(id){ return document.getElementById(id); };
  K.esc=function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  K.toast=function(m){ var t=K.$('toast'); if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
    t.textContent=m; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(function(){ t.classList.remove('show'); },1700); };
  K.copy=function(txt){ (navigator.clipboard?navigator.clipboard.writeText(String(txt)):Promise.reject()).then(function(){ K.toast('Copié ✓'); },function(){ K.toast('Copie impossible'); }); };
  K.debounce=function(fn,ms){ var t; return function(){ var a=arguments,s=this; clearTimeout(t); t=setTimeout(function(){ fn.apply(s,a); },ms||250); }; };
  /* cartes de résultats : [[libellé, valeur(html), classe?, copiable?], …] */
  K.cards=function(el,items){ el.classList.add('kres'); el.innerHTML=items.filter(Boolean).map(function(it){
      return '<div class="'+(it[2]||'')+'"><b class="k">'+K.esc(it[0])+'</b><span class="v'+(it[3]?' cp" title="Cliquer pour copier" data-cp="'+K.esc(it[3]):'')+'">'+it[1]+'</span></div>'; }).join('');
    el.querySelectorAll('[data-cp]').forEach(function(n){ n.onclick=function(){ K.copy(n.getAttribute('data-cp')); }; }); };
  K.table=function(heads,rows){ return '<div class="ktw"><table class="kt"><thead><tr>'+heads.map(function(h){ return '<th>'+K.esc(h)+'</th>'; }).join('')+'</tr></thead><tbody>'+
    rows.map(function(r){ return '<tr>'+r.map(function(c,i){ return '<td'+(i===0?'':' class="m"')+'>'+c+'</td>'; }).join('')+'</tr>'; }).join('')+'</tbody></table></div>'; };
  K.loading=function(el,msg){ el.className=''; el.innerHTML='<div class="kload">'+K.esc(msg||'Analyse en cours')+'</div>'; };
  K.error=function(el,msg){ el.className=''; el.innerHTML='<div class="kerr" role="alert">✗ '+K.esc(msg)+'</div>'; };
  /* appel du Worker */
  var ROOT=(function(){ var s=document.currentScript&&document.currentScript.src||''; return s.replace(/modules\/apps\/_kit\/kit\.js.*$/,''); })();
  K.root=ROOT;
  K.api=function(path,params,opt){ opt=opt||{};
    var qs=params?Object.keys(params).filter(function(k){ return params[k]!=null&&params[k]!==''; }).map(function(k){ return encodeURIComponent(k)+'='+encodeURIComponent(params[k]); }).join('&'):'';
    var ctl=window.AbortController?new AbortController():null, to=setTimeout(function(){ if(ctl) ctl.abort(); },opt.timeout||15000);
    return fetch(ROOT+'api/tools/'+path+(qs?'?'+qs:''),{method:opt.method||'GET',body:opt.body,headers:opt.headers,cache:'no-store',signal:ctl?ctl.signal:undefined})
      .then(function(r){ clearTimeout(to); var ct=r.headers.get('content-type')||'';
        if(ct.indexOf('application/json')<0){ if(opt.raw&&r.ok) return r; throw new Error(r.status===404?'Outil serveur indisponible : le Worker du site n’est pas encore déployé.':'Réponse inattendue du serveur ('+r.status+').'); }
        return r.json().then(function(j){ if(!r.ok||j.error) throw new Error(j.error||('Erreur '+r.status)); return j; }); })
      .catch(function(e){ clearTimeout(to); if(e.name==='AbortError') throw new Error('Délai dépassé, réessaie.'); throw e; }); };
  /* état partageable dans l'adresse (#k=v&…) */
  K.state=function(ids,run){ function read(){ var h={}; (location.hash||'').slice(1).split('&').forEach(function(p){ var kv=p.split('='); if(kv[0]) h[kv[0]]=decodeURIComponent(kv[1]||''); }); return h; }
    var h=read(), any=false; ids.forEach(function(id){ var el=K.$(id); if(el&&h[id]!=null){ if(el.type==='checkbox') el.checked=h[id]==='1'; else el.value=h[id]; any=true; } });
    if(h.q&&ids.length){ var f=K.$(ids[0]); if(f){ f.value=h.q; any=true; } }
    K.share=function(){ var parts=ids.map(function(id){ var el=K.$(id); if(!el) return ''; var v=el.type==='checkbox'?(el.checked?'1':'0'):el.value; return v?id+'='+encodeURIComponent(v):''; }).filter(Boolean);
      var url=location.origin+location.pathname+'#'+parts.join('&'); K.copy(url); };
    if(any&&run) setTimeout(run,50); return any; };
  /* export */
  K.download=function(name,text,type){ var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:type||'text/plain'})); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); },1000); };
  K.toMd=function(title,el){ var out=['# '+title,'',new Date().toLocaleString('fr-FR'),''];
    el.querySelectorAll('.kres>div, .ksec>h2, .kt tr').forEach(function(n){ if(n.matches('.ksec>h2')) out.push('','## '+n.textContent.trim(),'');
      else if(n.matches('tr')) out.push('| '+[].map.call(n.children,function(c){ return c.textContent.trim().replace(/\|/g,'/'); }).join(' | ')+' |');
      else { var k=n.querySelector('.k'), v=n.querySelector('.v'); if(k&&v) out.push('- **'+k.textContent.trim()+'** : '+v.textContent.trim()); } });
    return out.join('\n')+'\n\n— TRUvector.dev\n'; };
  K.exportBar=function(host,title,getEl,getJson){ var b=document.createElement('div'); b.className='kbar';
    b.innerHTML='<button class="btn btn-ghost" type="button" data-a="md">⬇ Rapport Markdown</button>'+(getJson?'<button class="btn btn-ghost" type="button" data-a="json">⬇ JSON</button>':'')+'<button class="btn btn-ghost" type="button" data-a="share">🔗 Lien de partage</button>';
    b.onclick=function(e){ var a=e.target.getAttribute('data-a'); if(!a) return; if(a==='md') K.download(title.replace(/\W+/g,'-').toLowerCase()+'.md',K.toMd(title,getEl()),'text/markdown');
      if(a==='json') K.download(title.replace(/\W+/g,'-').toLowerCase()+'.json',JSON.stringify(getJson(),null,2),'application/json'); if(a==='share'&&K.share) K.share(); };
    host.appendChild(b); return b; };
  /* utilitaires réseau partagés */
  K.ipv4=function(s){ var m=String(s).trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/); if(!m) return null; var a=m.slice(1).map(Number); return a.every(function(x){ return x<=255; })?a:null; };
  K.isIPv6=function(s){ return /^[0-9a-f:]+$/i.test(s)&&s.indexOf(':')>=0&&(s.match(/::/g)||[]).length<=1; };
  K.domain=function(s){ s=String(s||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/[\/?#].*$/,'').replace(/\.$/,''); return /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(s)?s:null; };
})();
