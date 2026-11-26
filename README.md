# 54CUTZ — refonte site (proposition)

Site vitrine moderne pour le barbershop **54cutz** (Perwez). Une page, full responsive,
animations au scroll, design noir/or éditorial.

## Lancer en local
```bash
cd site-54cutz
npx wrangler dev
# ouvrir http://localhost:8787
```
Sert le site comme Cloudflare (adresses sans .html, redirections 301, page 404). Live Server et `python3 -m http.server` ne gèrent pas `/mentions-legales`.

## Mise en ligne (Cloudflare)
- Projet Cloudflare `54cutz-site` (Workers, fichiers statiques) — config dans `wrangler.jsonc`, fichiers exclus dans `.assetsignore`, redirections 301 dans `_redirects`, page `404.html`.
- Publication depuis le Mac : `npx wrangler deploy` (le push GitHub sert seulement d'historique, il ne publie rien).
- Domaine `54cutz.be` : ajouté à Cloudflare (serveurs de noms changés chez le registrar), puis rattaché au Worker (Domaines personnalisés : `54cutz.be` + `www.54cutz.be`).
- GitHub Pages désactivé (26/11/2026) : le site n'est servi que par Cloudflare.
- Test local : `npx wrangler dev`.

## Identité visuelle
- **Palette dérivée du logo + de l'enseigne néon** du salon : base noir/blanc monochrome
  (logo brushstroke blanc) + accent dégradé néon **magenta → bleu** (échantillonné sur
  l'enseigne "54CUTZ" de la devanture). Variables CSS : `--magenta`, `--blue`, `--neon`.
- **Logo** (`assets/logo.png`) utilisé dans le loader, la nav, le footer + favicon.

## Stack
- HTML / CSS / JS purs — zéro build, hébergé sur Cloudflare.
- [GSAP + ScrollTrigger](https://gsap.com) hébergés dans `assets/js/` → parallaxe + révélation de texte.
- Polices (Anton, Bebas Neue, Inter, Fraunces) hébergées dans `assets/fonts/` : aucun appel à Google Fonts.
- Animations natives : loader, curseur custom, marquee, compteurs, glow néon, reveal.
- Accessible : respecte `prefers-reduced-motion`.

## Fichiers
| Fichier | Rôle |
|---|---|
| `index.html` | Structure + contenu |
| `styles.css` | Design / responsive / animations CSS |
| `script.js`  | Loader, curseur, scroll reveal, parallaxe, compteurs |
| `assets/`    | Logo, favicon, photos + vidéo (repris de 54cutz.com) |

## Médias (repris du site actuel, optimisés pour le web)
- `assets/images/gallery14.jpg` — fond du hero (intérieur salon, ~1920px, 568 Ko).
- `assets/images/isma.jpg`, `wyatt.jpg` — portraits équipe.
- `assets/images/gallery1-14.jpg` — galerie (6, 3, 9, 12, 11 affichées). Redimensionnées (max 1800px).

## À remplacer / vérifier avant mise en ligne
- [x] **Tarifs** — prix réels intégrés : section services en « dès » (prix mini) + table **Tarifs par barber** (Ismaël & Wyatt / Raphaël / Bastien). ✔
- [x] **Lien Salonkee** — `https://salonkee.be/salon/54-cutz?lang=fr` (section `#book` + footer). ✔
- [ ] **Photos Raphaël & Bastien** — cartes équipe en placeholder néon (initiale R / B). Ajouter leurs portraits comme `assets/images/raphael.jpg` / `bastien.jpg` puis remplacer le bloc `.member--ph` dans `index.html`.
- [ ] **Handles réseaux** — vérifier `@54cutz_` (Insta/TikTok, aussi celui d'Ismaël), `@w9cutzz` (Wyatt), `@menjoucutz` (Raphaël), `@sneizycutz` (Bastien). Les handles de l'équipe sont maintenant cliquables.
- [ ] **Carte** — pré-réglée "Chau. de Charleroi 45, 1360 Perwez". Vérifier le pin.
- [ ] **Photos galerie** — sélection actuelle modifiable (13 dispo dans `assets/images/`).
- [x] Footer : mention "proposition de refonte" remplacée par les liens légaux. ✔
- [x] **Cloudflare** : Worker `54cutz-site` créé par `npx wrangler deploy` le 26/11/2026, en ligne sur https://54cutz-site.loic-web.workers.dev. GitHub Pages désactivé le même jour. ✔
- [ ] **Domaine** : 54cutz.be libre au 26/11/2026 (whois DNS Belgium). À acheter, ajouter à Cloudflare, puis rattacher au Worker (54cutz.be + www).
- [x] **Contrôles après publication** (workers.dev, 26/11/2026) : pages en 200, anciennes adresses `.html` en 301, 404 propre, `/README.md`, `/CLAUDE.md`, `/wrangler.jsonc`, `/.git/`, `/.claude/` en 404. ✔
- [ ] **Sur un vrai téléphone** (iPhone Safari) : bouton Réserver flottant et menu (testé seulement en simulation).

## Pages légales (Belgique)
- `mentions-legales.html` — éditeur, BCE/TVA, hébergeur, propriété intellectuelle, droit belge (Livre XII Code de droit économique).
- `politique-confidentialite.html` — RGPD : données, finalités, bases légales, sous-traitants (Salonkee/Cloudflare/Google Maps au clic), cookies, conservation, droits, réclamation APD.
- Liées dans le footer du site + entre elles. En `noindex` (volontairement hors sitemap).
- ⚠️ **Modèles** rédigés selon le droit belge/RGPD à partir des infos connues — à faire relire par un professionnel avant usage définitif.
- [ ] Vérifier le **nom légal exact** et la forme juridique (personne physique / société) auprès de la BCE.
- [x] Hébergeur des mentions légales et sous-traitants RGPD passés à Cloudflare. ✔

## SEO (domaine cible : 54cutz.be)
- **Données structurées** JSON-LD `HairSalon` : NAP, géo, horaires, 5 prestations + prix, 4 barbers, réseaux (`sameAs`), action de réservation Salonkee.
- **Méta** : title/description orientés local ("barbier Perwez"), balises `geo.*`/`ICBM`, Open Graph + Twitter Card, `canonical` → `https://54cutz.be/`.
- `sitemap.xml` (avec image) + `robots.txt`.
- NAP cohérent partout : **Salon 54cutz · Chaussée de Charleroi 45, 1360 Perwez · 54cutz@gmail.com**.
- Pas de note/avis dans le schema (Google pénalise les `aggregateRating` non vérifiables on-page) ni de téléphone (le salon ne répond pas aux appels → contact via réseaux/Salonkee).

### À faire côté Google (hors code)
- [ ] Pointer le domaine **54cutz.be** vers l'hébergement + activer HTTPS.
- [ ] Mettre l'URL `https://54cutz.be` sur la fiche **Google Business Profile** et les réseaux.
- [ ] Soumettre `https://54cutz.be/sitemap.xml` dans **Google Search Console**.
- [ ] Vérifier le rendu avec le test des résultats enrichis Google (Rich Results Test).

## Tarifs intégrés (selon Salonkee)
| Prestation | Ismaël & Wyatt | Raphaël | Bastien |
|---|---|---|---|
| Coupe | 30 € | 25 € | 25 € |
| Barbe | 20 € | 15 € | — |
| Coupe + Barbe | 40 € | 35 € | 35 € |
| Transformation | 40 € | — | — |
| Service V.I.P | 60 € | — | — |

## Contenu repris du site actuel
Nom, baseline, services (Coupe / Barbe / Coupe+Barbe / Transformation / V.I.P),
horaires, adresse, email, conditions d'annulation, TVA, bios Ismaël & Wyatt.

## Améliorations du 26/11/2026
- Images optimisées : logo 500 Ko → 40 Ko, photos utilisées environ 3 Mo → 1 Mo (mêmes noms de fichiers).
- Loader : retiré au plus tard après 2,5 s (avant, il attendait le chargement de toutes les images).
- Polices et GSAP hébergés sur le site ; image du hero préchargée.
- Carte Google Maps chargée au clic (RGPD) ; politique de confidentialité mise à jour.
- Bouton « Réserver » flottant sur mobile (après le hero, caché sur la section Réserver et quand le menu est ouvert).
- Handles de l'équipe cliquables ; Ismaël `@54cutz` corrigé en `@54cutz_`.
- Accessibilité : portraits et photos de la galerie décrits pour les lecteurs d'écran.
- JSON-LD : lien Planity retiré (fiche non réservable, avec un téléphone et des horaires différents du site).
- Page 404, `_redirects` (adresses sans .html), `wrangler.jsonc`, `.assetsignore`.
- Curseur personnalisé (ordinateur) : caché jusqu'au premier mouvement de souris (il apparaissait dans le coin haut-gauche).
- Testé avec `npx wrangler dev` dans Chromium et WebKit, à 375 px et 1280 px : loader, menu mobile, bouton Réserver flottant, carte au clic, pages légales, 404, redirection `/mentions-legales.html` → `/mentions-legales`. Les fichiers de travail (`README.md`, `CLAUDE.md`, `wrangler.jsonc`…) renvoient bien 404.

## À confirmer avec le client
- [ ] Hero : « Nous sommes Ismaël & Wyatt » alors que l'équipe compte 4 barbers. Garder, ou citer les 4 ?
- [ ] Bio de Wyatt : « depuis plus d'un an, j'ai 18 ans » (texte de l'ancien site) — encore exact ?
- [ ] Stat « 100 % sens du détail » : ce n'est pas un vrai chiffre. Garder ou remplacer (ex. années d'ouverture du salon) ?
- [ ] Fiche Planity : téléphone et horaires différents (lun–sam 9h–18h) → la mettre à jour ou la supprimer.
- [ ] Lien de la fiche Google (pour un bouton « Avis Google »).
- [ ] Domaine 54cutz.be : qui l'achète, à quel nom. Et 54cutz.com (agence Pixl) : qui détient le domaine ?
