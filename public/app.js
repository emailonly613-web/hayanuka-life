/* hayanuka.life — client. Self-hosted media only. Our CDN, our player. Nothing external — our content only. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CDN = "https://hayanuka-media.nyc3.cdn.digitaloceanspaces.com";
  const POSTER = "/img/poster.jpg";
  let MEDIA = {}; // id -> "vat" flags (which formats are on our CDN)

  const vurl = (id) => `${CDN}/video/${id}.mp4`;
  const aurl = (id) => `${CDN}/audio/${id}.mp3`;
  const turl = (id) => `${CDN}/thumb/${id}.jpg`;
  const has = (id, f) => (MEDIA[id] || "").includes(f);
  const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---- animated counters
  function counters() {
    const io = new IntersectionObserver((es) => {
      for (const e of es) { if (!e.isIntersecting) continue; io.unobserve(e.target);
        const end = +e.target.dataset.count, t0 = performance.now(), dur = 1400;
        const tick = (t) => { const p = Math.min(1, (t - t0) / dur); e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString("en-US"); if (p < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
    }, { threshold: .5 });
    $$("[data-count]").forEach((el) => io.observe(el));
  }

  // ---- player modal (self-hosted video OR audio)
  const player = $("#player"), frame = $("#playerFrame");
  function openVideo(id, title) {
    if (window.HY) return window.HY.play(id, title, "video");
    if (!has(id, "v")) return prep(id, "video");
    frame.innerHTML = `<video controls autoplay playsinline preload="metadata" poster="${has(id,"t")?turl(id):POSTER}" style="width:100%;height:100%;background:#000">`
      + `<source src="${vurl(id)}" type="video/mp4"></video>`
      + dlbar(id, title);
    show();
  }
  function openAudio(id, title) {
    if (window.HY) return window.HY.play(id, title, "audio");
    if (!has(id, "a")) return prep(id, "audio");
    frame.innerHTML = `<div class="audio-stage"><img src="${has(id,"t")?turl(id):POSTER}" alt="" onerror="this.src='${POSTER}'"><div class="audio-body"><b>${esc(title || "Shiur")}</b>`
      + `<audio controls autoplay preload="metadata" style="width:100%"><source src="${aurl(id)}" type="audio/mpeg"></audio></div></div>`
      + dlbar(id, title);
    show();
  }
  function dlbar(id, title) {
    const v = has(id, "v") ? `<a class="pbtn" href="${vurl(id)}" download>⬇︎ Download video</a>` : "";
    const a = has(id, "a") ? `<a class="pbtn" href="${aurl(id)}" download>⬇︎ Download audio</a>` : "";
    return `<div class="player-bar"><span>Save it to watch offline, forever —</span>${v}${a}</div>`;
  }
  function show() { player.hidden = false; document.body.style.overflow = "hidden"; }
  function close() { player.hidden = true; frame.innerHTML = ""; document.body.style.overflow = ""; }
  function prep(id, kind) { toast(`This ${kind} is being added to our library — it'll be here shortly.`); }
  $(".player-close").addEventListener("click", close);
  player.addEventListener("click", (e) => { if (e.target === player) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  // ---- toast
  let tt; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 4200); }

  // ---- download
  function download(id, fmt, title) {
    const f = fmt === "audio" ? "a" : "v";
    if (!has(id, f)) return prep(id, fmt);
    const a = document.createElement("a"); a.href = fmt === "audio" ? aurl(id) : vurl(id); a.download = ""; document.body.appendChild(a); a.click(); a.remove();
    toast((fmt === "audio" ? "🎧 Audio" : "🎬 Video") + " downloading — it's yours to keep, offline.");
  }

  // ---- context queue: play from where you tapped — the whole row/grid becomes the swipe feed
  function ctxPlay(btn, kind) {
    const id = btn.dataset.watch || btn.dataset.listen, title = btn.dataset.title;
    if (!window.HY) return kind === "video" ? openVideo(id, title) : openAudio(id, title);
    const scope = btn.closest(".row-scroll, .lib-grid, .nig-grid, .mq, #recentGrid");
    if (scope) {
      const seen = new Set(); const q = []; let start = 0;
      for (const b of scope.querySelectorAll("[data-watch]")) {
        const bid = b.dataset.watch; if (!bid || seen.has(bid)) continue; seen.add(bid);
        if (bid === id) start = q.length;
        q.push({ id: bid, title: b.dataset.title, kind });
      }
      if (q.length > 1) return window.HY.playQueue(q, start, kind);
    }
    window.HY.play(id, title, kind);
  }

  // ---- delegated clicks
  document.addEventListener("click", (e) => {
    const w = e.target.closest("[data-watch]"); if (w) { ctxPlay(w, "video"); return; }
    const l = e.target.closest("[data-listen]"); if (l) { ctxPlay(l, "audio"); return; }
    const dl = e.target.closest("[data-dl]"); if (dl) { e.preventDefault(); download(dl.dataset.dl, dl.dataset.fmt, dl.dataset.title); return; }
    const b = e.target.closest(".dl-btn"); if (b) { const x = b.closest(".dl"); $$(".dl.open").forEach((o) => o !== x && o.classList.remove("open")); x.classList.toggle("open"); return; }
    const sv = e.target.closest("[data-save]"); if (sv && window.HY) { e.preventDefault(); window.HY.toggleSave(sv.dataset.save, sv.dataset.title); return; }
    const ap = e.target.closest("[data-addpl]"); if (ap && window.HY) { e.preventDefault(); window.HY.addToPlaylist(ap.dataset.addpl, ap.dataset.title); return; }
    const lb = e.target.closest("#hy-lib-btn"); if (lb && window.HY) { window.HY.openDrawer(); return; }
    $$(".dl.open").forEach((o) => o.classList.remove("open"));
  });

  // set thumbnails (data-thumb -> our CDN thumb, fallback poster)
  function paintThumbs(root = document) {
    $$("img[data-thumb]", root).forEach((img) => { const id = img.dataset.thumb; img.src = has(id, "t") ? turl(id) : POSTER; img.onerror = () => { img.onerror = null; img.src = POSTER; }; });
  }

  // ---- full library
  let LIB = [], view = [], shown = 0; const PAGE = matchMedia("(max-width:680px)").matches ? 24 : 60;
  function card(v) {
    const [id, he, chan] = v;
    return `<article class="li"><button class="li-thumb" data-watch="${id}" data-title="${esc(he)}"><img data-thumb="${id}" alt="" loading="lazy"><span class="play">▸</span></button>`
      + `<div class="li-b"><p class="li-t" dir="auto">${esc(he) || "Shiur"}</p><p class="li-c">${esc(chan)}</p>`
      + `<div class="li-acts"><button class="chip" data-watch="${id}" data-title="${esc(he)}">Watch</button><button class="chip" data-listen="${id}" data-title="${esc(he)}">Listen</button>`
      + `<button class="heart" data-save="${id}" data-title="${esc(he)}" title="Save">♡</button>`
      + `<button class="chip addpl" data-addpl="${id}" data-title="${esc(he)}" title="Add to playlist">＋</button>`
      + `<div class="dl"><button class="chip dl-btn">↓</button><div class="dl-menu"><a data-dl="${id}" data-fmt="video">🎬 Video</a><a data-dl="${id}" data-fmt="audio">🎧 Audio</a></div></div>`
      + `</div></div></article>`;
  }
  function more() { const g = $("#libGrid"); g.insertAdjacentHTML("beforeend", view.slice(shown, shown + PAGE).map(card).join("")); shown = Math.min(view.length, shown + PAGE); paintThumbs(g); $("#libMore").hidden = shown >= view.length; }
  function apply() { const q = $("#libSearch").value.trim().toLowerCase(), ch = $("#libChannel").value;
    view = LIB.filter((v) => (!ch || v[2] === ch) && (!q || (v[1] || "").toLowerCase().includes(q)));
    $("#libCount").textContent = view.length.toLocaleString("en-US") + " shiurim"; $("#libGrid").innerHTML = ""; shown = 0; more(); }
  function initLib() {
    fetch("/data/library.json").then((r) => r.json()).then((d) => { LIB = d;
      fetch("/data/facets.json").then((r) => r.json()).then((f) => { const s = $("#libChannel"); for (const [n, c] of f.channels) { const o = document.createElement("option"); o.value = n; o.textContent = `${n} (${c})`; s.appendChild(o); } }); apply(); });
    let t; $("#libSearch").addEventListener("input", () => { clearTimeout(t); t = setTimeout(apply, 180); });
    $("#libChannel").addEventListener("change", apply); $("#libMore").addEventListener("click", more);
  }

  // ---- alonim
  let AL = [], av = [], as = 0; const AP = 40;
  function acard(a) { return `<a class="alon" href="${a.pdf}" target="_blank" rel="noopener">`
    + `<span class="alon-cover"><img loading="lazy" src="${CDN}/covers/${a.id}.jpg" alt="" onerror="this.closest('.alon').classList.add('no-cover')"></span>`
    + `<span class="alon-body"><span class="alon-ic">📜</span><b>${esc(a.en)}</b><small dir="rtl">${esc(a.he)}</small><span class="dl-a">Open PDF ↓ · ${esc(a.year)}</span></span></a>`; }
  function amore() { $("#alonGrid").insertAdjacentHTML("beforeend", av.slice(as, as + AP).map(acard).join("")); as = Math.min(av.length, as + AP); $("#alonMore").hidden = as >= av.length; }
  function aapply() { const q = $("#alonSearch").value.trim().toLowerCase(); av = AL.filter((a) => !q || (a.en + " " + a.he).toLowerCase().includes(q)); $("#alonGrid").innerHTML = ""; as = 0; amore(); }
  function initAlon() { fetch("/data/alonim.json").then((r) => r.json()).then((d) => { AL = d; aapply(); }); let t; $("#alonSearch").addEventListener("input", () => { clearTimeout(t); t = setTimeout(aapply, 160); }); $("#alonMore").addEventListener("click", amore); }

  // ---- install: real PWA prompt (Android/desktop) + guided sheet (iOS)
  let defPrompt = null;
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); defPrompt = e;
    const b = $("#installBtn"); if (b) { b.hidden = false; b.onclick = async () => { defPrompt.prompt(); const c = await defPrompt.userChoice; toast(c.outcome === "accepted" ? "Installing — check your home screen ✓" : "Anytime — it's here whenever you want it."); }; }
  });
  addEventListener("appinstalled", () => toast("Installed ✓ — the Yanuka is on your home screen"));
  (function initIos() {
    const btn = $("#iosBtn"), sheet = $("#iosSheet"); if (!btn || !sheet) return;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    if (!isIOS) btn.textContent = "Add to your phone";
    const close = () => { sheet.hidden = true; document.body.style.overflow = ""; };
    btn.onclick = () => {
      if (standalone) return toast("You're already in the app ✓");
      if (!isIOS && defPrompt) { defPrompt.prompt(); return; }
      const note = $("#iosNote");
      if (isIOS) {
        const inSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|GSA|Instagram|FBAN|FBAV/.test(navigator.userAgent);
        note.textContent = inSafari ? "" : "Tip: open hayanuka.life in Safari first — other apps can't add to the Home Screen.";
      } else {
        note.textContent = "On Android: open the browser menu (⋮) and choose “Install app / Add to Home screen.”";
      }
      sheet.hidden = false; document.body.style.overflow = "hidden";
    };
    $("#iosClose").onclick = close;
    sheet.addEventListener("click", (e) => { if (e.target === sheet) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) close(); });
  })();

  // ---- recently added + timely banner (both live from the CDN — zero deploys needed)
  function initRecent() {
    fetch(`${CDN}/recent.json`, { cache: "no-cache" }).then((r) => r.ok ? r.json() : null).then((d) => {
      const g = $("#recentGrid"); if (!g || !d || !d.items) return;
      const items = d.items.filter((x) => MEDIA[x.id]).slice(0, 18);
      g.innerHTML = items.map((x) => card([x.id, x.title, x.channel]).replace('<article class="li">', `<article class="li"><span class="rec-badge">NEW</span>`));
      paintThumbs(g);
    }).catch(() => {});
    fetch(`${CDN}/timely.json`, { cache: "no-cache" }).then((r) => r.ok ? r.json() : null).then((t) => {
      const b = $("#timelyBanner"); if (!b || !t || !t.active) return;
      if (t.until && Date.now() > Date.parse(t.until)) return; // the day passed — filed away
      b.innerHTML = `<div class="wrap tb-in"><span class="tb-ic">🕯</span><div class="tb-t"><b>${esc(t.title)}</b><small>${esc(t.sub || "")}</small></div><button class="btn btn-gold sm" id="tbGo">▸ Watch now</button></div>`;
      b.hidden = false;
      $("#tbGo").onclick = () => { const q = (t.ids || []).filter((id) => MEDIA[id]).map((id) => ({ id, title: (t.titles || {})[id] || "" })); if (q.length && window.HY) window.HY.playQueue(q, 0, "video"); else toast("Uploading now — minutes away."); };
    }).catch(() => {});
  }

  // ---- moments marquee: two auto-scrolling rows of real thumbnails (click to play)
  function buildMarquee() {
    const rows = [$("#mq1"), $("#mq2")]; if (!rows[0]) return;
    const ids = Object.keys(MEDIA).filter((id) => MEDIA[id].includes("t"));
    if (ids.length < 8) return;
    const titles = {}; for (const v of LIB) titles[v[0]] = v[1];
    const pick = ids.slice(0, 36);
    rows.forEach((row, r) => {
      if (!row) return;
      const set = pick.filter((_, i) => i % 2 === r);
      const item = (id) => `<button class="mq-it" data-watch="${id}" data-title="${esc(titles[id] || "")}" aria-label="Play"><img src="${turl(id)}" alt="" loading="lazy" onerror="this.parentNode.remove()"></button>`;
      row.innerHTML = set.map(item).join("") + set.map(item).join(""); // duplicated for the seamless loop
    });
  }

  // ---- boot: pull the live media manifest from our CDN, then render
  fetch(`${CDN}/media-manifest.json`, { cache: "no-cache" }).then((r) => r.ok ? r.json() : {}).then((m) => { MEDIA = m || {}; }).catch(() => {}).finally(() => {
    counters(); initLib(); initAlon(); paintThumbs();
    const n = Object.keys(MEDIA).length;
    if (n) { const b = $("#readyCount"); if (b) b.textContent = n.toLocaleString("en-US"); }
    // marquee needs LIB titles — build once the library json lands (initLib fetch), retry briefly
    let tries = 0; const t = setInterval(() => { if (LIB.length || ++tries > 20) { clearInterval(t); buildMarquee();
      // theater browse data: subject chips + full search index
      fetch("/data/curated.json").then((r) => r.json()).catch(() => []).then((cur) => {
        const cats = {}; for (const v of cur || []) (cats[v.category] ||= []).push({ id: v.id, title: v.he || v.en });
        const all = LIB.map((v) => ({ id: v[0], title: v[1] }));
        if (window.HY) window.HY.registerBrowse({ cats: [{ name: "Everything", items: all }, ...Object.entries(cats).map(([name, items]) => ({ name, items }))], all });
      });
      initRecent();
      // ?play=<id> deep link (from the per-shiur SEO pages)
      const pid = new URLSearchParams(location.search).get("play");
      if (pid && window.HY) { const row = LIB.find((v) => v[0] === pid); window.HY.play(pid, row ? row[1] : pid); }
    } }, 250);
  });
})();

/* ---- FX layer: sticky header state, hero parallax, scroll-lit mission text, 3D card tilt ---- */
(function () {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // header scrolled state
  const head = document.querySelector(".site-head");
  let ticking = false;
  function onScroll() {
    if (head) head.classList.toggle("scrolled", scrollY > 40);
    if (!reduced) {
      const hi = document.getElementById("heroIn"), hv = document.getElementById("heroVeil");
      if (hi && scrollY < innerHeight * 1.2) { hi.style.transform = `translateY(${scrollY * 0.16}px)`; hi.style.opacity = String(Math.max(0, 1 - scrollY / (innerHeight * 0.9))); }
      if (hv && scrollY < innerHeight * 1.2) hv.style.opacity = String(1 + scrollY / innerHeight * 0.4);
    }
    hlPaint();
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // scroll-lit mission text: split words (keeping <b> emphasis), light them up with scroll progress
  const hlEl = document.getElementById("hlText");
  let hlSpans = [];
  if (hlEl) {
    const frag = document.createDocumentFragment();
    for (const node of [...hlEl.childNodes]) {
      const gold = node.nodeName === "B";
      const text = node.textContent;
      for (const w of text.split(/\s+/)) {
        if (!w) continue;
        const s = document.createElement("span"); s.className = "w" + (gold ? " g" : ""); s.textContent = w;
        frag.appendChild(s); frag.appendChild(document.createTextNode(" "));
      }
    }
    hlEl.textContent = ""; hlEl.appendChild(frag);
    hlSpans = [...hlEl.querySelectorAll(".w")];
  }
  function hlPaint() {
    if (!hlSpans.length || reduced) return;
    const r = hlEl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.82 - r.top) / (innerHeight * 0.55)));
    const n = Math.round(p * hlSpans.length);
    for (let i = 0; i < hlSpans.length; i++) hlSpans[i].classList.toggle("lit", i < n);
  }

  // promise cards: staggered 3D pop when they actually enter the screen
  const pcards = document.querySelectorAll(".promise-card");
  if (pcards.length) {
    const po = new IntersectionObserver((es) => { for (const e of es) { if (e.isIntersecting) { e.target.classList.add("pop"); po.unobserve(e.target); } } }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    pcards.forEach((c) => po.observe(c));
    if (reduced) pcards.forEach((c) => c.classList.add("pop"));
  }

  // mobile section nav: scrollspy highlight
  const mnav = document.getElementById("mnav");
  if (mnav) {
    const links = [...mnav.querySelectorAll("a")];
    const secs = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
    const so = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { const id = "#" + e.target.id; links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === id)); }
    }, { rootMargin: "-25% 0px -65% 0px" });
    secs.forEach((s) => so.observe(s));
  }

  // 3D tilt on cards (desktop pointers only)
  if (!reduced && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    document.addEventListener("mousemove", (e) => {
      const c = e.target.closest(".vcard, .promise-card, .soc, .tef");
      document.querySelectorAll(".tilting").forEach((el) => { if (el !== c) { el.classList.remove("tilting"); el.style.transform = ""; } });
      if (!c) return;
      const r = c.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -5, ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
      c.classList.add("tilting");
      c.style.transform = `perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`;
    }, { passive: true });
    document.addEventListener("mouseleave", () => document.querySelectorAll(".tilting").forEach((el) => { el.classList.remove("tilting"); el.style.transform = ""; }), true);
  }

  onScroll();
})();

/* ---- Tefillos swipe viewer ---- */
(function () {
  const v = document.getElementById("tviewer"); if (!v) return;
  fetch(v.dataset.src).then((r) => r.json()).then((d) => {
    const track = document.getElementById("tvTrack"), count = document.getElementById("tvCount");
    for (let i = 1; i <= d.pages; i++) { const im = document.createElement("img"); im.loading = "lazy"; im.alt = "Tefillah page " + i; im.src = `${d.cdn}/page-${String(i).padStart(2, "0")}.jpg`; track.appendChild(im); }
    const upd = () => { const p = Math.round(track.scrollLeft / track.clientWidth) + 1; count.textContent = `${Math.min(p, d.pages)} / ${d.pages}`; };
    track.addEventListener("scroll", () => requestAnimationFrame(upd)); upd();
    v.querySelector(".tv-prev").addEventListener("click", () => track.scrollBy({ left: -track.clientWidth }));
    v.querySelector(".tv-next").addEventListener("click", () => track.scrollBy({ left: track.clientWidth }));
    const dl = document.getElementById("tvDownload"); if (dl) dl.href = d.pdf;
    const pr = document.getElementById("tvPrint"); if (pr) pr.addEventListener("click", () => window.open(d.pdf, "_blank"));
  }).catch(() => { v.style.display = "none"; });
})();
