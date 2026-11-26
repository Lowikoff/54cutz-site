// Build de production : sources (racine du dépôt) → dist/ (seul dossier publié).
// Les fichiers sources ne sont jamais modifiés. Ne jamais éditer dist/ à la main :
// il est effacé et régénéré à chaque `npm run build`.
//
//   JS   : terser (compress + mangle, sans commentaires). GSAP (assets/js, déjà minifié) copié tel quel.
//   CSS  : csso sans restructuration (minifié, sans commentaires) : garde l'ordre des règles,
//          les préfixes -webkit- et les replis (overflow: hidden avant overflow: clip).
//          lightningcss a été écarté : il supprime ces replis.
//   HTML : html-minifier-terser (sans commentaires). JSON-LD compacté avec JSON.parse/stringify,
//          puis vérifié identique à la source.
//   Reste copié : assets/, _headers, _redirects, robots.txt (sans ses lignes de commentaire), sitemap.xml.
import { readFile, writeFile, rm, mkdir, cp, readdir, stat } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { minify as minifyJS } from "terser";
import { minify as minifyCSS } from "csso";
import { minify as minifyHTML } from "html-minifier-terser";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, "dist");
const HTML = ["index.html", "mentions-legales.html", "politique-confidentialite.html", "404.html"];
const COPY = ["_headers", "_redirects", "sitemap.xml"];
const LD_RE = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g;

const read = (f) => readFile(join(ROOT, f), "utf8");
const write = async (f, s) => { await mkdir(dirname(join(DIST, f)), { recursive: true }); await writeFile(join(DIST, f), s); };
const fail = (msg) => { console.error("BUILD KO : " + msg); process.exit(1); };
const kb = (n) => (n / 1024).toFixed(1) + " Ko";

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST);

// JS
{
  const src = await read("script.js");
  const out = await minifyJS(src, { compress: true, mangle: true, format: { comments: false } });
  if (!out.code) fail("terser n'a rien produit");
  await write("script.js", out.code);
  console.log(`script.js   ${kb(src.length)} → ${kb(out.code.length)}`);
}

// CSS
{
  const src = await read("styles.css");
  const { css } = minifyCSS(src, { restructure: false, comments: false });
  if (css.includes("/*")) fail("commentaire restant dans styles.css");
  if ((css.match(/overflow:hidden;overflow:clip/g) || []).length !== (src.match(/overflow: hidden; overflow: clip/g) || []).length)
    fail("repli overflow: hidden perdu dans styles.css");
  await write("styles.css", css);
  console.log(`styles.css  ${kb(src.length)} → ${kb(css.length)}`);
}

// HTML
for (const f of HTML) {
  const src = await read(f);
  const srcLD = [...src.matchAll(LD_RE)].map((m) => JSON.parse(m[2]));
  const compact = src.replace(LD_RE, (_, a, json, b) => a + JSON.stringify(JSON.parse(json)) + b);
  const html = await minifyHTML(compact, {
    collapseWhitespace: true,
    conservativeCollapse: true, // garde une espace entre mots/éléments en ligne : rendu identique
    removeComments: true,
    decodeEntities: false,      // garde &nbsp; &amp; tels quels
    minifyCSS: true,
    minifyJS: false,
  });
  const outLD = [...html.matchAll(LD_RE)].map((m) => JSON.parse(m[2]));
  if (!isDeepStrictEqual(srcLD, outLD)) fail(`JSON-LD modifié dans ${f}`);
  if (html.includes("<!--")) fail(`commentaire HTML restant dans ${f}`);
  await write(f, html);
  console.log(`${f.padEnd(31)} ${kb(src.length)} → ${kb(html.length)}${outLD.length ? ` (JSON-LD ×${outLD.length} valide)` : ""}`);
}

// robots.txt sans les lignes de commentaire (notes internes)
await write("robots.txt", (await read("robots.txt")).split("\n").filter((l) => !l.trim().startsWith("#")).join("\n"));

// Fichiers copiés tels quels
for (const f of COPY) await cp(join(ROOT, f), join(DIST, f));
await cp(join(ROOT, "assets"), join(DIST, "assets"), {
  recursive: true,
  filter: (p) => !p.endsWith(".DS_Store"),
});

// Récapitulatif
let n = 0, size = 0;
const walk = async (d) => { for (const e of await readdir(d)) { const p = join(d, e); const s = await stat(p); if (s.isDirectory()) await walk(p); else { n++; size += s.size; } } };
await walk(DIST);
console.log(`dist/ : ${n} fichiers, ${(size / 1048576).toFixed(2)} Mo`);
