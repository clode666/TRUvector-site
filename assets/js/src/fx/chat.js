/* TVFX · module Assistant (chat) — chargé au premier clic sur la bulle.
   Mode « local » : FAQ + index du site (chatbot-index.json), 100 % navigateur.
   Mode « ai »    : /api/chat (Worker Cloudflare, Workers AI) en flux continu,
                    avec repli automatique sur le mode local en cas d'erreur/quota.
   La conversation reste dans l'onglet (sessionStorage) : rien n'est envoyé
   ailleurs qu'à ton propre site, et rien n'est enregistré côté serveur. */
(function(){ var X=window.TVFX; if(!X||X.chat) return;
  var CFG=window.TVCONFIG||{}, B=CFG.chatbot||{}, ROOT=X.root, esc=X.esc, norm=function(s){ return X.norm(s).replace(/-/g,''); };
  var EN=/^en\b/i.test(navigator.language||'')&&!!B.greetingEn, LANG=EN?'en':'fr';
  var T=EN?{ph:'Ask your question…',send:'Send',close:'Close',local:'local mode',ai:'AI · site sources',sources:'Sources',mic:'Speak (browser speech recognition)',none:'I could not find a reliable answer. Try the search (Ctrl + K) or rephrase with a keyword.',fb:'Answering in local mode.',reset:'New conversation'}
          :{ph:'Pose ta question…',send:'Envoyer',close:'Fermer',local:'mode local',ai:'IA · sources du site',sources:'Sources',mic:'Parler (reconnaissance vocale du navigateur)',none:'Je n’ai pas trouvé de réponse sûre. Essaie la recherche (Ctrl + K) ou reformule avec un mot-clé : logiciel, e-book, musique…',fb:'Je réponds en mode local.',reset:'Nouvelle conversation'};
  var EB=CFG.ebooks||{}, C=CFG.catalog||{};
  function vis(a){ return (a||[]).filter(function(x){ return x&&x.visible!==false; }); }
  function fdate(d){ try{ return new Date(d+'T12:00:00').toLocaleDateString(EN?'en-GB':'fr-FR',{day:'numeric',month:'long',year:'numeric'}); }catch(e){ return d; } }
  function fill(s){ return String(s||'').replace(/\{passphrase\}/g,'<b>'+esc(EB.passphrase||'truvector')+'</b>').replace(/\{date\}/g,'<b>'+esc(fdate(EB.until||''))+'</b>'); }
  function href(u){ if(!u) return ''; return /^(https?:|\/|#)/.test(u)?u:ROOT+u; }
  var AIMODE=B.mode==='ai', fellBack=false; try{ fellBack=+sessionStorage.getItem('tv_chat_fb')>Date.now(); }catch(e){}

  /* ---------- interface ---------- */
  var box=document.createElement('div'); box.id='tvfx-chat'; box.setAttribute('role','dialog'); box.setAttribute('aria-label',(B.name||'TRU')+(EN?' — assistant':' — assistant du site'));
  box.innerHTML='<div class="hd"><div class="av" aria-hidden="true">'+esc(B.avatar||'✦')+'</div><div class="id"><b>'+esc(B.name||'TRU')+'</b><small class="md"></small></div>'+
    '<button type="button" class="rs" title="'+T.reset+'" aria-label="'+T.reset+'">↺</button><button type="button" class="x" aria-label="'+T.close+'">✕</button></div>'+
    '<div class="msgs" aria-live="polite" aria-relevant="additions"></div><div class="sug"></div><div class="ts" aria-hidden="true"></div>'+
    '<form autocomplete="off"><input type="text" maxlength="'+(B.maxChars||600)+'" aria-label="'+T.ph+'" placeholder="'+T.ph+'">'+
    '<button type="button" class="mic" hidden aria-label="'+T.mic+'" title="'+T.mic+'">🎙</button><button type="submit" class="go">'+T.send+'</button></form>';
  document.body.appendChild(box);
  var msgs=box.querySelector('.msgs'), inp=box.querySelector('input'), sug=box.querySelector('.sug'), md=box.querySelector('.md'), busy=false;
  function mode(){ var ai=AIMODE&&!fellBack; md.textContent='● '+(ai?T.ai:T.local); md.classList.toggle('ai',ai); }
  mode();
  var HIST=[]; try{ HIST=JSON.parse(sessionStorage.getItem('tv_chat')||'[]'); }catch(e){}
  function save(){ try{ sessionStorage.setItem('tv_chat',JSON.stringify(HIST.slice(-12))); }catch(e){} }
  function bubble(html,who){ var d=document.createElement('div'); d.className='m '+who; d.innerHTML=html; msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight; return d; }
  function greet(){ msgs.innerHTML=''; bubble(esc(EN?(B.greetingEn||B.greeting):(B.greeting||'Salut ✦')),'bot');
    sug.innerHTML=''; ((EN?B.suggestionsEn:B.suggestions)||[]).slice(0,5).forEach(function(s){ var b=document.createElement('button'); b.type='button'; b.textContent=s; b.onclick=function(){ ask(s); }; sug.appendChild(b); }); }
  if(HIST.length){ HIST.forEach(function(h){ bubble(h.role==='user'?esc(h.content):(h.html||esc(h.content)),h.role==='user'?'me':'bot'); }); sug.innerHTML=''; } else greet();

  /* ---------- moteur local : FAQ + index + libraire ---------- */
  var INDEX=null, idxP=null;
  function loadIndex(){ return idxP||(idxP=fetch(ROOT+'chatbot-index.json').then(function(r){ return r.ok?r.json():null; }).catch(function(){ return null; }).then(function(j){ INDEX=j; return j; })); }
  var STOP=' les des une pour avec dans sur est sont que qui quoi comment quel quelle quels quelles mon mes ton tes son ses nous vous pas plus tout tous cette ces aux par the and for you what how does faire peux peut veux trouve cherche ';
  function words(s){ return norm(s).split(/[^a-z0-9]+/).filter(function(w){ return w.length>2&&STOP.indexOf(' '+w+' ')<0; }); }
  function faq(q){ var n=norm(q), best=null, bs=0;
    vis(B.faq).forEach(function(f){ var s=0; (f.variants||[]).concat([f.q]).forEach(function(k){ var nk=norm(k); if(nk.length>2&&n.indexOf(nk)>=0) s+=nk.length; });
      words(f.q).forEach(function(w){ if(n.indexOf(w)>=0) s+=1; }); if(s>bs){ bs=s; best=f; } });
    return bs>=4?best:null; }
  function search(q,k){ if(!INDEX) return []; var qs=words(q); if(!qs.length) return []; var N=INDEX.chunks.length, df=INDEX.df||{}, seen={};
    return INDEX.chunks.map(function(c){ var t=norm(c.x), tt=norm(c.t), s=0; qs.forEach(function(w){ if(t.indexOf(w)<0&&tt.indexOf(w)<0) return; s+=Math.log(1+N/(1+(df[w]||1)))*(tt.indexOf(w)>=0?2.2:1); }); return {c:c,s:s}; })
      .filter(function(r){ return r.s>2.5; }).sort(function(a,b){ return b.s-a.s; }).filter(function(r){ if(seen[r.c.u]) return false; seen[r.c.u]=1; return true; }).slice(0,k||3).map(function(r){ return r.c; }); }
  function librarian(q){ var n=norm(q); if(!/(nouvelle|ebook|livre|lire|histoire|roman|story|book|read)/.test(n)) return null;
    var mx=null, mm=n.match(/(moins de|max(?:imum)?|under|less than)\s*(\d{1,3})\s*(min|minutes)/); if(mm) mx=+mm[2]; else if(/(courte|court|rapide|short|quick)/.test(n)) mx=20;
    var qs=words(q).filter(function(w){ return !/(nouvelle|ebook|livre|lire|histoire|roman|story|book|read|une|veux|aime|moins|minutes|courte|court|rapide|short|quick|under|less|than)/.test(w)&&!/^\d+$/.test(w); });
    if(!qs.length&&mx==null) return null;
    var timed=vis(C.ebooks).some(function(b){ return +b.minutes>0; });
    var hits=vis(C.ebooks).map(function(b){ var h=norm(b.genre+' '+b.title+' '+b.blurb), s=qs.length?0:1; qs.forEach(function(w){ if(h.indexOf(w)>=0) s+=norm(b.genre).indexOf(w)>=0?3:1; }); return {b:b,s:s}; })
      .filter(function(r){ return r.s>0&&(mx==null||!timed||(+r.b.minutes>0&&+r.b.minutes<=mx)); }).sort(function(a,b){ return b.s-a.s; }).slice(0,3);
    if(!hits.length) return null; var pass=EB.passphrase||'truvector';
    return (EN?'Here is what I would suggest:':'Voici ce que je te conseille :')+'<br>'+hits.map(function(r){ var b=r.b, u=ROOT+'ebooks/lecteur.html?src='+encodeURIComponent(X.cdn+'/ebooks/'+b.slug+'.trubook')+'&k='+encodeURIComponent(pass);
      return '📖 <a href="'+esc(u)+'">'+esc(b.title)+'</a> <span class="g">'+esc(b.genre)+(+b.minutes>0?' · ≈ '+b.minutes+' min':'')+'</span><br><small>'+esc(b.blurb)+'</small>'; }).join('<br>')+(mx!=null&&!timed?'<br><small>'+(EN?'(Reading times are not listed yet.)':'(Les durées de lecture ne sont pas encore renseignées.)')+'</small>':'')+(EB.until?'<br><small>'+(EN?'Readable until ':'Lisible jusqu’au ')+esc(fdate(EB.until))+'.</small>':''); }
  function local(q){ var html='', f=faq(q), lib=librarian(q), hits=search(q,3);
    if(f) html+=fill(esc(EN&&f.aEn?f.aEn:f.a))+(f.url?' <a href="'+esc(href(f.url))+'">'+(EN?'Open →':'Y aller →')+'</a>':'');
    if(lib) html+=(html?'<br><br>':'')+lib;
    var rel=hits.filter(function(h){ return !f||h.u!==f.url; });
    if(rel.length) html+=(html?'<br><br>'+(EN?'Also worth reading:':'À voir aussi :'):(EN?'Here is what I found:':'Voici ce que j’ai trouvé :'))+'<br>'+rel.map(function(h){ return '• '+kindIc(h.k)+' <a href="'+esc(href(h.u))+'">'+esc(h.t)+'</a>'; }).join('<br>');
    return html||esc(T.none); }
  function kindIc(k){ return {article:'📝',logiciel:'💾',module:'🧩','e-book':'📖',faq:'💡'}[k]||'•'; }

  /* ---------- anti-robot Turnstile (seulement en mode IA, si configuré) ---------- */
  var tsP=null, tsId=null, tsWait=null;
  function turnstile(){ if(!B.turnstileSiteKey) return Promise.resolve(null);
    if(!tsP) tsP=new Promise(function(res){ window.tvTsReady=function(){ res(); }; var s=document.createElement('script'); s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=tvTsReady'; s.async=true; s.onerror=function(){ res(); }; document.head.appendChild(s); })
      .then(function(){ if(!window.turnstile) return; tsId=turnstile_render(); });
    return tsP.then(function(){ if(!window.turnstile||tsId==null) return null;
      var t=window.turnstile.getResponse(tsId); if(t) return t;
      return new Promise(function(res){ tsWait=res; setTimeout(function(){ if(tsWait===res){ tsWait=null; res(null); } },12000); }); }); }
  function turnstile_render(){ var host=box.querySelector('.ts'); host.removeAttribute('aria-hidden');
    return window.turnstile.render(host,{sitekey:B.turnstileSiteKey,appearance:'interaction-only',language:LANG,callback:function(t){ if(tsWait){ var r=tsWait; tsWait=null; r(t); } }}); }
  function tsReset(){ try{ if(window.turnstile&&tsId!=null) window.turnstile.reset(tsId); }catch(e){} }

  /* ---------- mode IA : flux SSE ---------- */
  function fmt(txt,srcs){ var h=esc(txt).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|\n)- (.+)/g,'$1• $2');
    h=h.replace(/https?:\/\/\S+/g,'');                                    /* aucun lien écrit par le modèle */
    h=h.replace(/\[(\d)\]/g,function(m,n){ var s=srcs[n-1]; return s?'<a class="cite" href="'+esc(href(s.u))+'" title="'+esc(s.t)+'">'+n+'</a>':''; });
    return h.replace(/\n/g,'<br>'); }
  function aiAsk(q,holder){ var hist=HIST.slice(-10).map(function(h){ return {role:h.role,content:h.content}; });
    return turnstile().then(function(tok){ return fetch(ROOT+'api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:q,history:hist,lang:LANG,token:tok})}); })
    .then(function(r){ tsReset();
      if(!r.ok) return r.json().catch(function(){ return {}; }).then(function(j){ var e=new Error(j.error||('HTTP '+r.status)); e.fallback=j.fallback!==false; e.msg=j.error; throw e; });
      var rd=r.body.getReader(), dec=new TextDecoder(), buf='', txt='', srcs=[];
      function pump(){ return rd.read().then(function(o){ if(o.done) return;
        buf+=dec.decode(o.value,{stream:true}); var parts=buf.split('\n'); buf=parts.pop();
        parts.forEach(function(line){ line=line.trim(); if(line.indexOf('data:')!==0) return; var d=line.slice(5).trim(); if(!d||d==='[DONE]') return;
          try{ var j=JSON.parse(d); if(j.sources){ srcs=j.sources; return; } var piece=j.response!=null?j.response:(j.choices&&j.choices[0]&&j.choices[0].delta&&j.choices[0].delta.content)||''; txt+=piece; }catch(e){} });
        holder.innerHTML=fmt(txt,srcs)+'<span class="cur"></span>'; msgs.scrollTop=msgs.scrollHeight; return pump(); }); }
      return pump().then(function(){ if(!txt.trim()) throw Object.assign(new Error('vide'),{fallback:true});
        var html=fmt(txt.trim(),srcs);
        var seen={}, uniq=srcs.filter(function(s){ if(seen[s.u]) return false; seen[s.u]=1; return true; });
        if(uniq.length) html+='<div class="src"><span>'+T.sources+' :</span> '+uniq.map(function(s){ return '<a href="'+esc(href(s.u))+'">'+kindIc(s.k)+' '+esc(s.t.split(' — ')[0])+'</a>'; }).join(' ')+'</div>';
        return {html:html,text:txt.trim()}; }); }); }

  /* ---------- poser une question ---------- */
  function ask(q){ q=String(q||'').trim(); if(!q||busy) return; busy=true; sug.innerHTML=''; inp.value='';
    bubble(esc(q),'me'); HIST.push({role:'user',content:q});
    var holder=bubble('<span class="typing"><i></i><i></i><i></i></span>','bot');
    function done(html,text){ holder.innerHTML=html; HIST.push({role:'assistant',content:text||holder.textContent,html:html}); save(); busy=false; msgs.scrollTop=msgs.scrollHeight; X.blip(760,.05); }
    function viaLocal(note){ return loadIndex().then(function(){ var h=local(q); done((note?'<small class="note">'+esc(note)+'</small><br>':'')+h); }); }
    if(AIMODE&&!fellBack) aiAsk(q,holder).then(function(r){ done(r.html,r.text); }).catch(function(e){
        if(e.fallback!==false){ fellBack=true; try{ sessionStorage.setItem('tv_chat_fb',String(Date.now()+6e5)); }catch(x){} mode(); }
        viaLocal((e.msg||T.fb)+(e.msg?' '+T.fb:'')); });
    else setTimeout(function(){ viaLocal(''); },250); }
  box.querySelector('form').onsubmit=function(e){ e.preventDefault(); ask(inp.value); };
  box.querySelector('.x').onclick=function(){ close(); };
  box.querySelector('.rs').onclick=function(){ HIST=[]; save(); greet(); inp.focus(); };

  /* ---------- voix (reconnaissance du navigateur) ---------- */
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition, mic=box.querySelector('.mic');
  if(SR&&B.voice!==false){ mic.hidden=false; var rec=null;
    mic.onclick=function(){ if(rec){ rec.stop(); return; } rec=new SR(); rec.lang=EN?'en-US':'fr-FR'; rec.interimResults=true;
      mic.classList.add('on'); rec.onresult=function(e){ var t=''; for(var i=0;i<e.results.length;i++) t+=e.results[i][0].transcript; inp.value=t; if(e.results[e.results.length-1].isFinal){ rec.stop(); ask(t); } };
      rec.onend=function(){ mic.classList.remove('on'); rec=null; }; rec.onerror=function(){ mic.classList.remove('on'); rec=null; }; try{ rec.start(); }catch(e){ rec=null; mic.classList.remove('on'); } }; }

  /* ---------- ouverture / fermeture ---------- */
  var fab=document.getElementById('tvfx-chatfab'), opener=null;
  function open(q){ opener=document.activeElement; box.classList.add('on'); if(fab){ fab.setAttribute('aria-expanded','true'); fab.classList.add('open'); }
    loadIndex(); if(AIMODE&&!fellBack&&B.turnstileSiteKey) turnstile();
    setTimeout(function(){ inp.focus(); },40); if(q) ask(q); }
  function close(){ box.classList.remove('on'); if(fab){ fab.setAttribute('aria-expanded','false'); fab.classList.remove('open'); } if(opener&&opener.focus) try{ opener.focus(); }catch(e){} }
  addEventListener('keydown',function(e){ if(e.key==='Escape'&&box.classList.contains('on')){ e.stopPropagation(); close(); } });
  X.chat={open:open,close:close,toggle:function(q){ box.classList.contains('on')&&!q?close():open(q); },ask:ask,local:local,isOpen:function(){ return box.classList.contains('on'); }};
})();
