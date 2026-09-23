/* TRUvector — service worker (PWA, phase 6).
   Stratégie « réseau d'abord » : on sert toujours la version fraîche quand
   c'est possible (pas de page figée), le cache ne sert qu'hors ligne.
   Les médias du CDN (MP3, .trubook) sont mis en cache après première lecture. */
var V='tv-v8-1';
var CORE=['./','index.html','assets/css/tokens.css?v=7','assets/css/fx.css?v=3','assets/js/fx.js?v=3','assets/js/render.js?v=1','assets/js/config.js?v=2','assets/js/nav.js?v=5','favicon.svg','404.html'];
self.addEventListener('install',function(e){ e.waitUntil(caches.open(V).then(function(c){ return c.addAll(CORE).catch(function(){}); })); self.skipWaiting(); });
self.addEventListener('activate',function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==V; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET') return;
  var u=new URL(r.url);
  var same=u.origin===location.origin, cdn=u.hostname==='cdn.jsdelivr.net'&&/\/(ebooks|galerie)\//.test(u.pathname);
  if(!same&&!cdn) return;                       /* on ne touche à rien d'autre */
  if(r.headers.has('range')) return;            /* lecture audio en streaming : laisser le navigateur */
  if(cdn){                                      /* médias figés : cache d'abord */
    e.respondWith(caches.open(V).then(function(c){ return c.match(r).then(function(hit){ return hit||fetch(r).then(function(res){ if(res.ok) c.put(r,res.clone()); return res; }); }); }));
    return;
  }
  e.respondWith(fetch(r).then(function(res){ if(res.ok&&res.type==='basic'){ var cp=res.clone(); caches.open(V).then(function(c){ c.put(r,cp); }); } return res; })
    .catch(function(){ return caches.match(r).then(function(hit){ return hit||(r.mode==='navigate'?caches.match('404.html'):Response.error()); }); }));
});
