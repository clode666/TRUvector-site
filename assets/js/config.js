/* TRUvector — configuration partagée
   Ordre de priorité : DEFAULTS < config.json (committé) < localStorage (aperçu admin) */
window.TV = (function(){
  var DEFAULTS = {
    version: 4,
    status: "auto",                                  // "soon" | "open" | "auto"
    launchDate: "2026-09-21T00:00:00+02:00",
    access: { method: "soft", code: "truvector2026", adminCode: "truvector-admin",
              users: [ { email: "tristan@truvector.dev", role: "admin" } ] },
    theme: { accent: "#34f5c5" },
    license: "Usage personnel et non commercial, avec mention de TRUvector.dev.",
    gallery: [
      { slug:"banner-grand-opening", title:"Grand Opening", format:"wide", visible:true, download:true },
      { slug:"arbre-monde", title:"Sous l'arbre-monde", format:"wide", visible:true, download:true },
      { slug:"deux-tasses", title:"Deux tasses sous l'aurore", format:"wide", visible:true, download:true },
      { slug:"coeur-aurore", title:"Cœur d'aurore", format:"square", visible:true, download:true },
      { slug:"atelier-etoiles", title:"L'atelier des étoiles", format:"square", visible:true, download:true },
      { slug:"portrait-matriciel", title:"Portrait matriciel", format:"square", visible:true, download:true }
    ]
  };
  var LS_KEY = "tv_config";
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function isObj(x){ return x && typeof x==="object" && !Array.isArray(x); }
  function merge(a,b){ // arrays remplacent, objets fusionnent
    if(!isObj(a)||!isObj(b)) return b===undefined?a:b;
    var out=clone(a);
    for(var k in b){ out[k] = isObj(a[k])&&isObj(b[k]) ? merge(a[k],b[k]) : clone(b[k]); }
    return out;
  }
  function readLocal(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||"null"); }catch(e){ return null; } }
  function saveLocal(cfg){ try{ localStorage.setItem(LS_KEY, JSON.stringify(cfg)); return true; }catch(e){ return false; } }
  function clearLocal(){ try{ localStorage.removeItem(LS_KEY); }catch(e){} }
  async function load(prefix){
    prefix = prefix||"";
    var cfg = clone(DEFAULTS);
    try{
      var r = await fetch(prefix+"config.json", {cache:"no-store"});
      if(r.ok){ cfg = merge(cfg, await r.json()); }
    }catch(e){ /* file:// ou hors-ligne → on garde les defaults */ }
    var local = readLocal();
    if(local){ cfg = merge(cfg, local); }
    return cfg;
  }
  return { DEFAULTS:DEFAULTS, load:load, merge:merge, clone:clone,
           readLocal:readLocal, saveLocal:saveLocal, clearLocal:clearLocal };
})();
