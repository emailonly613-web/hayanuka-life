// Build-time generator v2: one SEO page per shiur → public/shiur/<id>/
// + /torah/ paginated browse (real <a> mesh — no orphan pages) + /niggunim/ /alonim/ /tefillos/ /about-the-yanuka/
// + sitemap wave: sitemap-shiurim.xml = hub pages + content-rich shiurim; sitemap-shiurim-2.xml = the long tail (unreferenced until pages are enriched)
// Self-hosted only — no external platform mentions.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const J = (p) => JSON.parse(readFileSync(`${root}/${p}`, "utf8"));
const LIB_ALL = J("public/data/library.json");        // [[id, he, chan, kind], ...]
const LIB = process.env.GEN_LIMIT ? LIB_ALL.slice(0, +process.env.GEN_LIMIT) : LIB_ALL; // GEN_LIMIT: fast dev/validation slice
const TR = J("data/transcripts.json");                 // { id: text }
let CUR = {}; try { for (const v of J("public/data/curated.json")) CUR[v.id] = v; } catch {}
let DUR = {}; try { DUR = J("public/data/durations.json"); } catch {}
let DATES = {}; try { DATES = J("public/data/dates.json"); } catch {}
let ALONIM = []; try { ALONIM = J("public/data/alonim.json"); } catch {}
let TFILOT = []; try { TFILOT = J("public/data/tfilot.json"); } catch {}
let MUSIC = []; try { MUSIC = J("public/data/music.json"); } catch {}
const { CATEGORIES_EN, STORY_EN } = await import("../data/en-content.mjs");
const CDN = "https://hayanuka-media.nyc3.cdn.digitaloceanspaces.com";
const SITE = "https://hayanuka.life";
const today = new Date().toISOString().slice(0, 10);
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const clean = (s) => (s || "").replace(/&gt;|&lt;|&amp;|>>/g, " ").replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
const iso = (sec) => { if (!sec) return null; const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.round(sec % 60); return `PT${h ? h + "H" : ""}${m ? m + "M" : ""}${s}S`; };
const mins = (sec) => (sec ? `${Math.max(1, Math.round(sec / 60))} min` : "");

const VARIANTS = `The Yanuka — also spelled HaYanuka, Yenuka, Yanukah or Januka (הינוקא) — is HaGaon Rav Shlomo Yehuda Beeri shlit”a.`;

const CSS = `
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
.crumbs{font-size:.82rem;color:var(--soft);margin:18px 0 0}.crumbs a{color:var(--gold)}
.pn{display:flex;gap:12px;margin:0 0 34px;flex-wrap:wrap}
.pn-a{flex:1;min-width:220px;background:var(--g2);border:1px solid var(--line);border-radius:12px;padding:12px 16px;font-size:.85rem;color:var(--gold)}
.pn-a span{display:block;color:var(--ink);font-size:.92rem;margin-top:4px}
ul.rel,ul.list{list-style:none;margin:0 0 34px}
ul.rel li,ul.list li{border-bottom:1px solid var(--line);padding:9px 0}
ul.rel small,ul.list small{color:var(--soft);font-size:.78rem;display:block}
.pgn{display:flex;flex-wrap:wrap;gap:8px;margin:26px 0 40px}
.pgn a,.pgn b{min-width:38px;text-align:center;padding:.4em .6em;border:1px solid var(--line);border-radius:9px;font-size:.85rem}
.pgn b{background:linear-gradient(135deg,var(--goldb),var(--gold));color:#23180a;border:none}
.intro{color:var(--soft);margin:0 0 26px;max-width:760px}
.cats{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 30px}
.cats span{border:1px solid var(--line);border-radius:999px;padding:.35em 1em;font-size:.82rem;color:var(--gold)}
.cardrow{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin:0 0 34px}
.cardrow a{background:var(--g2);border:1px solid var(--line);border-radius:12px;padding:14px 16px;font-size:.9rem}
.cardrow a small{display:block;color:var(--soft);font-size:.78rem;margin-top:4px}
.pdfs{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin:0 0 34px}
.pdfs a{background:var(--g2);border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:.85rem}
.pdfs img{width:100%;aspect-ratio:5/4;object-fit:cover;object-position:top;display:block;background:#111}
.pdfs div{padding:10px 12px}.pdfs small{color:var(--soft);display:block;font-size:.75rem}
.fnav{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:12px;font-size:.85rem}
footer{border-top:1px solid var(--line);padding:26px 0 40px;font-size:.85rem;color:var(--soft)}`;

const FOOT = `<footer><div class="wrap">
<nav class="fnav"><a href="/">Home</a><a href="/torah/">Torah Library</a><a href="/niggunim/">Niggunim</a><a href="/alonim/">Weekly Alonim</a><a href="/tefillos/">Tefillos &amp; Segulos</a><a href="/about-the-yanuka/">About the Yanuka</a><a href="https://hayanuka.com" rel="noopener">Official Site (Hebrew)</a></nav>
<p>${esc(VARIANTS)} All content belongs to the Yanuka and his mosdos — gathered here with love, לזכות הרבים. · <a href="/">hayanuka.life</a></p>
</div></footer>`;

const shell = ({ title, desc, path, ld, body, ogImage }) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:title" content="${esc(title)}"><meta property="og:type" content="website">
<meta property="og:image" content="${ogImage || SITE + "/img/main-3.jpeg"}"><meta property="og:url" content="${SITE}${path}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>${CSS}</style></head><body>
<header><div class="wrap h-in"><a href="/"><img src="/favicon.svg" alt="hayanuka.life"></a><b>The Yanuka — Torah in English</b><a class="home" href="/">Home →</a></div></header>
<main class="wrap">
${body}
</main>
${FOOT}
</body></html>`;

// ---------- per-shiur pages ----------
const meta = {}; LIB.forEach(([id, he, chan], i) => { meta[id] = { he, chan, i }; });
const byChan = {}; LIB.forEach(([id, , chan], i) => { (byChan[chan] = byChan[chan] || []).push(i); });

const shiurPage = (id, title, en, chan, text, idx) => {
  const dur = DUR[id], date = DATES[id];
  const cleaned = clean(text);
  const fallback = `A shiur by the Yanuka — HaGaon Rav Shlomo Yehuda Beeri shlit"a${chan ? " · " + chan : ""}${dur ? " · " + mins(dur) : ""}. Watch, listen, or download in audio or video — free, forever.`;
  const desc = cleaned ? cleaned.slice(0, 155).replace(/\s+\S*$/, "") + "…" : fallback;
  const vo = { "@type": "VideoObject", name: title, description: cleaned ? cleaned.slice(0, 300) : fallback,
    thumbnailUrl: `${CDN}/thumb/${id}.jpg`, contentUrl: `${CDN}/video/${id}.mp4`, inLanguage: "he",
    url: `${SITE}/shiur/${id}/`, publisher: { "@type": "Organization", name: "hayanuka.life" } };
  if (date) vo.uploadDate = date;
  if (iso(dur)) vo.duration = iso(dur);
  const ld = { "@context": "https://schema.org", "@graph": [vo,
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Torah Library", item: `${SITE}/torah/` },
      { "@type": "ListItem", position: 3, name: title } ] }] };
  const prev = idx > 0 ? LIB[idx - 1] : null, next = idx < LIB.length - 1 ? LIB[idx + 1] : null;
  const sibs = (byChan[chan] || []).filter((j) => j !== idx);
  const pos = sibs.findIndex((j) => j > idx); const start = pos === -1 ? Math.max(0, sibs.length - 4) : Math.max(0, pos - 2);
  const rel = sibs.slice(start, start + 4).map((j) => LIB[j]);
  const pnav = (prev || next) ? `<nav class="pn">
${prev ? `<a class="pn-a" href="/shiur/${prev[0]}/">‹ Previous shiur<span dir="rtl">${esc(prev[1])}</span></a>` : ""}
${next ? `<a class="pn-a" href="/shiur/${next[0]}/">Next shiur ›<span dir="rtl">${esc(next[1])}</span></a>` : ""}
</nav>` : "";
  const relHtml = rel.length ? `<h2>More from ${esc(chan || "the library")}</h2>
<ul class="rel">${rel.map(([rid, rhe]) => `<li><a href="/shiur/${rid}/" dir="rtl">${esc(rhe)}</a><small>${esc(chan || "")}${DUR[rid] ? " · " + mins(DUR[rid]) : ""}</small></li>`).join("")}</ul>` : "";
  const body = `<nav class="crumbs"><a href="/">Home</a> › <a href="/torah/">Torah Library</a></nav>
<h1 dir="rtl">${esc(title)}</h1>
<p class="ch">${esc(chan || "")}${en ? " · " + esc(en) : ""}${dur ? " · " + mins(dur) : ""}${date ? " · " + date : ""}</p>
<video controls preload="metadata" playsinline poster="${CDN}/thumb/${id}.jpg"><source src="${CDN}/video/${id}.mp4" type="video/mp4"></video>
<div class="acts">
  <a class="b g" href="/?play=${id}">▸ Open in the full player</a>
  <a class="b" href="${CDN}/video/${id}.mp4">⬇︎ Download video</a>
  <a class="b" href="${CDN}/audio/${id}.mp3">🎧 Download audio</a>
</div>
${pnav}
${text ? `<h2>Transcript</h2>
<div class="tr"><p dir="rtl" lang="he">${esc(text)}</p></div>
<p class="note">This transcript is generated automatically from the recording and may contain errors — it's here as a helper, not a substitute for the shiur itself. An English translation is on its way.</p>` : `<p class="note">Part of the full library — every shiur of the Yanuka, gathered in one place, in English. Transcript coming soon.</p>`}
${relHtml}`;
  return shell({ title: `${title} — The Yanuka, in English`, desc, path: `/shiur/${id}/`, ld, body, ogImage: `${CDN}/thumb/${id}.jpg` });
};

let n = 0; const richUrls = [], tailUrls = [];
LIB.forEach(([id, he, chan], idx) => {
  const c = CUR[id];
  mkdirSync(`${root}/public/shiur/${id}`, { recursive: true });
  writeFileSync(`${root}/public/shiur/${id}/index.html`, shiurPage(id, he || (c && c.en) || "Shiur", c && c.en, chan, TR[id] || "", idx));
  (TR[id] || c ? richUrls : tailUrls).push(`${SITE}/shiur/${id}/`); n++;
});

// ---------- /torah/ paginated browse (the link mesh) ----------
const PER = 200, PAGES = Math.ceil(LIB.length / PER);
const pgnNav = (cur) => `<nav class="pgn">${Array.from({ length: PAGES }, (_, i) => { const p = i + 1, href = p === 1 ? "/torah/" : `/torah/${p}/`; return p === cur ? `<b>${p}</b>` : `<a href="${href}">${p}</a>`; }).join("")}</nav>`;
const listHtml = (slice) => `<ul class="list">${slice.map(([id, he, chan]) => `<li><a href="/shiur/${id}/" dir="rtl">${esc(he)}</a><small>${esc(chan || "")}${DUR[id] ? " · " + mins(DUR[id]) : ""}</small></li>`).join("\n")}</ul>`;
const hubUrls = [];
for (let p = 1; p <= PAGES; p++) {
  const slice = LIB.slice((p - 1) * PER, p * PER);
  const path = p === 1 ? "/torah/" : `/torah/${p}/`;
  hubUrls.push(`${SITE}${path}`);
  const isFirst = p === 1;
  const title = isFirst ? `Torah Library — Every Shiur of the Yanuka in One Place` : `All Shiurim of the Yanuka — Page ${p} of ${PAGES} | Torah Library`;
  const desc = isFirst
    ? `Browse all ${LIB.length.toLocaleString()} shiurim of HaGaon Rav Shlomo Yehuda Beeri shlit”a — the Yanuka — in English: mussar, halachah, the weekly parashah, stories and more. Watch, listen or download every shiur, free.`
    : `Page ${p} of the complete Torah library of the Yanuka — Rav Shlomo Yehuda Beeri. ${slice.length} shiurim to watch, listen or download free.`;
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, url: `${SITE}${path}`, isPartOf: { "@id": `${SITE}/#website` } };
  const curatedHtml = isFirst && Object.keys(CUR).length ? `<h2>Start here — hand-picked shiurim</h2>
<div class="cardrow">${Object.values(CUR).map((c) => `<a href="/shiur/${c.id}/">${esc(c.en || c.he)}<small dir="rtl">${esc(c.he)}</small></a>`).join("")}</div>` : "";
  const catsHtml = isFirst && CATEGORIES_EN ? `<div class="cats">${Object.values(CATEGORIES_EN).map((c) => `<span>${esc(c.en)}</span>`).join("")}</div>` : "";
  const intro = isFirst ? `<p class="intro">This is the complete Torah library of the Yanuka — HaGaon Rav Shlomo Yehuda Beeri shlit”a (also written HaYanuka, Yenuka or Yanukah). Every shiur we have gathered — ${LIB.length.toLocaleString()} and growing — lives here: mussar and self-work, halachah, the weekly parashah, timely Torah for the chagim, stories and moments. Tap any shiur to watch it, listen to it, or download it in audio or video — always free.</p>` : `<p class="intro">The complete library of the Yanuka's shiurim, page ${p} of ${PAGES}. <a href="/torah/">Back to the library home →</a></p>`;
  const body = `<nav class="crumbs"><a href="/">Home</a> › Torah Library${isFirst ? "" : ` › Page ${p}`}</nav>
<h1>${isFirst ? "The Torah Library" : `All Shiurim — Page ${p}`}</h1>
${intro}
${catsHtml}
${curatedHtml}
${isFirst ? "<h2>The full library</h2>" : ""}
${listHtml(slice)}
${pgnNav(p)}`;
  mkdirSync(`${root}/public${path}`, { recursive: true });
  writeFileSync(`${root}/public${path}index.html`, shell({ title, desc, path, ld, body }));
}

// ---------- /niggunim/ ----------
{
  const musicLib = LIB.filter(([, , chan]) => /music|ניגוני/i.test(chan || ""));
  MUSIC = MUSIC.filter((m) => m.mid && meta[m.mid]); // only link niggunim that exist as library pages
  const path = "/niggunim/"; hubUrls.push(`${SITE}${path}`);
  const title = "Niggunim of the Yanuka — Original Melodies of Rav Shlomo Yehuda Beeri";
  const desc = `The niggunim (melodies) of the Yanuka — composed at the keyboard after his shiurim. Listen, watch and download ${musicLib.length} niggunim and musical moments, free, plus ${MUSIC.length} curated favorites with English titles.`;
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, url: `${SITE}${path}`, isPartOf: { "@id": `${SITE}/#website` } };
  const body = `<nav class="crumbs"><a href="/">Home</a> › Niggunim</nav>
<h1>Niggunim of the Yanuka</h1>
<p class="intro">After many of his shiurim, the Yanuka — Rav Shlomo Yehuda Beeri — sits at the keyboard and plays. The niggunim that come out of those moments are loved around the world. Here they are, gathered in one place: listen, watch, or download any of them, free.</p>
${MUSIC.length ? `<h2>Curated favorites</h2><div class="cardrow">${MUSIC.map((m) => `<a href="/shiur/${m.mid}/">${esc(m.en)}<small dir="rtl">${esc(m.he)}</small></a>`).join("")}</div>` : ""}
${musicLib.length ? `<h2>All niggunim &amp; music</h2>${listHtml(musicLib)}` : ""}`;
  mkdirSync(`${root}/public${path}`, { recursive: true });
  writeFileSync(`${root}/public${path}index.html`, shell({ title, desc, path, ld, body }));
}

// ---------- /alonim/ ----------
{
  const path = "/alonim/"; hubUrls.push(`${SITE}${path}`);
  const title = "Weekly Alonim — “MiShulchan Shlomo” Torah Sheets in PDF | The Yanuka";
  const desc = `${ALONIM.length} weekly alonim (Torah sheets) of the Yanuka — Rav Shlomo Yehuda Beeri — organized by parashah and year. Read online or download every PDF free.`;
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, url: `${SITE}${path}`, isPartOf: { "@id": `${SITE}/#website` } };
  const byYear = {}; ALONIM.forEach((a) => { (byYear[a.year || "General"] = byYear[a.year || "General"] || []).push(a); });
  const years = Object.keys(byYear).sort().reverse();
  const body = `<nav class="crumbs"><a href="/">Home</a> › Weekly Alonim</nav>
<h1>Weekly Alonim</h1>
<p class="intro">Every week, the Torah of the Yanuka is printed and shared in an alon — a Torah sheet on the parashah, “MiShulchan Shlomo”. All ${ALONIM.length} alonim we have gathered are here, organized by year and parashah. Tap any cover to open the PDF — free to read, download and share.</p>
${years.map((y) => `<h2>${esc(y)}</h2>
<div class="pdfs">${byYear[y].map((a) => `<a href="${esc(a.pdf)}" rel="noopener"><img src="${CDN}/covers/${a.id}.jpg" alt="${esc(a.en || a.he)}" loading="lazy" onerror="this.style.display='none'"><div>${esc(a.en || a.he)}<small dir="rtl">${esc(a.he)}</small></div></a>`).join("")}</div>`).join("\n")}`;
  mkdirSync(`${root}/public${path}`, { recursive: true });
  writeFileSync(`${root}/public${path}index.html`, shell({ title, desc, path, ld, body }));
}

// ---------- /tefillos/ ----------
{
  const path = "/tefillos/"; hubUrls.push(`${SITE}${path}`);
  const title = "Tefillos & Segulos of the Yanuka — Prayers to Download (PDF)";
  const desc = `${TFILOT.length} tefillos and segulos composed or shared by the Yanuka — Rav Shlomo Yehuda Beeri — including prayers for protection, redemption and healing. Every PDF free to download.`;
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, url: `${SITE}${path}`, isPartOf: { "@id": `${SITE}/#website` } };
  const body = `<nav class="crumbs"><a href="/">Home</a> › Tefillos &amp; Segulos</nav>
<h1>Tefillos &amp; Segulos</h1>
<p class="intro">Prayers with the Yanuka's voice in them — tefillos and segulos shared through his mosdos, gathered here with their English names. Tap any card to open the PDF, free to download, print and share.</p>
<div class="pdfs">${TFILOT.map((t) => `<a href="${esc(t.pdf)}" rel="noopener"><img src="${CDN}/covers/${t.id}.jpg" alt="${esc(t.en || t.he)}" loading="lazy" onerror="this.style.display='none'"><div>${esc(t.en || t.he)}<small dir="rtl">${esc(t.he)}</small></div></a>`).join("")}</div>`;
  mkdirSync(`${root}/public${path}`, { recursive: true });
  writeFileSync(`${root}/public${path}index.html`, shell({ title, desc, path, ld, body }));
}

// ---------- /about-the-yanuka/ ----------
{
  const path = "/about-the-yanuka/"; hubUrls.push(`${SITE}${path}`);
  const title = "About the Yanuka — Rav Shlomo Yehuda Beeri (HaYanuka · Yenuka · Yanukah)";
  const desc = `Who is the Yanuka? The story of HaGaon Rav Shlomo Yehuda Beeri shlit”a — also spelled HaYanuka, Yenuka or Yanukah — the Torah prodigy whose shiurim, niggunim and tefillos are gathered here in English.`;
  const ld = { "@context": "https://schema.org", "@type": "AboutPage", name: title, url: `${SITE}${path}`,
    mainEntity: { "@type": "Person", "@id": `${SITE}/#yanuka`, name: "Rav Shlomo Yehuda Beeri",
      alternateName: ["The Yanuka", "HaYanuka", "Yenuka", "Yanukah", "Januka", "הינוקא"],
      sameAs: ["https://www.instagram.com/hayanuka", "https://www.facebook.com/hayanuka", "https://www.tiktok.com/@the_yanuka_official", "https://hayanuka.com"] } };
  const sections = (STORY_EN.sections || []).map((s) => `<h2>${esc(s.heading)}</h2>${(s.paragraphs || []).map((p) => `<p class="intro">${esc(p)}</p>`).join("")}`).join("\n");
  const body = `<nav class="crumbs"><a href="/">Home</a> › About the Yanuka</nav>
<h1>${esc(STORY_EN.title || "About the Yanuka")}</h1>
<p class="intro"><em>${esc(STORY_EN.epigraph || "")}</em></p>
<p class="intro">${esc(VARIANTS)} However you found his name — HaYanuka, Yenuka, Yanukah — this is his English home: every shiur, niggun, alon and tefillah, gathered in one place, free.</p>
${sections}
<h2>Learn with him</h2>
<p class="intro">Start in the <a href="/torah/">Torah Library</a>, listen to his <a href="/niggunim/">niggunim</a>, read the <a href="/alonim/">weekly alonim</a>, or daven with his <a href="/tefillos/">tefillos</a>.</p>`;
  mkdirSync(`${root}/public${path}`, { recursive: true });
  writeFileSync(`${root}/public${path}index.html`, shell({ title, desc, path, ld, body }));
}

// ---------- sitemaps + robots ----------
const smap = (urls) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `<url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n") + `\n</urlset>\n`;
writeFileSync(`${root}/public/sitemap-shiurim.xml`, smap([...hubUrls, ...richUrls]));
writeFileSync(`${root}/public/sitemap-shiurim-2.xml`, smap(tailUrls));
writeFileSync(`${root}/public/robots.txt`,
  `User-agent: *\nAllow: /\n\nSitemap: https://hayanuka.life/sitemap-index.xml\nSitemap: https://hayanuka.life/sitemap-shiurim.xml\n`);
console.log(`shiur pages: ${n} | hubs: ${hubUrls.length} (torah ${PAGES}p) | sitemap wave-1: ${hubUrls.length + richUrls.length} urls | wave-2 (unreferenced): ${tailUrls.length} | robots.txt updated`);
