// Build-time generator: one SEO page per shiur that has a transcript → public/shiur/<id>/
// + sitemap-shiurim.xml + robots.txt sitemap line. Self-hosted only — no external mentions.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const J = (p) => JSON.parse(readFileSync(`${root}/${p}`, "utf8"));
const LIB = J("public/data/library.json");           // [[id, he, chan], ...]
const TR = J("data/transcripts.json");                // { id: text }
let CUR = {}; try { for (const v of J("public/data/curated.json")) CUR[v.id] = v; } catch {}
const CDN = "https://hayanuka-media.nyc3.cdn.digitaloceanspaces.com";
const meta = {}; for (const [id, he, chan] of LIB) meta[id] = { he, chan };
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const page = (id, title, en, chan, text) => {
  const fallback = `A shiur by the Yanuka — HaGaon Rav Shlomo Yehuda Beeri shlit"a${chan ? " · " + chan : ""}. Watch, listen, or download in audio or video — free, forever.`;
  const desc = text ? esc(text.slice(0, 155).replace(/\s+\S*$/, "")) + "…" : esc(fallback);
  const ld = { "@context": "https://schema.org", "@type": "VideoObject", name: title, description: text ? text.slice(0, 300) : fallback,
    thumbnailUrl: `${CDN}/thumb/${id}.jpg`, contentUrl: `${CDN}/video/${id}.mp4`, inLanguage: "he",
    url: `https://hayanuka.life/shiur/${id}/`, publisher: { "@type": "Organization", name: "hayanuka.life" } };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — The Yanuka, in English</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://hayanuka.life/shiur/${id}/">
<meta property="og:title" content="${esc(title)}"><meta property="og:type" content="video.other">
<meta property="og:image" content="${CDN}/thumb/${id}.jpg"><meta property="og:url" content="https://hayanuka.life/shiur/${id}/">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
:root{--g:#0a0e1a;--g2:#0e1424;--gold:#d8b976;--goldb:#f0d99a;--ink:#e8e4da;--soft:#a9a294;--line:rgba(216,185,118,.16)}
*{margin:0;box-sizing:border-box}body{background:var(--g);color:var(--ink);font:16px/1.65 Assistant,system-ui,sans-serif}
a{color:var(--goldb);text-decoration:none}.wrap{max-width:880px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;background:rgba(10,14,26,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);z-index:5}
.h-in{display:flex;align-items:center;gap:12px;height:60px}.h-in img{width:34px;height:34px;border-radius:9px}
.h-in b{font-size:1rem}.h-in a.home{margin-inline-start:auto;font-weight:700;font-size:.88rem}
h1{font-family:Georgia,serif;font-size:clamp(1.5rem,4vw,2.3rem);line-height:1.3;margin:34px 0 6px}
.ch{color:var(--gold);font-size:.85rem;margin-bottom:22px}
video{width:100%;border-radius:14px;background:#000;border:1px solid var(--line)}
.acts{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0 34px}
.b{display:inline-block;padding:.6em 1.3em;border-radius:999px;font-weight:700;font-size:.9rem;border:1px solid var(--line)}
.b.g{background:linear-gradient(135deg,var(--goldb),var(--gold));color:#23180a;border:none}
h2{font-family:Georgia,serif;color:var(--goldb);font-size:1.35rem;margin:0 0 10px}
.tr{background:var(--g2);border:1px solid var(--line);border-radius:14px;padding:22px 24px;margin-bottom:30px}
.tr p{color:var(--soft);font-size:.98rem}
.note{font-size:.8rem;color:var(--soft);opacity:.8;margin:10px 0 40px}
footer{border-top:1px solid var(--line);padding:26px 0 40px;font-size:.85rem;color:var(--soft)}
</style></head><body>
<header><div class="wrap h-in"><img src="/favicon.svg" alt=""><b>The Yanuka — Torah in English</b><a class="home" href="/">All shiurim →</a></div></header>
<main class="wrap">
<h1 dir="rtl">${esc(title)}</h1>
<p class="ch">${esc(chan || "")}${en ? " · " + esc(en) : ""}</p>
<video controls preload="metadata" playsinline poster="${CDN}/thumb/${id}.jpg"><source src="${CDN}/video/${id}.mp4" type="video/mp4"></video>
<div class="acts">
  <a class="b g" href="/?play=${id}">▸ Open in the full player</a>
  <a class="b" href="${CDN}/video/${id}.mp4">⬇︎ Download video</a>
  <a class="b" href="${CDN}/audio/${id}.mp3">🎧 Download audio</a>
</div>
${text ? `<h2>Transcript</h2>
<div class="tr"><p dir="rtl" lang="he">${esc(text)}</p></div>
<p class="note">This transcript is generated automatically from the recording and may contain errors — it's here as a helper, not a substitute for the shiur itself. An English translation is on its way.</p>` : `<p class="note">Part of the full library — every shiur of the Yanuka, gathered in one place, in English. Transcript coming soon.</p>`}
</main>
<footer><div class="wrap">All content belongs to the Yanuka and his mosdos — gathered here with love, לזכות הרבים. · <a href="/">hayanuka.life</a></div></footer>
</body></html>`;
};

let n = 0; const urls = [];
for (const [id, he, chan] of LIB) {
  const c = CUR[id];
  mkdirSync(`${root}/public/shiur/${id}`, { recursive: true });
  writeFileSync(`${root}/public/shiur/${id}/index.html`, page(id, he || (c && c.en) || "Shiur", c && c.en, chan, TR[id] || ""));
  urls.push(`https://hayanuka.life/shiur/${id}/`); n++;
}
const today = "2026-07-23";
writeFileSync(`${root}/public/sitemap-shiurim.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `<url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n") + `\n</urlset>\n`);
writeFileSync(`${root}/public/robots.txt`,
  `User-agent: *\nAllow: /\n\nSitemap: https://hayanuka.life/sitemap-index.xml\nSitemap: https://hayanuka.life/sitemap-shiurim.xml\n`);
console.log(`shiur pages: ${n} | sitemap-shiurim.xml written | robots.txt updated`);
