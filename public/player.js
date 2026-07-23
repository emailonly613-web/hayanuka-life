/* hayanuka.life — player engine v2.
   THE MOAT: a full-screen theater — swipe/scroll shiur-to-shiur like a social feed,
   subject chips + live search to jump anywhere, collapse to a persistent mini-bar.
   Personal library (save/playlists/queue) in localStorage; account sync later. No YouTube. */
(function () {
  "use strict";
  const CDN = "https://hayanuka-media.nyc3.cdn.digitaloceanspaces.com";
  const POSTER = "/img/poster.jpg";
  const vurl = (id) => `${CDN}/video/${id}.mp4`;
  const aurl = (id) => `${CDN}/audio/${id}.mp3`;
  const turl = (id) => `${CDN}/thumb/${id}.jpg`;
  const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (s) => { s = Math.floor(s || 0); const m = Math.floor(s / 60), x = s % 60; return `${m}:${x < 10 ? "0" : ""}${x}`; };

  // ---- storage (per-browser now; account-synced later)
  const KEY = "hy-lib-v1";
  let LIB = { saved: [], playlists: [], titles: {}, media: {} };
  try { LIB = Object.assign(LIB, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(LIB)); } catch {} paintHearts(); };
  const titleOf = (id) => LIB.titles[id] || id;

  let MEDIA = {};
  const has = (id, f) => (MEDIA[id] || "").includes(f);
  let BROWSE = { cats: [], all: [] }; // registered by app.js once data loads

  // ---- DOM: mini bar
  const bar = document.createElement("div"); bar.id = "hy-bar"; bar.hidden = true;
  bar.innerHTML = `
    <div class="hb-media" id="hb-media"><video id="hb-video" playsinline preload="metadata"></video><button id="hb-expand" title="Full screen">⤢</button></div>
    <div class="hb-info"><b id="hb-title"></b><small id="hb-sub"></small></div>
    <div class="hb-ctrls">
      <button id="hb-prev" title="Previous">⏮</button>
      <button id="hb-play" class="hb-play" title="Play/Pause">▶</button>
      <button id="hb-next" title="Next">⏭</button>
    </div>
    <div class="hb-seek"><span id="hb-cur">0:00</span><input id="hb-range" type="range" min="0" max="1000" value="0"><span id="hb-dur">0:00</span></div>
    <div class="hb-right">
      <button id="hb-mode" title="Audio / Video">🎬</button>
      <button id="hb-save" title="Save">♡</button>
      <a id="hb-dl" title="Download" download>⬇︎</a>
      <button id="hb-close" title="Close">✕</button>
    </div>`;
  document.body.appendChild(bar);

  // ---- DOM: library drawer
  const drawer = document.createElement("aside"); drawer.id = "hy-drawer"; drawer.hidden = true;
  drawer.innerHTML = `<div class="hd-head"><b>My Library</b><button id="hd-close">✕</button></div>
    <div class="hd-tabs"><button class="hd-tab on" data-tab="saved">Saved</button><button class="hd-tab" data-tab="playlists">Playlists</button><button class="hd-tab" data-tab="queue">Queue</button></div>
    <div id="hd-body" class="hd-body"></div>
    <div class="hd-foot"><button id="hd-newpl" class="btn btn-ghost sm">＋ New playlist</button></div>`;
  document.body.appendChild(drawer);

  // ---- DOM: full-screen theater (the feed player)
  const th = document.createElement("div"); th.id = "hy-th"; th.hidden = true;
  th.innerHTML = `
    <div class="th-top">
      <button id="th-close" aria-label="Minimize">⌄</button>
      <div class="th-chips" id="th-chips"></div>
      <button id="th-searchbtn" aria-label="Search">⌕</button>
    </div>
    <div class="th-search" id="th-search" hidden>
      <input id="th-q" type="search" placeholder="Search all shiurim…" autocomplete="off" />
      <div class="th-results" id="th-results"></div>
    </div>
    <div class="th-stage" id="th-stage">
      <img id="th-poster" alt="" hidden />
      <div class="th-spin" id="th-spin" hidden></div>
    </div>
    <div class="th-foot">
      <div class="th-info"><b id="th-title"></b><small id="th-sub"></small></div>
      <div class="th-rail">
        <button id="th-save" title="Save">♡</button>
        <button id="th-mode" title="Audio / Video">🎧</button>
        <a id="th-dl" title="Download" download>⬇︎</a>
        <button id="th-addpl" title="Add to playlist">＋</button>
      </div>
    </div>
    <button class="th-step th-up" id="th-prevb" aria-label="Previous">‹</button>
    <button class="th-step th-down" id="th-nextb" aria-label="Next">›</button>
    <div class="th-hint" id="th-hint">swipe for the next shiur</div>`;
  document.body.appendChild(th);

  const V = bar.querySelector("#hb-video");
  const A = new Audio(); A.preload = "metadata";
  const hbMedia = bar.querySelector("#hb-media"), thStage = th.querySelector("#th-stage");
  const thPoster = th.querySelector("#th-poster"), thSpin = th.querySelector("#th-spin");
  let cur = null, mode = "video", queue = [], qi = -1, thOpen = false;
  let active = V;

  // ---- core play
  function setActive(el) { if (active !== el) { active.pause(); } active = el; }
  function play(id, title, kind, opts = {}) {
    LIB.titles[id] = title || LIB.titles[id] || id; LIB.media[id] = 1; save();
    cur = id;
    const wantAudio = (kind === "audio") || (kind !== "video" && mode === "audio");
    let played = false;
    if (wantAudio && has(id, "a")) { mode = "audio"; setActive(A); A.src = aurl(id); A.play().catch(() => {}); played = true; }
    else if (has(id, "v")) { mode = "video"; setActive(V); V.poster = has(id, "t") ? turl(id) : POSTER; V.src = vurl(id); V.play().catch(() => {}); played = true; }
    else if (has(id, "a")) { mode = "audio"; setActive(A); A.src = aurl(id); A.play().catch(() => {}); played = true; }
    if (!played) { toast("This one is being added to the library — it'll be here shortly."); }
    // surfaces
    if (mode === "video" && kind !== "audio" && opts.theater !== false && played) openTheater();
    if (!thOpen) { bar.hidden = false; document.body.classList.add("has-bar"); }
    paintNow();
    mediaSession(id);
  }
  function paintNow() {
    for (const [t, s] of [["#hb-title", "#hb-sub"], ["#th-title", "#th-sub"]]) {
      const T = document.querySelector(t), S = document.querySelector(s);
      if (T) T.textContent = titleOf(cur); if (S) S.textContent = (mode === "audio" ? "Audio" : "Video") + (queue.length > 1 ? ` · ${qi + 1}/${queue.length}` : "");
    }
    bar.querySelector("#hb-mode").textContent = mode === "audio" ? "🎧" : "🎬";
    th.querySelector("#th-mode").textContent = mode === "audio" ? "🎬" : "🎧";
    th.querySelector("#th-mode").title = mode === "audio" ? "Switch to video" : "Audio only";
    const dl = mode === "audio" ? aurl(cur) : vurl(cur);
    bar.querySelector("#hb-dl").href = dl; th.querySelector("#th-dl").href = dl;
    updSave();
    // theater stage: poster for audio mode, video otherwise
    if (thOpen) {
      if (mode === "audio") { thPoster.src = has(cur, "t") ? turl(cur) : POSTER; thPoster.hidden = false; V.style.display = "none"; }
      else { thPoster.hidden = true; V.style.display = ""; }
    } else { V.style.display = mode === "audio" ? "none" : ""; }
  }
  function playQueue(list, start, kind) { queue = list.slice(); qi = Math.max(0, start || 0); if (queue[qi]) play(queue[qi].id, queue[qi].title, kind || queue[qi].kind); renderDrawer(); }
  function step(dir) {
    if (!queue.length) return;
    const n = qi + dir; if (n < 0 || n >= queue.length) { toast(dir > 0 ? "That's the last one here — pick a subject above ✦" : "This is the first one"); return; }
    qi = n; slideFx(dir);
    play(queue[qi].id, queue[qi].title, mode === "audio" ? "audio" : "video", { theater: thOpen ? undefined : false });
  }
  const next = () => step(1), prev = () => { if (active.currentTime > 3 && queue.length < 2) { active.currentTime = 0; return; } step(-1); };
  function slideFx(dir) { thStage.classList.remove("th-slide-up", "th-slide-down"); void thStage.offsetWidth; thStage.classList.add(dir > 0 ? "th-slide-up" : "th-slide-down"); }

  // ---- theater open/close
  function openTheater() {
    if (thOpen) return; thOpen = true;
    th.hidden = false; document.body.classList.add("th-open");
    thStage.insertBefore(V, thSpin); V.controls = false;
    bar.hidden = true;
    renderChips();
    try { history.pushState({ hyTh: 1 }, "", "#watch"); } catch {}
  }
  function closeTheater(viaHistory) {
    if (!thOpen) return; thOpen = false;
    th.hidden = true; document.body.classList.remove("th-open");
    hbMedia.insertBefore(V, hbMedia.querySelector("#hb-expand")); V.controls = false; V.style.display = mode === "audio" ? "none" : "";
    bar.hidden = false; document.body.classList.add("has-bar");
    if (!viaHistory && location.hash === "#watch") { try { history.back(); } catch {} }
  }
  addEventListener("popstate", () => { if (thOpen) closeTheater(true); });
  th.querySelector("#th-close").onclick = () => closeTheater();
  bar.querySelector("#hb-expand").onclick = () => { if (mode === "video") openTheater(); };

  // ---- theater gestures: swipe / wheel / keys
  let ty = null;
  thStage.addEventListener("touchstart", (e) => { ty = e.touches[0].clientY; }, { passive: true });
  thStage.addEventListener("touchend", (e) => {
    if (ty == null) return; const d = ty - e.changedTouches[0].clientY; ty = null;
    if (Math.abs(d) > 64) (d > 0 ? next() : prev());
    else togglePlay();
  }, { passive: true });
  let wheelLock = 0;
  th.addEventListener("wheel", (e) => { const now = Date.now(); if (now - wheelLock < 650) return; wheelLock = now; e.deltaY > 0 ? next() : prev(); }, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (!thOpen) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); next(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    else if (e.key === " ") { e.preventDefault(); togglePlay(); }
    else if (e.key === "Escape") closeTheater();
  });
  th.querySelector("#th-nextb").onclick = next;
  th.querySelector("#th-prevb").onclick = prev;
  function togglePlay() { active.paused ? active.play().catch(() => {}) : active.pause(); }

  // ---- spinner + stall care (theater)
  V.addEventListener("waiting", () => { if (thOpen) thSpin.hidden = false; });
  V.addEventListener("playing", () => { thSpin.hidden = true; });
  V.addEventListener("error", () => { if (thOpen && queue.length > 1) { toast("Skipping — that one isn't ready yet"); setTimeout(next, 900); } });

  // ---- subject chips + search (the jump-shortcuts)
  function renderChips() {
    const box = th.querySelector("#th-chips"); if (!BROWSE.cats.length || box.dataset.done) return;
    box.dataset.done = 1;
    box.innerHTML = BROWSE.cats.map((c, i) => `<button class="th-chip" data-ci="${i}">${esc(c.name)}</button>`).join("");
    box.addEventListener("click", (e) => {
      const b = e.target.closest(".th-chip"); if (!b) return;
      box.querySelectorAll(".th-chip").forEach((x) => x.classList.toggle("on", x === b));
      const cat = BROWSE.cats[+b.dataset.ci];
      playQueue(cat.items.filter((x) => MEDIA[x.id]), 0, "video");
    });
  }
  const sBox = th.querySelector("#th-search"), sIn = th.querySelector("#th-q"), sRes = th.querySelector("#th-results");
  th.querySelector("#th-searchbtn").onclick = () => { sBox.hidden = !sBox.hidden; if (!sBox.hidden) sIn.focus(); };
  let st; sIn.addEventListener("input", () => { clearTimeout(st); st = setTimeout(() => {
    const q = sIn.value.trim().toLowerCase(); if (!q) { sRes.innerHTML = ""; return; }
    const hits = BROWSE.all.filter((x) => (x.title || "").toLowerCase().includes(q) && MEDIA[x.id]).slice(0, 24);
    sRes.innerHTML = hits.map((h, i) => `<button class="th-hit" data-i="${i}"><img loading="lazy" src="${turl(h.id)}" onerror="this.style.visibility='hidden'"><span dir="auto">${esc(h.title)}</span></button>`).join("") || `<p class="th-none">Nothing yet for “${esc(sIn.value)}”</p>`;
    sRes.onclick = (e) => { const b = e.target.closest(".th-hit"); if (!b) return; sBox.hidden = true; playQueue(hits, +b.dataset.i, "video"); };
  }, 180); });

  // ---- bar controls
  const rng = bar.querySelector("#hb-range"), playBtn = bar.querySelector("#hb-play");
  function bind(el) {
    el.addEventListener("timeupdate", () => { if (el !== active) return; rng.value = (el.currentTime / (el.duration || 1)) * 1000 || 0; bar.querySelector("#hb-cur").textContent = fmt(el.currentTime); bar.querySelector("#hb-dur").textContent = fmt(el.duration); });
    el.addEventListener("play", () => { if (el === active) playBtn.textContent = "⏸"; });
    el.addEventListener("pause", () => { if (el === active) playBtn.textContent = "▶"; });
    el.addEventListener("ended", () => { if (el === active) next(); });
  }
  bind(V); bind(A);
  playBtn.onclick = togglePlay;
  bar.querySelector("#hb-next").onclick = next;
  bar.querySelector("#hb-prev").onclick = prev;
  rng.oninput = () => { active.currentTime = (rng.value / 1000) * (active.duration || 0); };
  const flipMode = () => { const t = active.currentTime; const to = mode === "audio" ? "video" : "audio"; mode = to; play(cur, titleOf(cur), to, { theater: thOpen ? undefined : false }); setTimeout(() => { try { active.currentTime = t; } catch {} }, 350); };
  bar.querySelector("#hb-mode").onclick = flipMode;
  th.querySelector("#th-mode").onclick = flipMode;
  bar.querySelector("#hb-close").onclick = () => { active.pause(); bar.hidden = true; document.body.classList.remove("has-bar"); };
  bar.querySelector("#hb-save").onclick = () => toggleSave(cur);
  th.querySelector("#th-save").onclick = () => toggleSave(cur);
  th.querySelector("#th-addpl").onclick = () => addToPlaylist(cur, titleOf(cur));
  function updSave() { const on = LIB.saved.includes(cur); bar.querySelector("#hb-save").textContent = on ? "♥" : "♡"; const t = th.querySelector("#th-save"); t.textContent = on ? "♥" : "♡"; t.classList.toggle("on", on); }

  // ---- media session (lock screen / earbuds)
  function mediaSession(id) {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: titleOf(id), artist: "The Yanuka — hayanuka.life", artwork: [{ src: has(id, "t") ? turl(id) : location.origin + POSTER, sizes: "640x360", type: "image/jpeg" }] });
      navigator.mediaSession.setActionHandler("play", () => active.play());
      navigator.mediaSession.setActionHandler("pause", () => active.pause());
      navigator.mediaSession.setActionHandler("nexttrack", next);
      navigator.mediaSession.setActionHandler("previoustrack", prev);
    } catch {}
  }

  // ---- save / hearts
  function toggleSave(id, title) { if (!id) return; if (title) LIB.titles[id] = title; const i = LIB.saved.indexOf(id); if (i >= 0) LIB.saved.splice(i, 1); else LIB.saved.unshift(id); save(); updSave(); if (!drawer.hidden) renderDrawer(); }
  function paintHearts() { document.querySelectorAll("[data-save]").forEach((b) => { b.textContent = LIB.saved.includes(b.dataset.save) ? "♥" : "♡"; b.classList.toggle("on", LIB.saved.includes(b.dataset.save)); }); const c = document.getElementById("hy-lib-count"); if (c) c.textContent = LIB.saved.length || ""; }

  // ---- drawer
  let tab = "saved";
  function openDrawer() { drawer.hidden = false; renderDrawer(); }
  function card(id) { return `<div class="hd-item"><button class="hd-thumb" data-play="${id}"><img loading="lazy" src="${has(id,"t")?turl(id):POSTER}" onerror="this.src='${POSTER}'"><span>▶</span></button><div class="hd-t">${esc(titleOf(id))}</div><button class="hd-x" data-save="${id}" title="Remove">♥</button></div>`; }
  function renderDrawer() {
    const body = drawer.querySelector("#hd-body"); drawer.querySelectorAll(".hd-tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === tab));
    if (tab === "saved") body.innerHTML = LIB.saved.length ? LIB.saved.map(card).join("") : `<p class="hd-empty">Tap ♡ on any shiur or niggun to save it here.</p>`;
    else if (tab === "queue") body.innerHTML = queue.length ? queue.map((q, i) => `<div class="hd-item ${i === qi ? "now" : ""}"><button class="hd-thumb" data-qi="${i}"><img loading="lazy" src="${has(q.id,"t")?turl(q.id):POSTER}" onerror="this.src='${POSTER}'"><span>▶</span></button><div class="hd-t">${esc(q.title || titleOf(q.id))}</div></div>`).join("") : `<p class="hd-empty">Nothing queued yet.</p>`;
    else body.innerHTML = LIB.playlists.length ? LIB.playlists.map((p, i) => `<div class="hd-pl"><div class="hd-pl-h"><b>${esc(p.name)}</b><span>${p.ids.length}</span><button class="hd-play-pl" data-pl="${i}">▶ Play</button></div><div class="hd-pl-body">${p.ids.slice(0, 30).map(card).join("") || '<p class="hd-empty">Empty — use ＋ on any item.</p>'}</div></div>`).join("") : `<p class="hd-empty">No playlists yet. Make one, then add shiurim with the ＋ button.</p>`;
  }
  drawer.querySelector("#hd-close").onclick = () => (drawer.hidden = true);
  drawer.querySelectorAll(".hd-tab").forEach((t) => (t.onclick = () => { tab = t.dataset.tab; renderDrawer(); }));
  drawer.querySelector("#hd-newpl").onclick = () => { const n = prompt("Name your playlist:"); if (n) { LIB.playlists.unshift({ name: n.slice(0, 60), ids: [] }); save(); tab = "playlists"; renderDrawer(); } };
  drawer.addEventListener("click", (e) => {
    const q = e.target.closest("[data-qi]"); if (q) { qi = +q.dataset.qi; play(queue[qi].id, queue[qi].title, queue[qi].kind); return; }
    const pp = e.target.closest(".hd-play-pl"); if (pp) { const pl = LIB.playlists[+pp.dataset.pl]; playQueue(pl.ids.map((id) => ({ id, title: titleOf(id) })), 0); return; }
    const rm = e.target.closest(".hd-x"); if (rm) { toggleSave(rm.dataset.save); return; }
    const pl = e.target.closest("[data-play]"); if (pl) play(pl.dataset.play, titleOf(pl.dataset.play));
  });

  // add-to-playlist chooser
  function addToPlaylist(id, title) {
    if (title) LIB.titles[id] = title;
    if (!LIB.playlists.length) { const n = prompt("New playlist name:"); if (!n) return; LIB.playlists.unshift({ name: n.slice(0, 60), ids: [] }); }
    const names = LIB.playlists.map((p, i) => `${i + 1}. ${p.name}`).join("\n");
    const pick = prompt(`Add to which playlist?\n${names}\n\n(type the number, or a new name)`);
    if (!pick) return; const idx = parseInt(pick, 10) - 1;
    if (idx >= 0 && LIB.playlists[idx]) { if (!LIB.playlists[idx].ids.includes(id)) LIB.playlists[idx].ids.push(id); }
    else { LIB.playlists.unshift({ name: pick.slice(0, 60), ids: [id] }); }
    save(); toast("Added to playlist");
  }

  function toast(m) { let t = document.getElementById("toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); } t.textContent = m; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 3800); }

  // ---- expose + manifest
  window.HY = {
    play, playQueue, toggleSave, addToPlaylist, openDrawer,
    setMedia(m) { MEDIA = m || {}; paintHearts(); },
    registerBrowse(b) { if (b && b.cats) BROWSE = b; },
    saved: () => LIB.saved.slice(), titleOf,
  };
  fetch(`${CDN}/media-manifest.json`, { cache: "no-cache" }).then((r) => r.ok ? r.json() : {}).then((m) => window.HY.setMedia(m)).catch(() => {});
  requestAnimationFrame(paintHearts);
})();
