// ⛔ OWNER CARDINAL (2026-07-24): hayanuka.life hosts THE YANUKA ALONE — ever.
// An item is allowed ONLY if it is the Yanuka's own (official channels), from a channel dedicated to him,
// or titled with his name — and NEVER from a banned channel / with a banned title.
// Mixed channels (dedicated name, but the uploader mixes in personal/other content) are title-gated.
// This module is the ONE source of truth: build-data.mjs, sweep-new.mjs, and the purge all consult it.

export const YANUKA_RE = /ינוקא|ינוקה|yanuka|yanouka|yenouka|yenuka|hinoka|hinuka|inuka|yonaka|hayonaka|שלמה יהודה|shlomo yehuda|בארי|beeri|be['’]?eri/i;

// Channel-level bans (owner order: Rabbi Harry Rozenberg — plus ministries/commentary platforms; their
// items stay banned even when their titles mention the Yanuka).
export const BANNED_CHANNELS = /rozenberg|none of your business|ministr(?:y|ies)|church|esoterica/i;

// Title-level bans: hostile/attack content, and standalone clips of other rabbanim's own material.
export const BANNED_TITLES = /אמנון יצחק|למדן או חמדן|רוצה מיליארדים|זמיר כהן|מאיר אליהו|יוסף מזרחי|יגאל כהן|יצחק יוסף/;

// Dedicated-name channels whose uploader ALSO posts unrelated personal/other content → every item must
// carry the Yanuka's name in its title.
export const MIXED_CHANNELS = new Set([
  "הינוקא | לא רשמי - רק תורת אמת!",
  'הגאון הינוקא שליט"א',
]);

export const isAllowed = (title, chan) => {
  const t = String(title || ""), c = String(chan || "");
  if (BANNED_CHANNELS.test(c) || BANNED_TITLES.test(t)) return false;
  if (/^Official — /.test(c)) return true;                 // the Yanuka's own channels
  if (MIXED_CHANNELS.has(c.trim())) return YANUKA_RE.test(t);
  return YANUKA_RE.test(c) || YANUKA_RE.test(t);           // dedicated channels, or his name in the title
};
