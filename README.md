# Manuel du site — TRUvector.dev v4

Site statique **romantico · geek**, hébergé sur **Cloudflare Pages**, piloté par un fichier `config.json` et un **panneau d'administration**.
Contenu · installation · déploiement · authentification · configuration · administration · maintenance · dépannage.

## Sommaire
1. [Vue d'ensemble](#1-vue-densemble)
2. [Contenu du site](#2-contenu-du-site)
3. [Arborescence des fichiers](#3-arborescence-des-fichiers)
4. [Charte & design system](#4-charte--design-system)
5. [Installation & déploiement](#5-installation--déploiement)
6. [Authentification](#6-authentification)
7. [Compte à rebours](#7-compte-à-rebours)
8. [Maintenance & évolutions](#8-maintenance--évolutions)
9. [Aspects légaux](#9-aspects-légaux)
10. [Dépannage](#10-dépannage)
11. [Référence rapide](#11-référence-rapide)
12. [Configuration (config.json)](#12-configuration-configjson)
13. [Panneau d'administration](#13-panneau-dadministration)

---

## 1. Vue d'ensemble

TRUvector.dev v4 est un **site statique** (HTML / CSS / JS, sans build ni serveur) au design **romantico·geek** : triskèle néon, aurores boréales, guirlandes ambrées sur fond nuit.

Tout le comportement éditable (statut, date d'ouverture, accès, droits, galerie, licence, couleur) est centralisé dans **`config.json`**, modifiable à la main ou via le **panneau d'administration** (`/admin`). Objectifs :

- présenter la marque avec un **compte à rebours** jusqu'à l'ouverture (21/09/2026) ;
- diffuser des **créations graphiques en libre téléchargement** ;
- offrir un **accès simple par authentification** ;
- **gérer paramètres et droits** depuis un panneau d'admin ;
- afficher des **mentions légales** conformes.

> ✅ **Aucune dépendance à installer.** Ouvre chaque page dans un navigateur, ou pousse le tout sur GitHub pour un déploiement automatique.

---

## 2. Contenu du site

### Accueil — `index.html` (public)
- Héros : triskèle animé, logo néon, baseline *« Where Code Meets Creativity »*.
- **Compte à rebours** vers la date d'ouverture, piloté par `config.json`.
- **Porte de lancement** : le bouton « Entrer dans la galerie » apparaît automatiquement au jour J (statut `auto`), ou tout de suite en statut `open`.
- **Vitrine des sections** : grandes cartes vers les 8 espaces (Galerie, Logiciels, E-books, Musique, Articles, Modules, Concours, Soutenir), bande « points forts » romantico·geek, section créateur et bandeau final, avec apparitions au scroll.

### Galerie — `galerie/index.html` (protégée)
- **Porte d'accès** (code) au chargement — voir §6.
- Grille responsive de **créations**, chacune en `.webp` (affichage) et `.png` HD (téléchargement).
- **Visionneuse** plein écran (clic, fermeture ✕ / `Échap`).
- Titres, ordre, visibilité, téléchargement et licence sont **pilotés par la config**.

### Pôle légal & conformité
Quatre pages complètes, renseignées avec l'identité réelle et reliées entre elles (et depuis le pied de page) :
- `mentions-legales/` — éditeur, directeur de publication, hébergeur, propriété intellectuelle.
- `cgv/` — conditions générales de vente / d'utilisation (vente = licence d'œuvre, pas prestation de service).
- `confidentialite/` — politique de confidentialité (RGPD).
- `cookies/` — politique de cookies (strictement nécessaires uniquement).
- `securite/` — politique de sécurité (SSI) + divulgation responsable, avec `/.well-known/security.txt`.

### Sections thématiques (accès par code, un par page)
Accessibles depuis le **menu déroulant « Sections »** (en haut à droite, sur toutes les pages), organisé en sous-menus *Créations* et *Communauté*. Chacune a **son propre code** (dans `config.access.sections`) :
- `logiciels/` — catalogue de logiciels (pré-rempli, éditable dans `config.catalog.logiciels`).
- `ebooks/` — e-books et publications.
- `musique/` — **lecteur audio** ; fichiers dans `musique/assets/`, déclarés dans `config.catalog.musique`. La case **« lecture en fond (tout le site) »** fait suivre la musique sur **toutes les pages** via un mini-lecteur en bas à droite (léger blanc au changement de page ; un clic sur ▶ peut être nécessaire après la 1re navigation, à cause de l'autoplay des navigateurs). **Deux morceaux de démo** sont inclus : ouvre la page Musique et presse ▶ pour voir le lecteur ; remplace-les dans `musique/assets/` + `config.catalog.musique`.
- `articles/` — notes et tutoriels.
- `dons/` — page de soutien (liens configurables dans `config.dons.links`).
- `concours/` — jeux-concours (`config.concours`).
- `modules/` — modules interactifs (`config.catalog.modules`).

### Administration — `admin/index.html`
Panneau qui édite `config.json` : paramètres, accès, droits, galerie, licence. Voir §13.

### Roadmap — `roadmap.html` (bonus)
La feuille de route v4, autonome.

---

## 3. Arborescence des fichiers

```
truvector.dev/
├── index.html                 # accueil : teaser + compte à rebours (public)
├── galerie/
│   ├── index.html             # galerie + porte d'accès + téléchargements
│   └── assets/                # créas : .webp (affichage) + .png HD (download)
├── mentions-legales/
│   └── index.html             # mentions légales (identité, hébergeur, PI)
├── cgv/
│   └── index.html             # conditions générales de vente / d'utilisation
├── confidentialite/
│   └── index.html             # politique de confidentialité (RGPD)
├── cookies/
│   └── index.html             # politique de cookies
├── securite/
│   └── index.html             # politique de sécurité (SSI)
├── logiciels/ ebooks/ musique/ articles/ dons/ concours/ modules/
│   └── index.html × 7         # 7 sections, chacune un code d'accès distinct
│       └── (musique/assets/)  # y déposer les fichiers audio (.mp3, .ogg…)
├── admin/
│   └── index.html             # panneau d'administration (paramètres + droits)
├── assets/
│   ├── css/tokens.css         # design system : couleurs, typo, composants
│   ├── js/config.js           # configuration partagée (defaults + fusion)
│   ├── js/gate.js             # portail d'accès générique (codes par section)
│   ├── js/player.js           # mini-lecteur global (musique sur tout le site)
│   ├── js/nav.js              # menu déroulant "Sections" (toutes les pages)
│   ├── js/countdown.js        # compte à rebours (piloté par la config)
│   └── img/                   # triskele.svg, createur.webp, og-banner.*
├── config.json                # ★ source de vérité : paramètres, droits, galerie
├── favicon.svg                # triskèle néon
├── roadmap.html               # feuille de route (bonus)
├── _headers                   # sécurité + cache (Cloudflare Pages)
├── _redirects                 # redirections optionnelles
├── wrangler.toml              # déploiement Cloudflare statique (sans build)
├── .well-known/security.txt   # contact sécurité (RFC 9116)
├── robots.txt · sitemap.xml
└── README.md
```

> **Chemins relatifs.** Les pages en sous-dossier (galerie, mentions, admin) remontent d'un cran avec `../` pour atteindre `assets/` et `config.json`.

---

## 4. Charte & design system

Tout est centralisé dans `assets/css/tokens.css` (variables CSS). La couleur d'accent est aussi surchargée par `config.json` / le panneau d'admin.

| Rôle | Variable | Hex |
|---|---|---|
| Menthe néon (signature) | `--menthe` | `#34F5C5` |
| Aurore violette | `--aurore-v` | `#B14AED` |
| Aurore verte | `--aurore-g` | `#59E39A` |
| Ambre (guirlandes) | `--ambre` | `#F4C56B` |
| Nuit (fond) | `--nuit-2` | `#0B121A` |
| Texte clair | `--texte` | `#E8F2EE` |

**Typographie :** `Space Grotesk` (titres & texte) + `JetBrains Mono` (accents « terminal »).
**Composants :** navigation, boutons néon (`.btn`, `.btn-ghost`), cartes « verre » (`.card`), fond aurore (`.aurora`) + guirlandes (`.lights`), pied de page.

---

## 5. Installation & déploiement

### Prérequis
- Un compte **GitHub** (`clode666`).
- Un compte **Cloudflare** avec le domaine `truvector.dev`.
- `git` (facultatif : l'interface web GitHub marche aussi).

### Étape 1 — Pousser sur GitHub
Place **le contenu du dossier `truvector.dev/` à la racine** d'un nouveau dépôt.

```bash
git init
git add .
git commit -m "TRUvector.dev v4"
git branch -M main
git remote add origin https://github.com/clode666/truvector-dev.git
git push -u origin main
```

### Étape 2 — Cloudflare Pages
1. **Workers & Pages → Create → Pages → Connect to Git**.
2. Sélectionne `truvector-dev`.
3. **Framework preset :** `None` · **Build command :** *(VIDE)* · **Output directory :** `/`.
4. **Save and Deploy**.

> ⚠️ **Le site n'a AUCUN build.** Si Cloudflare essaie de lancer `npx hugo` (ou tout autre build) et échoue, c'est une auto-détection erronée. Deux correctifs :
> - **Voie Pages (recommandée)** : preset `None` + **Build command vide** → Cloudflare se contente de servir les fichiers.
> - **Voie Workers (`npx wrangler deploy`)** : le fichier **`wrangler.toml`** fourni (à la racine du dépôt) désactive l'auto-détection et sert le dossier tel quel. Assure-toi juste que le **contenu** de `truvector.dev/` est bien à la **racine** du dépôt (le `index.html` et le `wrangler.toml` tout en haut), pas dans un sous-dossier.

### Étape 3 — Domaine
1. Projet Pages → **Custom domains → Set up a custom domain**.
2. `truvector.dev` (+ `www`). DNS + HTTPS automatiques.

> ✅ Chaque `git push` sur `main` redéploie le site.

---

## 6. Authentification

Deux niveaux : la **vraie sécurité** (Cloudflare Access) et une **porte JS légère** fournie prête à l'emploi.

### Option A — Cloudflare Access (recommandé)
Gratuit ≤ 50 utilisateurs, sans code, connexion par code e-mail à usage unique ou Google.

1. **Zero Trust → Access → Applications → Add → Self-hosted**.
2. Domaine `truvector.dev` · Chemins `/galerie` **et** `/admin`.
3. Policy *Allow* → règle « Emails » (liste exportable depuis le panneau d'admin) ou « One-time PIN ».

> ✅ Avec Access, tu peux retirer les portes JS.

### Option B — Portes d'accès légères (incluses)
Codes définis dans `config.json` (ou via le panneau d'admin) :
- `access.code` → porte de la **galerie** (défaut `truvector2026`) ;
- `access.adminCode` → porte de l'**admin** (défaut `truvector-admin`).
- `access.sections.<nom>` → un code par section (logiciels, ebooks, musique, articles, dons, concours, modules), éditables dans le panneau d'admin (bloc « Sections & codes »).

> ⚠️ Le code est visible dans la source : filtre « doux », pas une sécurité réelle. Pour du sérieux → option A.

### Protéger aussi l'admin
`/admin` a sa propre porte. Protège **/admin** et **/galerie** avec Cloudflare Access ; les **rôles** (admin / éditeur / lecteur) définis dans le panneau se transposent en règles Access.

### Retirer une porte JS (si tu passes sur Access)
Supprime le bloc `<div class="gate" …>…</div>` et son script dans `galerie/index.html` et/ou `admin/index.html`.

---

## 7. Compte à rebours

La date d'ouverture et le statut sont dans **`config.json`** (modifiables depuis l'admin). `assets/js/countdown.js` les lit ; une valeur de repli identique reste dans `assets/js/config.js`.

```json
"status": "auto",          // "soon" (bientôt) | "open" (ouvert) | "auto" (par date)
"launchDate": "2026-09-21T00:00:00+02:00"
```

- `+02:00` = heure de Paris (CEST).
- **auto** : décompte, puis ouverture automatique au jour J (le bouton « Entrer » apparaît).
- **soon** : décompte figé, jamais d'ouverture.
- **open** : accès immédiat.

---

## 8. Maintenance & évolutions

### Le plus simple : le panneau d'admin
Va sur `/admin` pour changer statut, date, codes, droits, galerie, licence et couleur — sans toucher au code. Puis **Exporter config.json** et committe-le. Voir §13.

### Ajouter une nouvelle créa
1. Dépose deux versions dans `galerie/assets/` : `mon-oeuvre.webp` (affichage) et `mon-oeuvre.png` (téléchargement HD).
2. Ajoute une entrée dans `config.json` (ou via l'admin) :

```json
{ "slug": "mon-oeuvre", "title": "Mon œuvre", "format": "square", "visible": true, "download": true }
```

3. (Si tu veux un rendu même sans JS) duplique aussi un bloc `<figure class="art">…</figure>` dans `galerie/index.html`. Le script applique ensuite titre/ordre/visibilité depuis la config.

### Générer les WebP (optimisation)
```bash
# WebP d'affichage, largeur max 1600px (ImageMagick)
magick mon-oeuvre.png -resize 1600x> -quality 82 mon-oeuvre.webp
```

### Modifier une page ou le style
- Texte / structure : le `index.html` concerné.
- Couleurs, espacements, composants : `assets/css/tokens.css`.

### Publier une mise à jour
```bash
git add .
git commit -m "maj : nouvelle créa + config"
git push
```
Cloudflare Pages redéploie automatiquement.

### Mesure d'audience (sans cookies)
**Cloudflare → Web Analytics → Add a site → `truvector.dev`**, puis colle le snippet avant `</body>`.

---

## 9. Aspects légaux

Le pôle légal est renseigné avec l'identité officielle (attestation INPI) :
- **Éditeur** : Ruard Tristan, entrepreneur individuel (artiste-auteur), nom commercial TRUvector.
- **Siège** : 18 E rue des Ovides, 42100 Saint-Étienne.
- **SIREN** 108 978 180 · **SIRET** 108 978 180 00017 · **APE** 9003B · RNE 21/08/2026.
- **Hébergeur** : Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, USA.
- **Pages** : mentions légales, **CGV/CGU**, confidentialité (RGPD), cookies, sécurité (SSI) + `security.txt`.
- **TVA** : *TVA non applicable, art. 293 B du CGI* (conforme à ta documentation).
- **Vente** = concession de **licence d'œuvre** (pas une prestation de service) — cadrage cohérent avec ton statut d'agent public.

> Boîtes e-mail à créer sur le domaine : `contact@truvector.dev` et `security@truvector.dev`.

---

## 10. Dépannage

| Symptôme | Cause probable & solution |
|---|---|
| Les polices ne s'affichent pas | Hors-ligne ou CSP. En ligne, `_headers` autorise `fonts.googleapis.com` / `fonts.gstatic.com`. Sinon, polices système (normal). |
| Images en 404 | Chemin cassé. Vérifie les `../` depuis `galerie/`, `mentions-legales/`, `admin/`, et la présence des fichiers dans `galerie/assets/`. |
| La porte d'accès ne s'ouvre pas | Code ≠ `access.code`. Vérifie `config.json` (ou /admin). Accès mémorisé le temps de la session. |
| Mes changements admin n'apparaissent pas pour les autres | « Aperçu » n'écrit que dans ton navigateur. Clique **Exporter config.json** puis committe le fichier. |
| `config.json` ignoré en local (file://) | Le `fetch` échoue sur `file://` : teste via un serveur local ou sur Cloudflare Pages. Les défauts de `config.js` prennent le relais. |
| Le compte à rebours reste figé | JS bloqué ou date mal formée. Garde le format `2026-09-21T00:00:00+02:00`. |
| Le bouton « Entrer » n'apparaît pas | Normal avant le jour J en statut `auto` ; force-le avec `status: "open"`. |
| La musique ne repart pas en changeant de page | Politique d'autoplay du navigateur : clique une fois sur ▶ du mini-lecteur. Ensuite ça suit. |
| Build échoue sur `npx hugo` / *could not determine executable* | Cloudflare a mal deviné un framework (Hugo). Le site n'a pas de build : garde une **Build command vide** (Pages) ou committe le **`wrangler.toml`** fourni à la racine (Workers). |
| Cloudflare sert une vieille version | Cache. Nouveau commit ou purge du cache. |

---

## 11. Référence rapide

| Pour… | Fichier / réglage |
|---|---|
| Tout piloter sans coder | Panneau `/admin` |
| Éditer la config à la main | `config.json` (racine) |
| Changer la date / le statut | `config.json` → `launchDate` / `status` (ou /admin) |
| Changer le code d'accès galerie | `config.json` → `access.code` (ou /admin) |
| Changer le code admin | `config.json` → `access.adminCode` |
| Ajouter une créa | `galerie/assets/` + entrée `gallery` dans la config |
| Changer une couleur / la typo | `assets/css/tokens.css` (accent aussi via config) |
| Éditer les mentions légales | `mentions-legales/index.html` |
| Sécurité / cache | `_headers` |
| Déployer une mise à jour | `git push` (redéploiement auto) |
| Vraie authentification / droits | Cloudflare Zero Trust → Access → `/galerie`, `/admin` |
| Corriger un build qui lance Hugo | `wrangler.toml` (racine) + Build command vide |
| Changer le code d'une section | `config.json` → `access.sections.<nom>` (ou /admin) |
| Ajouter un logiciel / e-book / module | `config.catalog.<nom>` (tableau d'items) |
| Ajouter un morceau de musique | fichier dans `musique/assets/` + entrée `config.catalog.musique` |
| Activer / trouver le player | page **Musique** → bouton ▶ (le lecteur n'apparaît que s'il y a des morceaux) |
| Musique sur tout le site | page Musique → cocher « lecture en fond (tout le site) » |
| Configurer les dons | `config.dons.links` (label + url) |

---

## 12. Configuration (config.json)

`config.json`, à la racine, est la **source de vérité unique** : statut, date, accès, droits, licence, couleur, galerie. Les pages le lisent au chargement.

```json
{
  "status": "auto",
  "launchDate": "2026-09-21T00:00:00+02:00",
  "access": {
    "method": "soft",             // "soft" | "cloudflare-access"
    "code": "truvector2026",       // porte galerie
    "adminCode": "truvector-admin",// porte admin
    "users": [ { "email": "tristan@truvector.dev", "role": "admin" } ]
  },
  "theme": { "accent": "#34f5c5" },
  "license": "…",
  "gallery": [
    { "slug": "coeur-aurore", "title": "Cœur d'aurore",
      "format": "square", "visible": true, "download": true }
  ]
}
```

**Priorité de lecture :** défauts (`assets/js/config.js`) < `config.json` (committé) < aperçu local (localStorage de l'admin).

> ✅ **Le site marche même sans `config.json`.** Les défauts sont dans `config.js` : ouvert en local, `config.json` prend le relais en ligne.

---

## 13. Panneau d'administration

Accessible sur `/admin`, il édite `config.json` sans toucher au code.

### Ce qu'on y règle
- **Paramètres** : statut (bientôt / ouvert / auto), date d'ouverture, couleur d'accent.
- **Accès** : méthode (Cloudflare Access ou porte JS), code galerie, code admin.
- **Droits** : utilisateurs + rôles (admin / éditeur / lecteur).
- **Galerie** : titre, format, visibilité, téléchargement, ordre.
- **Licence** : texte affiché sous la galerie.

### Le flux de travail
1. **Aperçu (local)** — enregistre dans ton navigateur pour voir le rendu tout de suite.
2. **Exporter config.json** — télécharge le fichier ; remplace celui du dépôt et committe pour l'appliquer à tous.
3. **Emails (Access)** — exporte la liste d'e-mails à coller dans une policy Cloudflare Access.
4. **Réinitialiser l'aperçu** — efface l'aperçu local et recharge `config.json`.

> ⚠️ **Sécurité.** La porte du panneau est un verrou léger (code visible dans la source). Pour une vraie protection, place **/admin** derrière **Cloudflare Access**. Les droits sont appliqués *à la porte* par Access, pas par le JavaScript.

---

© 2026 TRUvector.dev · Manuel du site v4 · *Where Code Meets Creativity* 🌌
