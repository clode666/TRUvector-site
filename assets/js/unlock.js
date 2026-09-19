/* TRUvector v5 — déverrouillage côté client (sans serveur).
   Une section = un coffre AES-256-GCM (vault.json). Ouverture par PASSPHRASE
   ou par FICHIER-CLÉ .trukey. Rien de lisible sans la bonne clé. */
(function(){
  var section = document.body.getAttribute('data-section');
  if(!section) return;
  var subtle = window.crypto && window.crypto.subtle;
  var content = document.getElementById('tv-content');
  if(!subtle || !content) return;
  var enc = new TextEncoder(), dec = new TextDecoder();

  function ub64(s){ s=(s||'').replace(/\s+/g,''); var b=atob(s), u=new Uint8Array(b.length); for(var i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }
  function b64(u){ u=new Uint8Array(u); var s=''; for(var i=0;i<u.length;i++) s+=String.fromCharCode(u[i]); return btoa(s); }
  function rawKey(bytes){ return subtle.importKey('raw', bytes, {name:'AES-GCM'}, false, ['decrypt']); }
  function gcmDec(key,o){ return subtle.decrypt({name:'AES-GCM', iv:ub64(o.iv)}, key, ub64(o.ct)); }
  async function pbkdf2(pass, salt, iters){
    var km = await subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey({name:'PBKDF2', salt:salt, iterations:iters, hash:'SHA-256'}, km, {name:'AES-GCM',length:256}, false, ['decrypt']);
  }

  // ---------- styles (gate + lightbox), autonomes ----------
  var st=document.createElement('style'); st.textContent=[
    ".tv-gate{position:fixed;inset:0;z-index:120;background:var(--nuit,#070b11);display:flex;align-items:center;justify-content:center;padding:24px}",
    ".tv-gate.hidden{display:none}",
    ".tv-gate .box{max-width:420px;width:100%;text-align:center}",
    ".tv-gate .lk{width:70px;height:70px;margin:0 auto 14px;filter:drop-shadow(0 0 9px rgba(52,245,197,.7))}",
    ".tv-gate h2{font-size:21px;margin:0 0 6px;color:var(--texte,#e8f2ee)}",
    ".tv-gate p{color:var(--texte-2,#9db2ae);font-size:14px;margin:0 0 18px}",
    ".tv-gate input[type=password]{width:100%;text-align:center;letter-spacing:2px;font-family:var(--mono,monospace);font-size:16px;color:var(--texte,#e8f2ee);background:var(--panneau,rgba(17,27,37,.6));border:1px solid var(--bord-fort,rgba(126,240,205,.34));border-radius:12px;padding:14px;margin-bottom:10px}",
    ".tv-gate .drop{border:1px dashed var(--bord-fort,rgba(126,240,205,.34));border-radius:12px;padding:14px;color:var(--texte-3,#6f8582);font-family:var(--mono,monospace);font-size:12.5px;cursor:pointer;margin-bottom:10px}",
    ".tv-gate .drop.ok{border-color:var(--aurore-g,#59e39a);color:var(--aurore-g,#59e39a)}",
    ".tv-gate .drop.over{border-color:var(--menthe,#34f5c5);color:var(--menthe,#34f5c5)}",
    ".tv-gate .or{font-family:var(--mono,monospace);font-size:11px;color:var(--texte-3,#6f8582);margin:2px 0 10px}",
    ".tv-gate .err{color:#ff8b8b;font-family:var(--mono,monospace);font-size:12.5px;min-height:18px;margin-bottom:8px}",
    ".tv-gate small{display:block;color:var(--texte-3,#6f8582);font-family:var(--mono,monospace);font-size:11px;margin-top:16px;line-height:1.6}",
    ".tv-lb{position:fixed;inset:0;z-index:140;background:rgba(4,7,11,.92);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:24px}",
    ".tv-lb.on{display:flex}.tv-lb img{max-width:94vw;max-height:88vh;border-radius:12px;border:1px solid var(--bord,rgba(126,240,205,.16))}",
    ".tv-lb .x{position:absolute;top:16px;right:18px;width:42px;height:42px;border-radius:10px;background:none;border:1px solid var(--bord,rgba(126,240,205,.16));color:var(--texte-2,#9db2ae);font-size:20px;cursor:pointer}"
  ].join("\n");
  document.head.appendChild(st);

  var TRIS='<svg class="lk" viewBox="0 0 120 120" aria-hidden="true"><path d="M40 52 V40 a20 20 0 0 1 40 0 V52" fill="none" stroke="#34f5c5" stroke-width="7" stroke-linecap="round"/><rect x="28" y="52" width="64" height="50" rx="10" fill="none" stroke="#34f5c5" stroke-width="7"/><circle cx="60" cy="72" r="6" fill="#34f5c5"/><path d="M60 78 v10" stroke="#34f5c5" stroke-width="7" stroke-linecap="round"/></svg>';
  var gate=document.createElement('div'); gate.className='tv-gate';
  gate.innerHTML='<div class="box">'+TRIS+'<h2>Section verrouillée</h2><p>Entre ta passphrase, ou charge ton fichier‑clé.</p>'+
    '<input id="tvpass" type="password" autocomplete="off" placeholder="passphrase" aria-label="Passphrase">'+
    '<div class="or">— ou —</div>'+
    '<label class="drop" id="tvdrop">Glisse ou clique pour charger un fichier‑clé (.trukey)<input id="tvfile" type="file" accept=".trukey,.json,.txt,application/json" hidden></label>'+
    '<div class="err" id="tverr" role="alert"></div>'+
    '<button class="btn" id="tvgo" style="width:100%;justify-content:center">Déverrouiller →</button>'+
    '<small>Chiffrement AES‑256‑GCM côté client.<br>Ni Cloudflare ni serveur pour les droits.</small></div>';
  document.body.appendChild(gate);

  var pass=gate.querySelector('#tvpass'), fileInput=gate.querySelector('#tvfile'),
      drop=gate.querySelector('#tvdrop'), err=gate.querySelector('#tverr'), go=gate.querySelector('#tvgo');
  var keyBytes=null, vault=null;

  fileInput.addEventListener('change', function(){ if(fileInput.files[0]) readKey(fileInput.files[0]); });
  ['dragover','dragenter'].forEach(function(e){ drop.addEventListener(e,function(ev){ev.preventDefault();drop.classList.add('over');}); });
  ['dragleave','drop'].forEach(function(e){ drop.addEventListener(e,function(ev){ev.preventDefault();drop.classList.remove('over');}); });
  drop.addEventListener('drop', function(ev){ if(ev.dataTransfer.files[0]) readKey(ev.dataTransfer.files[0]); });
  function readKey(f){
    var r=new FileReader();
    r.onload=function(){ try{
        var t=(r.result||'').trim(), k;
        try{ var j=JSON.parse(t); k=j.k||j.key||t; }catch(e){ k=t; }
        keyBytes=ub64(k); drop.classList.add('ok'); drop.textContent='Fichier‑clé chargé : '+f.name; err.textContent='';
      }catch(e){ err.textContent='Fichier‑clé illisible.'; }
    };
    r.readAsText(f);
  }

  async function getVault(){ if(vault) return vault; var r=await fetch('vault.json',{cache:'no-store'}); if(!r.ok) throw new Error('vault'); vault=await r.json(); return vault; }
  async function cekFromPass(v,p){ var kek=await pbkdf2(p, ub64(v.salt), (v.kdf&&v.kdf.iters)||210000); return new Uint8Array(await gcmDec(kek, v.pass)); }
  async function cekFromFile(v,bytes){ var k=await rawKey(bytes); try{ return new Uint8Array(await gcmDec(k, v.file)); }catch(e){} return new Uint8Array(await gcmDec(k, v.admin)); }
  async function reveal(v,cek){ var ck=await rawKey(cek); var frag=dec.decode(await gcmDec(ck, v.data)); content.innerHTML=frag; gate.classList.add('hidden'); try{sessionStorage.setItem('tvcek_'+section, b64(cek));}catch(e){} wire(); }

  async function attempt(){
    err.textContent='Déchiffrement…';
    try{
      var v=await getVault(), cek;
      if(keyBytes){ cek=await cekFromFile(v, keyBytes); }
      else if(pass.value){ cek=await cekFromPass(v, pass.value); }
      else { err.textContent='Entre une passphrase ou charge un fichier‑clé.'; return; }
      await reveal(v, cek); err.textContent='';
    }catch(e){ err.textContent='Clé incorrecte — réessaie.'; pass.select&&pass.select(); }
  }
  go.addEventListener('click', attempt);
  pass.addEventListener('keydown', function(e){ if(e.key==='Enter') attempt(); });

  // reprise de session (même onglet) sans redemander la clé
  (async function(){
    try{ var saved=sessionStorage.getItem('tvcek_'+section); if(saved){ var v=await getVault(); await reveal(v, ub64(saved)); return; } }catch(e){}
    pass.focus();
  })();

  // ---------- widgets après injection ----------
  function wire(){ lightbox(); music(); }
  function lightbox(){
    var figs=content.querySelectorAll('.art .art-view'); if(!figs.length) return;
    var lb=document.querySelector('.tv-lb');
    if(!lb){ lb=document.createElement('div'); lb.className='tv-lb'; lb.innerHTML='<button class="x" aria-label="Fermer">✕</button><img alt="">'; document.body.appendChild(lb);
      lb.querySelector('.x').onclick=function(){lb.classList.remove('on');lb.querySelector('img').src='';};
      lb.addEventListener('click',function(e){if(e.target===lb){lb.classList.remove('on');lb.querySelector('img').src='';}});
      document.addEventListener('keydown',function(e){if(e.key==='Escape'){lb.classList.remove('on');}}); }
    figs.forEach(function(b){ b.addEventListener('click',function(){ var img=b.querySelector('img'); lb.querySelector('img').src=img.src; lb.querySelector('img').alt=img.alt; lb.classList.add('on'); }); });
  }
  function music(){
    var pl=content.querySelector('#tvpl'); if(!pl) return;
    var srcsEl=content.querySelector('#tvsrcs'); var srcs=[]; try{ srcs=JSON.parse(srcsEl.textContent); }catch(e){}
    var audio=content.querySelector('#tvaudio'), pp=content.querySelector('#tvpp'), tt=content.querySelector('#tvtt'),
        list=content.querySelector('#tvlist'), items=content.querySelectorAll('#tvlist li'), i=0;
    function mark(){ items.forEach(function(li,k){ li.classList.toggle('active',k===i); }); }
    function load(idx,play){ i=(idx+srcs.length)%srcs.length; audio.src=srcs[i]||''; tt.textContent=(items[i]?items[i].textContent.replace(/^\d+/,'').trim():''); mark(); if(play) audio.play().catch(function(){}); }
    function setPlay(on){ pl.classList.toggle('playing',on); pp.textContent=on?'⏸':'▶'; }
    audio.addEventListener('play',function(){setPlay(true);}); audio.addEventListener('pause',function(){setPlay(false);});
    audio.addEventListener('ended',function(){ load(i+1,true); });
    pp.onclick=function(){ if(audio.paused) audio.play().catch(function(){}); else audio.pause(); };
    content.querySelector('#tvprev').onclick=function(){ load(i-1,true); };
    content.querySelector('#tvnext').onclick=function(){ load(i+1,true); };
    items.forEach(function(li,k){ li.style.cursor='pointer'; li.onclick=function(){ load(k,true); }; });
    load(0,false);
  }
})();
