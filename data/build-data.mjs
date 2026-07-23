// Unify everything into one render-ready model: site-data.json
// Sources: ../../data/site-items.json (official CMS scrape), ../../data/inventory.json (+wave2 if present),
// en-content.mjs (hand translations).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CATEGORIES_EN, VIDEOS_EN, TFILOT_EN, MUSIC_EN, PARASHA_EN, YEARS_EN, ALON_SERIES_EN } from "./en-content.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const items = read("../../data/site-items.json");
const inv = read("../../data/inventory.json");
const wave2 = existsSync(new URL("../../data/inventory-wave2.json", import.meta.url))
  ? read("../../data/inventory-wave2.json") : [];

const cat = (he) => CATEGORIES_EN[he]?.en || he || "General";

// ---- alonim: parse "משלחן שלמה <parashah> <year-suffix>" into English
function alonEnglish(title) {
  let t = String(title || "").replace(/^\d+\s*/, "").replace(/כתבי הקודש ["״]משולחן שלמה["״]\s*/, "").replace(/משו?לחן שלמה\s*/, "").trim();
  t = t.replace(/\s*(פו|פה|פד|פג|פב)\s*$/, "").trim(); // year suffix shorthand
  // find the longest parashah/holiday match inside
  let best = null;
  for (const [he, en] of Object.entries(PARASHA_EN)) {
    if (t.includes(he) && (!best || he.length > best.he.length)) best = { he, en };
  }
  if (!best) return t || "Weekly Edition";
  const extras = [];
  for (const [he, en] of Object.entries(PARASHA_EN)) {
    if (he !== best.he && t.includes(he) && !best.he.includes(he) && !he.includes(best.he)) extras.push(en);
  }
  return [best.en, ...extras].join(" · ");
}

const alonim = (items.alonim || []).map((a) => ({
  id: a.id,
  he: a.title,
  en: alonEnglish(a.title),
  category: cat(a.category),
  year: YEARS_EN[a.year] || a.year || "",
  pdf: a.file_url,
  featured: !!a.is_featured,
})).filter((a) => a.pdf);

const tfilot = (items.tfilot || []).map((t) => ({
  id: t.id, he: t.title, en: TFILOT_EN[t.title] || t.title,
  category: cat(t.category), pdf: t.file_url, description: t.description || "",
})).filter((t) => t.pdf);

const music = (items.music || []).map((m) => {
  const mid = (m.url || "").match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1] || null;
  return { id: m.id, he: m.title, en: MUSIC_EN[m.title] || m.title, mid: mid };
}).filter((m) => m.mid);

const curated = (items.video || []).map((v) => {
  const mid = (v.url || "").match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1] || null;
  return {
    id: mid, he: v.title, en: VIDEOS_EN[mid] || v.title, category: cat(v.category),
    description: v.description || "", featured: !!v.is_featured,
  };
}).filter((v) => v.id);

// ---- the full library: wave1 (official) + wave2 (all-YouTube)
const seen = new Set();
const lib = [];
for (const v of inv) {
  if (seen.has(v.id)) continue; seen.add(v.id);
  lib.push({
    id: v.id, he: v.title, channel: v.channel === "shiurim" ? "Official — Shiurim" : "Official — Music",
    official: true, kind: v.kind, duration: v.duration, views: v.views,
  });
}
for (const v of wave2) {
  if (seen.has(v.id)) continue; seen.add(v.id);
  lib.push({ id: v.id, he: v.title, channel: v.channel, official: false, kind: v.tab, duration: v.duration ?? null, views: null });
}

const model = {
  generated: null, // stamped by caller
  counts: { library: lib.length, curated: curated.length, alonim: alonim.length, tfilot: tfilot.length, music: music.length },
  curated, alonim, tfilot, music, library: lib,
};
writeFileSync(new URL("site-data.json", import.meta.url), JSON.stringify(model, null, 1));
console.log("site-data.json:", JSON.stringify(model.counts));
console.log("alon sample:", JSON.stringify(alonim.slice(0, 3).map((a) => a.en)));
