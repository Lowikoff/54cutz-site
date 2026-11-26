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
- [x] **Infos vérifiées sur Salonkee le 26/11/2026** : horaires, 4 barbers, prix par barber, politique d'annulation identiques au site. ✔ Durées (pas affichées sur le site) : Ismaël & Wyatt coupe 30 min, coupe + barbe 45 min, V.I.P 1 h, transformation 45 min (Ismaël : 45 min–1 h), barbe 15 min ; Raphaël coupe 45 min, coupe + barbe 1 h, barbe 30 min ; Bastien coupe 30 min, coupe + barbe 45 min.
- [x] **N° d'entreprise corrigé** (26/11/2026) : l'ancien n° BE 0803.277.289 (Ismaël Alaoui, personne physique) est arrêté depuis le 01/01/2026 (BCE). Nouveau : **54 CUTZ SRL, BE 1031.637.857** (Salonkee + BCE). Mis à jour dans le footer des 3 pages, les mentions légales, la politique de confidentialité et le JSON-LD (`legalName`, `vatID`). ✔
- [x] **Animations des images** (26/11/2026, refait) : parallaxe du hero et des photos de l'équipe remis, au tactile aussi, construit en couches : cadre fixe (`overflow: hidden`) → couche zoom (dézoom au survol, souris seulement) → image animée par GSAP (`yPercent -8 → 8`, `scrub`, aucune transition CSS sur son transform). Les marges sont calculées dans `styles.css` (image équipe 124 % du cadre, hero −20 % / −4 %) : aucun bord ne se découvre. Tous les survols du site sont sous `@media (hover: hover) and (pointer: fine)` (rien de collé au tactile, `.service` compris) ; boutons : `scale(.97)` au tap. Apparitions plus courtes au tactile (20 px, .6 s), `will-change` posé puis retiré. Testé en WebKit + Chromium, 375 px (tactile) et 1280 px (souris) : 35 arrêts sur toute la page, rien ne bouge après l'arrêt, la photo suit le scroll, marge minimale ≥ 10 px entre image et cadre à chaque pas de 50 px. ✔
- [x] **SEO sur la page** (26/11/2026) : title « Barber à Perwez, Brabant wallon | Barbier 54cutz » (48 car.), description 149 car., meta keywords retirée ; H1 « Barber à Perwez » (même visuel, mêmes animations) ; texte « Votre barbier à Perwez, en Brabant wallon » sous le statement ; FAQ (5 questions) + JSON-LD `FAQPage` ; photos du hero, de l'équipe et de la galerie en `<img>` avec width/height, alt décrivant la photo, `loading="lazy"` sauf le hero. Sur téléphone en portrait, le hero charge `gallery14-portrait.webp` (recadrage central, 56 Ko au lieu de 265 Ko, rendu identique). ✔
- [x] **Lighthouse mobile** (local, 26/11/2026) : Performance 93–94, Accessibilité 96 (100 sans le noindex), Bonnes pratiques 100, SEO 69 avec le noindex de la démo → **100** sur une copie sans noindex. ✔
- [ ] **Animations sur un vrai iPhone** : vérifier le défilement (photos équipe, galerie, hero) et la barre d'adresse de Safari qui se replie.
- [x] **Horaires** : ligne du jour en magenta + « Aujourd'hui », badge « Ouvert maintenant · jusqu'à 20h » / « Fermé · ouvre mardi à 10h » (heure de Bruxelles, mis à jour chaque minute, caché sans JS). Horaires définis une fois dans `HOURS` (`script.js`) : si les horaires changent, modifier `HOURS`, la liste `.hours__list` et le JSON-LD. ✔

## Démo : indexation bloquée (en attente de validation par Isma)
Le site est redevenu une démo le 26/11/2026 : Google ne doit pas l'indexer tant qu'Isma n'a pas validé. Pas de bandeau « maquette ».
- `<meta name="robots" content="noindex, nofollow">` sur `index.html`, les 2 pages légales et `404.html`.
- `_headers` : `X-Robots-Tag: noindex, nofollow` sur toutes les adresses.
- `robots.txt` : `Disallow: /`.

**Le jour où il valide, tout retirer :**
- [ ] Supprimer `_headers`.
- [ ] `robots.txt` : remettre `User-agent: *`, `Allow: /`, `Sitemap: https://54cutz.be/sitemap.xml`.
- [ ] `index.html` : `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">`.
- [ ] Pages légales et `404.html` : `<meta name="robots" content="noindex, follow">` (elles restent hors index).
- [ ] Mettre à jour `<lastmod>` du sitemap, publier, puis vérifier en ligne qu'il n'y a plus d'en-tête `X-Robots-Tag` et soumettre le sitemap dans Search Console.

## Pages légales (Belgique)
- `mentions-legales.html` — éditeur, BCE/TVA, hébergeur, propriété intellectuelle, droit belge (Livre XII Code de droit économique).
- `politique-confidentialite.html` — RGPD : données, finalités, bases légales, sous-traitants (Salonkee/Cloudflare/Google Maps au clic), cookies, conservation, droits, réclamation APD.
- Liées dans le footer du site + entre elles. En `noindex` (volontairement hors sitemap).
- ⚠️ **Modèles** rédigés selon le droit belge/RGPD à partir des infos connues — à faire relire par un professionnel avant usage définitif.
- [x] Nom légal et forme juridique vérifiés à la BCE (26/11/2026) : **54 CUTZ SRL**, BE 1031.637.857, siège Chaussée de Charleroi 45, administrateurs Ismaël Alaoui et Wyatt Devillers. ✔
- [x] Hébergeur des mentions légales et sous-traitants RGPD passés à Cloudflare. ✔

## SEO (domaine cible : 54cutz.be)
- **Données structurées** JSON-LD (`@graph`) : `HairSalon` (NAP, géo, horaires, 5 prestations + prix « dès », 4 barbers, `legalName` 54 CUTZ SRL + `vatID`, réseaux `sameAs`, `areaServed`, réservation Salonkee, `subjectOf` → FAQ) + `FAQPage` (mêmes 5 questions que la FAQ visible : les garder identiques). Google n'affiche plus les FAQ en résultat enrichi pour les commerces, mais le balisage reste valide et utile. `paymentAccepted` retiré (non vérifié).
- **Méta** : title/description sur « barber / barbier à Perwez, Brabant wallon », balises `geo.*`/`ICBM`, Open Graph + Twitter Card, `canonical` → `https://54cutz.be/`. Plus de meta keywords (ignorée par Google).
- `sitemap.xml` (avec image) + `robots.txt`.
- NAP cohérent partout : **Salon 54cutz · Chaussée de Charleroi 45, 1360 Perwez · 54cutz@gmail.com**.
- Pas de note/avis dans le schema (Google pénalise les `aggregateRating` non vérifiables on-page) ni de téléphone (le salon ne répond pas aux appels → contact via réseaux/Salonkee).

### À faire côté Google (hors code)
- [ ] Pointer le domaine **54cutz.be** vers l'hébergement + activer HTTPS.
- [ ] Mettre l'URL `https://54cutz.be` sur la fiche **Google Business Profile** et les réseaux.
- [ ] Soumettre `https://54cutz.be/sitemap.xml` dans **Google Search Console**.
- [ ] Vérifier le rendu avec le test des résultats enrichis Google (Rich Results Test).

## SEO hors site, à faire avec le client
- [ ] **Fiche Google Business Profile** : catégorie principale « Barbier » (secondaire « Salon de coiffure pour hommes » si proposée), horaires identiques au site, photos récentes (salon, équipe, réalisations), lien du site (`https://54cutz.be`) et lien de réservation Salonkee, répondre à chaque avis (positif comme négatif).
- [ ] **Avis Google** : demander aux clients satisfaits de laisser un avis (lien court de la fiche, QR code au comptoir). Jamais d'avis achetés ni recopiés de Salonkee.
- [ ] **Fiche Planity** : téléphone et horaires différents du site → la corriger ou la faire supprimer (des infos contradictoires brouillent Google).
- [ ] **Lien du site partout** : Salonkee (fiche du salon), bio Instagram, TikTok, page Facebook.
- [ ] **Pages d'Or** (pagesdor.be) : créer ou corriger la fiche avec le même nom, la même adresse et le même e-mail (NAP identique partout).
- [ ] **Google Search Console** : valider le domaine, soumettre `https://54cutz.be/sitemap.xml` (après la levée du noindex), surveiller l'indexation et les requêtes « barber Perwez », « barbier Perwez ».
- [ ] **54cutz.com ou 54cutz.be** : 54cutz.com est le domaine historique (déjà connu de Google, liens existants) mais il est chez l'agence Pixl. Si le client peut le récupérer, le garder comme adresse principale ou le rediriger en 301 vers 54cutz.be pour ne pas perdre son ancienneté ; sinon, 54cutz.be seul et mettre à jour tous les liens. À décider avec lui.

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

## 26/11/2026 (après-midi)
- Vérification Salonkee + BCE : n° d'entreprise remplacé par celui de 54 CUTZ SRL (BE 1031.637.857).
- Horaires : jour actuel mis en évidence (`data-day` + `is-today`) et badge ouvert/fermé (fuseau Europe/Brussels).
- Testé avec `npx wrangler dev`, Chromium + WebKit, 375 et 1280 px, horloge simulée (visiteur à New York / Tokyo) : mardi 11h, mardi 21h, samedi 14h30, lundi, dimanche 16h, mercredi 8h, passage de 15h et de minuit, sans JS.

- Images au défilement sur mobile : plus de glissement après l'arrêt du scroll ni de bande sombre en haut des photos de l'équipe, plus de survol « collé » après un tap (détail dans la checklist).

- SEO local (title, description, H1, texte, FAQ + `FAQPage`, `<img>` avec alt), parallaxe reconstruit en couches, survols réservés à la souris, démo protégée de l'indexation (noindex + `X-Robots-Tag` + robots.txt).

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
- [ ] Bio de Wyatt : « depuis plus d'un an, j'ai 18 ans » (texte de l'ancien site) — encore exact ? (pas vérifiable en ligne)
- [ ] Bio d'Ismaël « trois ans que je pratique » et stat « 3+ ans d'expérience » — encore exact ? (ancien n° BCE ouvert en juillet 2023)
- [ ] Instagram de Raphaël `@menjoucutz` et Bastien `@sneizycutz` : repris des noms Salonkee (« Menjoucutz », « sneizycutz »), comptes pas vérifiés.
- [ ] Salonkee affiche un téléphone (+32 479 83 28 56) ; le site n'en met pas (le salon ne répond pas aux appels). Garder ainsi ?
- [ ] Afficher les durées des prestations sur le site (connues via Salonkee, voir checklist) ?
- [ ] Stat « 100 % sens du détail » : ce n'est pas un vrai chiffre. Garder ou remplacer (ex. années d'ouverture du salon) ?
- [ ] Fiche Planity : téléphone et horaires différents (lun–sam 9h–18h) → la mettre à jour ou la supprimer.
- [ ] Lien de la fiche Google (pour un bouton « Avis Google »).
- [ ] Moyens de paiement acceptés (espèces, carte, Bancontact, paiement mobile ?) : info absente de Salonkee et de 54cutz.com, donc pas dans la FAQ ni le JSON-LD. Le parking devant la vitrine est confirmé (Salonkee + 54cutz.com) et figure dans la FAQ.
- [ ] Texte SEO : « Perwez se trouve entre Gembloux, Jodoigne et Eghezée » — le client est-il d'accord pour citer ces communes ?
- [ ] Domaine 54cutz.be : qui l'achète, à quel nom. Et 54cutz.com (agence Pixl) : qui détient le domaine ?
