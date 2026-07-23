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
    if (!has(id, "v")) return prep(id, "video");
    frame.innerHTML = `<video controls autoplay playsinline preload="metadata" poster="${has(id,"t")?turl(id):POSTER}" style="width:100%;height:100%;background:#000">`
      + `<source src="${vurl(id)}" type="video/mp4"></video>`
      + dlbar(id, title);
    show();
  }
  function openAudio(id, title) {
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

  // ---- delegated clicks
  document.addEventListener("click", (e) => {
    const w = e.target.closest("[data-watch]"); if (w) { openVideo(w.dataset.watch, w.dataset.title); return; }
    const l = e.target.closest("[data-listen]"); if (l) { openAudio(l.dataset.listen, l.dataset.title); return; }
    const dl = e.target.closest("[data-dl]"); if (dl) { e.preventDefault(); download(dl.dataset.dl, dl.dataset.fmt, dl.dataset.title); return; }
    const b = e.target.closest(".dl-btn"); if (b) { const x = b.closest(".dl"); $$(".dl.open").forEach((o) => o !== x && o.classList.remove("open")); x.classList.toggle("open"); return; }
    $$(".dl.open").forEach((o) => o.classList.remove("open"));
  });

  // set thumbnails (data-thumb -> our CDN thumb, fallback poster)
  function paintThumbs(root = document) {
    $$("img[data-thumb]", root).forEach((img) => { const id = img.dataset.thumb; img.src = has(id, "t") ? turl(id) : POSTER; img.onerror = () => { img.onerror = null; img.src = POSTER; }; });
  }

  // ---- full library
  let LIB = [], view = [], shown = 0; const PAGE = 60;
  function card(v) {
    const [id, he, chan] = v;
    return `<article class="li"><button class="li-thumb" data-watch="${id}" data-title="${esc(he)}"><img data-thumb="${id}" alt="" loading="lazy"><span class="play">▸</span></button>`
      + `<div class="li-b"><p class="li-t" dir="auto">${esc(he) || "Shiur"}</p><p class="li-c">${esc(chan)}</p>`
      + `<div class="li-acts"><button class="chip" data-watch="${id}" data-title="${esc(he)}">Watch</button><button class="chip" data-listen="${id}" data-title="${esc(he)}">Listen</button>`
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
  function acard(a) { return `<a class="alon" href="${a.pdf}" target="_blank" rel="noopener"><span class="alon-ic">📜</span><b>${esc(a.en)}</b><small dir="rtl">${esc(a.he)}</small><span class="dl-a">Download PDF ↓ · ${esc(a.year)}</span></a>`; }
  function amore() { $("#alonGrid").insertAdjacentHTML("beforeend", av.slice(as, as + AP).map(acard).join("")); as = Math.min(av.length, as + AP); $("#alonMore").hidden = as >= av.length; }
  function aapply() { const q = $("#alonSearch").value.trim().toLowerCase(); av = AL.filter((a) => !q || (a.en + " " + a.he).toLowerCase().includes(q)); $("#alonGrid").innerHTML = ""; as = 0; amore(); }
  function initAlon() { fetch("/data/alonim.json").then((r) => r.json()).then((d) => { AL = d; aapply(); }); let t; $("#alonSearch").addEventListener("input", () => { clearTimeout(t); t = setTimeout(aapply, 160); }); $("#alonMore").addEventListener("click", amore); }

  // ---- boot: pull the live media manifest from our CDN, then render
  fetch(`${CDN}/media-manifest.json`, { cache: "no-cache" }).then((r) => r.ok ? r.json() : {}).then((m) => { MEDIA = m || {}; }).catch(() => {}).finally(() => {
    counters(); initLib(); initAlon(); paintThumbs();
    const n = Object.keys(MEDIA).length;
    if (n) { const b = $("#readyCount"); if (b) b.textContent = n.toLocaleString("en-US"); }
  });
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
