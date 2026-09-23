#!/usr/bin/env node
/* TRUvector — construit chatbot-index.json : la « mémoire » de l'assistant.
   Découpe articles, fiches logiciels, modules, e-books et FAQ en passages courts.
   Usage : node tools/index-chatbot.mjs      (depuis la racine du site)
   Le cockpit sait aussi le reconstruire (rubrique 🤖 Assistant). */
import fs from 'node:fs';
const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const C = cfg.catalog || {}, vis = a => (a || []).filter(x => x && x.visible !== false);
const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, '’').replace(/&[a-z]+;/g, ' ');
const text = h => decode(h.replace(/<(script|style|pre)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const chunks = [];
function push(t, u, k, x) {
  x = x.replace(/\s+/g, ' ').trim(); if (x.length < 40) return;
  while (x.length > 900) { let cut = x.lastIndexOf('. ', 850); if (cut < 400) cut = 850; chunks.push({ t, u, k, x: x.slice(0, cut + 1).trim() }); x = x.slice(cut + 1).trim(); }
  chunks.push({ t, u, k, x });
}
for (const a of vis(C.articles)) {
  const f = 'articles/' + a.url; if (!fs.existsSync(f)) continue;
  const h = fs.readFileSync(f, 'utf8'), m = h.match(/<article[^>]*class="article"[^>]*>([\s\S]*?)<\/article>/i) || h.match(/<main[\s\S]*?<\/main>/i);
  const body = m ? m[1] || m[0] : h;
  push(a.title, 'articles/' + a.url, 'article', a.title + '. ' + (a.excerpt || '') + ' Tags : ' + (a.tags || []).join(', '));
  body.split(/<h2[^>]*>/i).slice(1).forEach(sec => { const [ti, ...rest] = sec.split(/<\/h2>/i); push(a.title + ' — ' + text(ti), 'articles/' + a.url, 'article', text(rest.join(' '))); });
}
for (const p of vis(C.logiciels)) push(p.title, 'logiciels/fiche.html?p=' + p.slug, 'logiciel', `${p.title} (${p.badge}). ${p.lead || p.desc}. Points clés : ${(p.features || []).join(' ; ')}.`);
for (const m of vis(C.modules)) push(m.title, 'modules/' + m.url, 'module', `Module interactif ${m.title} (${m.badge}) : ${m.desc}`);
const eb = cfg.ebooks || {};
for (const b of vis(C.ebooks)) push(b.title, 'ebooks/', 'e-book', `E-book « ${b.title} », genre ${b.genre} : ${b.blurb} Lisible avec la clé ${eb.passphrase || 'truvector'} jusqu'au ${b.until || eb.until}.`);
for (const f of vis((cfg.chatbot || {}).faq)) push(f.q, f.url || '', 'faq', `${f.q} ${(f.variants || []).join(' ')} — ${f.a}`);
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/-/g, '');
const df = {};
for (const c of chunks) new Set(norm(c.t + ' ' + c.x).split(/[^a-z0-9]+/).filter(w => w.length > 2)).forEach(w => df[w] = (df[w] || 0) + 1);
for (const w of Object.keys(df)) if (df[w] < 2) delete df[w];
fs.writeFileSync('chatbot-index.json', JSON.stringify({ v: 1, built: new Date().toISOString(), chunks, df }));
console.log(`chatbot-index.json : ${chunks.length} passages, ${(fs.statSync('chatbot-index.json').size / 1024).toFixed(0)} Ko`);
