/* hayanuka.life — persistent player + personal library (save, playlists, queue).
   Works offline-first via localStorage now; syncs to an account later. No YouTube. */
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

  // ---- DOM: inject player bar + library drawer + toast
  const bar = document.createElement("div"); bar.id = "hy-bar"; bar.hidden = true;
  bar.innerHTML = `
    <div class="hb-media"><video id="hb-video" playsinline preload="metadata"></video><button id="hb-expand" title="Fullscreen">⤢</button></div>
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

  const drawer = document.createElement("aside"); drawer.id = "hy-drawer"; drawer.hidden = true;
  drawer.innerHTML = `<div class="hd-head"><b>My Library</b><button id="hd-close">✕</button></div>
    <div class="hd-tabs"><button class="hd-tab on" data-tab="saved">Saved</button><button class="hd-tab" data-tab="playlists">Playlists</button><button class="hd-tab" data-tab="queue">Queue</button></div>
    <div id="hd-body" class="hd-body"></div>
    <div class="hd-foot"><button id="hd-newpl" class="btn btn-ghost sm">＋ New playlist</button></div>`;
  document.body.appendChild(drawer);

  const V = bar.querySelector("#hb-video");
  const A = new Audio(); A.preload = "metadata";
  let cur = null, mode = "video", queue = [], qi = -1;
  let active = V; // element currently driving playback

  // ---- core play
  function setActive(el) { if (active !== el) { active.pause(); } active = el; }
  function play(id, title, kind) {
    LIB.titles[id] = title || LIB.titles[id] || id; LIB.media[id] = 1; save();
    cur = id; bar.hidden = false; document.body.classList.add("has-bar");
    bar.querySelector("#hb-title").textContent = titleOf(id);
    bar.querySelector("#hb-sub").textContent = mode === "audio" ? "Audio" : "Video";
    updSave();
    const wantAudio = (kind === "audio") || mode === "audio";
    if (wantAudio && has(id, "a")) { mode = "audio"; setActive(A); V.style.display = "none"; A.src = aurl(id); A.play().catch(() => {}); bar.querySelector("#hb-dl").href = aurl(id); }
    else if (has(id, "v")) { mode = "video"; setActive(V); V.style.display = ""; V.poster = has(id, "t") ? turl(id) : POSTER; V.src = vurl(id); V.play().catch(() => {}); bar.querySelector("#hb-dl").href = vurl(id); }
    else if (has(id, "a")) { mode = "audio"; setActive(A); V.style.display = "none"; A.src = aurl(id); A.play().catch(() => {}); bar.querySelector("#hb-dl").href = aurl(id); }
    else { toast("This one is being added to the library — it'll be here shortly."); return; }
    bar.querySelector("#hb-mode").textContent = mode === "audio" ? "🎧" : "🎬";
    bar.querySelector("#hb-sub").textContent = mode === "audio" ? "Audio" : "Video";
  }
  function playQueue(list, start) { queue = list.slice(); qi = start || 0; if (queue[qi]) play(queue[qi].id, queue[qi].title, queue[qi].kind); renderDrawer(); }
  function next() { if (qi >= 0 && qi < queue.length - 1) { qi++; play(queue[qi].id, queue[qi].title, queue[qi].kind); } }
  function prev() { if (active.currentTime > 3) { active.currentTime = 0; return; } if (qi > 0) { qi--; play(queue[qi].id, queue[qi].title, queue[qi].kind); } }

  // ---- bar controls
  const rng = bar.querySelector("#hb-range"), playBtn = bar.querySelector("#hb-play");
  function bind(el) {
    el.addEventListener("timeupdate", () => { if (el !== active) return; rng.value = (el.currentTime / (el.duration || 1)) * 1000 || 0; bar.querySelector("#hb-cur").textContent = fmt(el.currentTime); bar.querySelector("#hb-dur").textContent = fmt(el.duration); });
    el.addEventListener("play", () => { if (el === active) playBtn.textContent = "⏸"; });
    el.addEventListener("pause", () => { if (el === active) playBtn.textContent = "▶"; });
    el.addEventListener("ended", () => { if (el === active) next(); });
  }
  bind(V); bind(A);
  playBtn.onclick = () => { active.paused ? active.play() : active.pause(); };
  bar.querySelector("#hb-next").onclick = next;
  bar.querySelector("#hb-prev").onclick = prev;
  rng.oninput = () => { active.currentTime = (rng.value / 1000) * (active.duration || 0); };
  bar.querySelector("#hb-mode").onclick = () => { mode = mode === "audio" ? "video" : "audio"; const t = active.currentTime; play(cur, titleOf(cur), mode); setTimeout(() => { try { active.currentTime = t; } catch {} }, 300); };
  bar.querySelector("#hb-close").onclick = () => { active.pause(); bar.hidden = true; document.body.classList.remove("has-bar"); };
  bar.querySelector("#hb-expand").onclick = () => { if (V.requestFullscreen && mode === "video") V.requestFullscreen(); };
  bar.querySelector("#hb-save").onclick = () => toggleSave(cur);
  function updSave() { bar.querySelector("#hb-save").textContent = LIB.saved.includes(cur) ? "♥" : "♡"; }

  // ---- save / library
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
    saved: () => LIB.saved.slice(), titleOf,
  };
  fetch(`${CDN}/media-manifest.json`, { cache: "no-cache" }).then((r) => r.ok ? r.json() : {}).then((m) => window.HY.setMedia(m)).catch(() => {});
  requestAnimationFrame(paintHearts);
})();
