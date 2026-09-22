/* TRUvector — tru-crypto.js
   Socle AES-256-GCM pour le format .trubook (e-books protégés).
   Même esprit que unlock.js : tout côté client, rien de lisible sans la clé.
   Une CEK aléatoire (256 bits) chiffre la charge (le fichier + la politique + l'acheteur).
   La CEK est elle-même emballée par une passphrase (PBKDF2) et/ou un fichier-clé .trukey. */
window.TRUcrypto = (function(){
  var subtle = window.crypto && window.crypto.subtle;
  var enc = new TextEncoder(), dec = new TextDecoder();

  function b64(u){ u=new Uint8Array(u); var s='',CH=0x8000; for(var i=0;i<u.length;i+=CH){ s+=String.fromCharCode.apply(null,u.subarray(i,i+CH)); } return btoa(s); }
  function ub64(s){ s=(s||'').replace(/\s+/g,''); var b=atob(s), u=new Uint8Array(b.length); for(var i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }
  function rnd(n){ var u=new Uint8Array(n); crypto.getRandomValues(u); return u; }

  function pbkdf2(pass, salt, iters){
    return subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']).then(function(km){
      return subtle.deriveKey({name:'PBKDF2', salt:salt, iterations:iters, hash:'SHA-256'}, km, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
    });
  }
  function rawKey(bytes, usages){ return subtle.importKey('raw', bytes, {name:'AES-GCM'}, false, usages||['encrypt','decrypt']); }
  function gcmEnc(key, bytes){ var iv=rnd(12); return subtle.encrypt({name:'AES-GCM', iv:iv}, key, bytes).then(function(ct){ return {iv:b64(iv), ct:b64(ct)}; }); }
  function gcmDec(key, o){ return subtle.decrypt({name:'AES-GCM', iv:ub64(o.iv)}, key, ub64(o.ct)).then(function(pt){ return new Uint8Array(pt); }); }

  function sha256hex(bytes){ return subtle.digest('SHA-256', bytes).then(function(h){ return Array.prototype.map.call(new Uint8Array(h), function(b){ return ('0'+b.toString(16)).slice(-2); }).join(''); }); }

  /* pack(opt) -> objet .trubook
     opt = { fileBytes:Uint8Array, format, name, policy, buyer, meta:{title,author,cover},
             passphrase?, keyfileBytes?:Uint8Array } */
  function pack(opt){
    var iters=210000, cek=rnd(32), cekKey;
    var out={ tru:'trubook-v1',
      title:(opt.meta&&opt.meta.title)||opt.name||'E-book',
      author:(opt.meta&&opt.meta.author)||'',
      cover:(opt.meta&&opt.meta.cover)||'',
      kdf:{iters:iters}, wrap:{} };
    return rawKey(cek,['encrypt']).then(function(k){ cekKey=k;
      var payloadObj={ format:opt.format, name:opt.name, policy:opt.policy||{}, buyer:opt.buyer||{}, data:b64(opt.fileBytes) };
      return gcmEnc(cekKey, enc.encode(JSON.stringify(payloadObj)));
    }).then(function(payload){ out.payload=payload;
      var chain=Promise.resolve();
      if(opt.passphrase){ var salt=rnd(16); out.salt=b64(salt);
        chain=chain.then(function(){ return pbkdf2(opt.passphrase, salt, iters); }).then(function(kek){ return gcmEnc(kek, cek); }).then(function(w){ out.wrap.pass=w; }); }
      if(opt.keyfileBytes){ chain=chain.then(function(){ return rawKey(opt.keyfileBytes,['encrypt']); }).then(function(kf){ return gcmEnc(kf, cek); }).then(function(w){ out.wrap.file=w; }); }
      return chain.then(function(){ return out; });
    });
  }

  function unlockCEK(book, cred){
    if(cred.keyfileBytes && book.wrap && book.wrap.file){ return rawKey(cred.keyfileBytes,['decrypt']).then(function(kf){ return gcmDec(kf, book.wrap.file); }); }
    if(cred.passphrase && book.wrap && book.wrap.pass){ return pbkdf2(cred.passphrase, ub64(book.salt), (book.kdf&&book.kdf.iters)||210000).then(function(kek){ return gcmDec(kek, book.wrap.pass); }); }
    return Promise.reject(new Error('no-cred'));
  }

  /* open(book, cred) -> { format, name, policy, buyer, bytes:Uint8Array } */
  function open(book, cred){
    return unlockCEK(book, cred).then(function(cek){
      return rawKey(cek,['decrypt']).then(function(cekKey){ return gcmDec(cekKey, book.payload); });
    }).then(function(pt){
      var obj=JSON.parse(dec.decode(pt)); obj.bytes=ub64(obj.data); delete obj.data; return obj;
    });
  }

  function newKeyfile(name){ var k=rnd(32); return { json:JSON.stringify({tru:'v5', name:name||'ebook-key', k:b64(k)}), bytes:k }; }
  function keyfileBytesFrom(text){ var t=(text||'').trim(), k; try{ var j=JSON.parse(t); k=j.k||j.key||t; }catch(e){ k=t; } return ub64(k); }

  return { b64:b64, ub64:ub64, rnd:rnd, sha256hex:sha256hex, pack:pack, open:open, unlockCEK:unlockCEK, newKeyfile:newKeyfile, keyfileBytesFrom:keyfileBytesFrom };
})();
