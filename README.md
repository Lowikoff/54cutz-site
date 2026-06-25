# 54CUTZ — refonte site (proposition)

Site vitrine moderne pour le barbershop **54cutz** (Perwez). Une page, full responsive,
animations au scroll, design noir/or éditorial.

## Lancer en local
```bash
cd site-54cutz
python3 -m http.server 8000
# ouvrir http://localhost:8000
```
Ou double-clic sur `index.html`.

## Identité visuelle
- **Palette dérivée du logo + de l'enseigne néon** du salon : base noir/blanc monochrome
  (logo brushstroke blanc) + accent dégradé néon **magenta → bleu** (échantillonné sur
  l'enseigne "54CUTZ" de la devanture). Variables CSS : `--magenta`, `--blue`, `--neon`.
- **Logo** (`assets/logo.png`) utilisé dans le loader, la nav, le footer + favicon.

## Stack
- HTML / CSS / JS purs — zéro build, hébergeable partout (Netlify, Vercel, OVH, GitHub Pages).
- [GSAP + ScrollTrigger](https://gsap.com) via CDN → parallaxe + révélation de texte.
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
- [ ] **Handles réseaux** — vérifier `@54cutz_` (Insta/TikTok), `@w9cutzz` (Wyatt), `@menjoucutz` (Raphaël), `@sneizycutz` (Bastien).
- [ ] **Carte** — pré-réglée "Chau. de Charleroi 45, 1360 Perwez". Vérifier le pin.
- [ ] **Photos galerie** — sélection actuelle modifiable (13 dispo dans `assets/images/`).
- [ ] Retirer la mention "proposition de refonte" du footer une fois validé.

## SEO (domaine cible : 54cutz.be)
- **Données structurées** JSON-LD `HairSalon` : NAP, géo, horaires, 5 prestations + prix, 4 barbers, réseaux (`sameAs`), action de réservation Salonkee.
- **Méta** : title/description orientés local ("barbier Perwez"), balises `geo.*`/`ICBM`, Open Graph + Twitter Card, `canonical` → `https://54cutz.be/`.
- `sitemap.xml` (avec image) + `robots.txt` + `CNAME` (`54cutz.be`) pour GitHub Pages.
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
| Coupe | 30 € | 25 € | 20 € |
| Barbe | 20 € | 15 € | — |
| Coupe + Barbe | 40 € | 35 € | 30 € |
| Transformation | 40 € | — | — |
| Service V.I.P | 60 € | — | — |

## Contenu repris du site actuel
Nom, baseline, services (Coupe / Barbe / Coupe+Barbe / Transformation / V.I.P),
horaires, adresse, email, conditions d'annulation, TVA, bios Ismaël & Wyatt.
