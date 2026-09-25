# TRUvector.dev — v10.1

Site statique **romantico·geek** de TRUvector : logiciels, e-books, musique, articles, modules interactifs et créations graphiques.
Hébergé sur **Cloudflare Pages** depuis ce dépôt GitHub ; médias lourds servis par le dépôt `clode666/truvector-assets` via jsDelivr.

> 📘 Documentation complète : **`manuel.html`** (ouvre-le dans un navigateur). Ce README en est le résumé.

---

## 1. Le principe

Tout le contenu et tous les réglages vivent dans **`config.json`**.
Les pages se construisent à partir de ce fichier à chaque chargement (`assets/js/render.js`).
On modifie `config.json` depuis le **cockpit** `/admin` — sans toucher au code.

```
Cockpit /admin  ──►  config.json  ──►  GitHub  ──►  Cloudflare Pages  ──►  truvector.dev
   (modifier)        (source unique)    (commit)      (redéploie 1–2 min)
```

Le HTML des pages reste en place comme **filet de secours** : si `config.json` est inaccessible, le site s'affiche quand même.

## 2. Modifier le site : le cockpit

1. Ouvre **`https://truvector.dev/admin/`** (code : `access.adminCode` dans config.json).
2. Modifie une rubrique (brouillon sauvegardé automatiquement dans le navigateur).
3. **👁 Aperçu sur le site** (`Ctrl+S`) : le site s'affiche avec tes changements, *dans ce navigateur seulement* (pastille orange).
4. **🚀 Publier** : config.json est envoyé sur GitHub avec ton jeton → Cloudflare redéploie.
   Sans jeton : **⬇ Exporter**, remplace `config.json` à la racine, committe.

**Rubriques :** Tableau de bord · Diagnostic · Publication · Accueil · Annonce · Navigation · Logiciels & fiches · Modules · Musique · E-books · Articles · Galerie · Concours · Soutenir · Apparence & effets · Site · Accès · JSON brut.

**Jeton GitHub** (pour publier en un clic) : github.com → Settings → Developer settings → *Fine-grained tokens* → accès à **ce seul dépôt**, permission **Contents : Read and write**, avec expiration. Il n'est jamais écrit dans config.json.

**Diagnostic** : vérifie doublons, champs manquants et la présence réelle de chaque MP3, e-book, couverture, image, module et article.

## 3. Ce qui ne passe pas par le cockpit (volontairement)

| Quoi | Où |
|---|---|
| Texte d'un article | `articles/posts/<nom>.html` (le cockpit gère titre, résumé, tags, date, visibilité) |
| Pages légales | `mentions-legales/`, `cgv/`, `confidentialite/`, `cookies/`, `securite/` |
| MP3 | `truvector-assets/musique/` |
| E-books chiffrés + couvertures | `truvector-assets/ebooks/<slug>.trubook`, `ebooks/covers/<slug>.svg` — chiffrement : `ebooks/proteger.html` |
| Images de la galerie | `truvector-assets/galerie/<slug>.webp` + `.png` — formats : `wide` (large), `square` (carré), `tall` (portrait) |
| Applis des modules | `modules/apps/<nom>.html` |

⚠ La **date de verrouillage des e-books** est inscrite *dans* chaque `.trubook`. Le cockpit règle la date affichée ; pour prolonger réellement, re-chiffre les livres.

## 4. Arborescence

```
/
├── index.html · 404.html · manuel.html · roadmap-effets.html · roadmap-chatbot.html · roadmap-modules.html
├── config.json            ★ source unique du contenu et des réglages
├── admin/                 cockpit
├── galerie/ logiciels/ (+ fiche.html) ebooks/ (+ lecteur, proteger) musique/
├── articles/ (+ posts/) modules/ (+ apps/) concours/ dons/ pages légales
├── assets/
│   ├── css/tokens.css     design tokens (couleurs, rayons, espacements, mouvements)
│   ├── css/fx.css         effets + composants rendus
│   ├── js/render.js       construit les pages depuis config.json (window.TVReady)
│   ├── js/config.js       lecture config + aperçu local du cockpit
│   ├── js/fx.js + fx/     effets (MINIFIÉS — ne pas éditer)
│   ├── js/src/            ★ sources lisibles des effets
│   ├── js/player.js       mini-lecteur global · filters.js · tru-reader.js · nav.js
├── worker/index.js       API : assistant, boîte à outils, page 404
├── chatbot-index.json    mémoire de l'assistant
├── tools/build-fx.sh      minifie assets/js/src → assets/js (Node.js)
├── tools/index-chatbot.mjs  reconstruit chatbot-index.json
├── sw.js · manifest.webmanifest   site installable / hors ligne
└── _headers · _redirects  sécurité (CSP), cache, redirections Cloudflare
```

## 5. Effets visuels

Aurore WebGL, étoiles en parallaxe, constellation, cartes 3D, palette `Ctrl+K`, visualiseur audio, galerie morphing, code Konami…
Trois niveaux automatiques (complet / léger / désactivé) selon l'appareil ; réglables dans le cockpit (**Apparence & effets**) et par chaque visiteur (`Ctrl+K`).

**Modifier un effet :** édite `assets/js/src/…` → `bash tools/build-fx.sh` → +1 sur `fx.js?v=` dans les pages.
Budget : noyau 14 Ko minifié (~6 Ko transférés) + un module par page.

## 6. Cache et versions

JS/CSS : cache 5 min + revalidation. Images et bibliothèques : 1 an.
**Règle : un fichier JS/CSS modifié → +1 sur son `?v=` dans toutes les pages.**

```bash
grep -rl "player.js?v=6" --include=*.html . | xargs sed -i 's/player\.js?v=6/player.js?v=7/g'
```

Versions en vigueur : `tokens.css?v=8` `fx.css?v=7` `fx.js?v=7` `render.js?v=3` `config.js?v=2` `player.js?v=6` `filters.js?v=5` `tru-reader.js?v=3` `nav.js?v=5` `assets.js?v=2`.
Si tu modifies `sw.js`, change sa constante `V`.

## 7. L'assistant « TRU » (chatbot)

Bulle 💬 sur tout le site, réglée dans le cockpit (**🤖 Assistant**).
- **Mode local** (défaut, 0 €) : FAQ + `chatbot-index.json` (472 passages du site), tout dans le navigateur.
- **Mode IA** : `worker/index.js` → **Cloudflare Workers AI** (quota quotidien gratuit ; sur le compte gratuit, un dépassement échoue sans facture) → réponse en continu avec sources ; repli automatique en mode local.
- Garde-fous : Turnstile, limites par visiteur (IP anonymisée), consigne verrouillée, aucune conversation enregistrée.
- Mise en service de l'IA : manuel, section 21 (≈ 15 min : déployer, Turnstile, KV, secrets, passer le mode sur « IA »).
- Après un nouvel article : cockpit → « 🧠 Reconstruire l'index » → « 🚀 Publier l'index » (ou `node tools/index-chatbot.mjs`).

> Hébergement : **Cloudflare Workers + Static Assets**. Le Worker ne répond qu'à `/api/*` et aux pages introuvables ; `.assetsignore` empêche de publier `worker/`, `tools/`, `wrangler.toml`.

## 8. Boîte à outils (16 modules)

Réseau (IP Analyzer, sous-réseaux, DNS Explorer, audit d'en-têtes, certificats, débit), e-mail (adresse, en-têtes), comptes (mot de passe + fuites par k-anonymat, 2FA, JWT, empreinte du navigateur, registre des fuites), utilitaires (horodatages, QR codes, contraste).
- Kit commun `modules/apps/_kit/` ; routes Worker `/api/tools/*` (cache, limites, anti-SSRF, aucun journal) ; aucun domaine tiers dans la CSP.
- Cockpit → Modules : interrupteur « Outils serveur » + limite horaire. Accueil : « Widget Ton IP » (facultatif).
- Ctrl+K : `ip`, `dns exemple.fr`, `mail nom@domaine.fr`, `cert …`, `entetes …`, `mdp`, `qr`, `date …`, `jwt`, `2fa`, `debit`, `subnet …`.
- Page Modules en deux sections (🧰 Boîte à outils / 🎮 Loisirs & création) ; historique des recherches facultatif (désactivé par défaut) ; outils locaux disponibles hors ligne.
- Détails : manuel, section 22.

## 9. Dépannage express

| Symptôme | Solution |
|---|---|
| Modifs du cockpit invisibles | Publié ? Redéploiement fini (1–2 min) ? Ctrl+F5. |
| Pastille orange « Aperçu admin » | Aperçu local actif → « Quitter l'aperçu ». |
| Publication 401 / 403 / 409 | Jeton invalide / sans droit *Contents* / fichier changé en ligne (recharge puis republie). |
| E-book « pas encore en ligne » | Le `.trubook` manque dans truvector-assets (voir Diagnostic). |
| Pas d'aurore | Mode léger automatique → Ctrl+K « Effets : complets ». |
| Assistant bloqué en « mode local » | Repli auto (quota/limite/Worker absent) → cockpit « 🩺 Tester le serveur ». |
| Outil « serveur indisponible » | Worker non déployé ou outils coupés (cockpit → Modules). |
| Un cercle suit le curseur | Halo voulu ; cockpit → Apparence & effets → « Halo du curseur ». |
| `fx.js` cassé après édition | Il est généré : modifie `assets/js/src/` puis lance le build. |

Tout le reste : **`manuel.html`**, sections 10 (dépannage), 16 (cache), 18 (effets), 19 (cockpit), 20 (référence config.json).

---
© 2026 TRUvector.dev — Tristan Ruard
