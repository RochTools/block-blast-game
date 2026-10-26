"use strict";
/* ===== CANVAS FX: har theme ka apna line-saaf asar =====
   Asar ka naam = theme ki id (data-theme). Naye theme ka asar: neeche FX_PRESETS me ek entry jodein, jis ka naam theme id ho
   (jaise  jungle: {...}). Entry na ho to "default" asar chalta hai. Shakal ke naam: confetti shard leaf diamond chunk splinter.
   mode (safai ka andaz): ripple (jahan rakha wahan se phailta), sweep (baen se daen ek ek karke), explode (phat kar bikharna),
                         wave (ek ke baad ek uchhal kar ghaib), drop (tukre ho kar neeche girna), lightning (bijli ki lakeer, bolt: [rang, mag]).
   (purani tafseel)
   Line saaf hone ke effects ek hi canvas par: sab zarre ek jagah GPU par bante hain, DOM ke hazaron element nahi.
   TAJRUBE ke liye abhi DEFAULT CHALU hai.  Wapas purana:  ?fx=dom   (ya is file me `!== "dom"` ko `=== "canvas"` kar den) */
var FX = (function () {
  var on = false;
  try {
    var q = new URLSearchParams(location.search).get("fx");
    if (q === "canvas") localStorage.setItem("ikky_fx", "canvas");
    else if (q === "dom") localStorage.setItem("ikky_fx", "dom");
    on = localStorage.getItem("ikky_fx") !== "dom";
  } catch (e) {}
  var low = (typeof LOW_END !== "undefined") ? LOW_END : false;
  var MAX = low ? 90 : 170, S = 14;      // zarre aur har zarre ke 12 maidan
  var P = new Float32Array(MAX * S), alive = new Uint8Array(MAX), cols = [], colIdx = {};
  var rings = [], cv = null, cx = null, W = 0, H = 0, dpr = 1, running = false, last = 0, sprites = {};
  // maidan: 0 x,1 y,2 vx,3 vy,4 age,5 life,6 size,7 rot,8 vrot,9 delay,10 type(0 spark,2 flash,1.. shakal),11 colour,12 gravity,13 sway
  var T = { confetti: 1, shard: 3, leaf: 4, diamond: 5, chunk: 6, splinter: 7 };
  var POLY = {   // shakal ke nuqte (ikai size me)
    3: [[0, -1.2], [0.55, 0.7], [-0.45, 0.5]],
    4: [[0, -1], [0.55, -0.3], [0.5, 0.4], [0, 1], [-0.5, 0.4], [-0.55, -0.3]],
    5: [[0, -1], [0.7, 0], [0, 1], [-0.7, 0]],
    6: [[-0.8, -0.5], [0.2, -0.9], [0.9, -0.2], [0.6, 0.8], [-0.6, 0.7]],
    7: [[-1.5, -0.25], [1.5, -0.12], [1.5, 0.2], [-1.5, 0.25]]
  };
  var FX_PRESETS = {
    "default": { mode: "ripple", bolt: ["#7cc8f5", "#ffffff"], shape: "confetti", colors: null, n: 1, speed: [70, 220], lift: 140, grav: 430, size: [5, 9], life: [0.8, 1.3], ring: ["#ffffff", "#ffd93d"] },
    ice:      { mode: "explode", shape: "shard", colors: ["#f2fbff", "#bfe9ff", "#7cc8f5", "#ffffff"], n: 3, speed: [130, 320], lift: 120, grav: 780, size: [6, 12], life: [0.7, 1.1], ring: ["#eaf8ff", "#8ed4ff"] },
    jungle:   { mode: "wave", shape: "leaf", colors: ["#5fcf4a", "#3fae3a", "#8be36a", "#2e8b57", "#c9e86a"], n: 3, speed: [60, 180], lift: 70, grav: 150, sway: 55, size: [7, 12], life: [1.1, 1.7], ring: ["#d9ff9a", "#ffffff"] },
    rock:     { mode: "drop", shape: "chunk", colors: ["#9a9288", "#7b746b", "#b8afa3", "#5d5750"], n: 3, speed: [90, 240], lift: 90, grav: 820, size: [5, 10], life: [0.7, 1.0], ring: ["#d6cfc2", "#a39a8c"] },
    wood:     { mode: "sweep", shape: "splinter", colors: ["#c68b52", "#a06832", "#e0a96c", "#7a4418"], n: 3, speed: [100, 260], lift: 110, grav: 650, size: [5, 9], life: [0.7, 1.1], ring: ["#ffe08a", "#ffffff"] },
    emerald:  { mode: "ripple", shape: "diamond", colors: ["#3ddc84", "#8bf0b0", "#2ab56a", "#5ff0a0", "#ffffff"], n: 3, speed: [90, 250], lift: 130, grav: 380, size: [5, 10], life: [0.8, 1.3], ring: ["#b8ffd6", "#ffffff"] },
    amethyst: { mode: "lightning", bolt: ["#b05dff", "#ecd0ff"], shape: "diamond", colors: ["#b05dff", "#d9a8ff", "#8a3fe0", "#c27bff", "#ffffff"], n: 3, speed: [90, 250], lift: 130, grav: 380, size: [5, 10], life: [0.8, 1.3], ring: ["#ecd0ff", "#ffffff"] }
  };
  var st = document.createElement("style");   // har andaz ki animation yahin se, style.css badalni nahi padti
  st.textContent =
    ".block.clearing.cl-sweep{animation:clSweep .3s ease-in var(--d,0ms) both}" +
    "@keyframes clSweep{0%{transform:scale(1);opacity:1}35%{transform:translateX(-5px) scale(1.08)}100%{transform:translateX(-22px) scale(.15);opacity:0}}" +
    ".block.clearing.cl-explode{animation:clExplode .55s cubic-bezier(.1,.8,.3,1) var(--d,0ms) both}" +
    "@keyframes clExplode{0%{transform:scale(1);opacity:1}12%{transform:scale(1.2)}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--rot)) scale(.25);opacity:0}}" +
    ".block.clearing.cl-drop{animation:clDrop .6s cubic-bezier(.55,0,.9,.6) var(--d,0ms) both}" +
    "@keyframes clDrop{0%{transform:translateY(0);opacity:1}15%{transform:translateY(-5px) scale(1.06)}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--rot));opacity:0}}" +
    ".block.clearing.cl-wave{animation:clWave .45s ease-out var(--d,0ms) both}" +
    "@keyframes clWave{0%{transform:scale(1);opacity:1}30%{transform:translateY(-14px) scale(1.18)}60%{transform:translateY(-4px) scale(1.1)}100%{transform:translateY(0) scale(0);opacity:0}}" +
    ".block.clearing.cl-lightning{animation:clZap .34s linear var(--d,0ms) both}" +
    "@keyframes clZap{0%{transform:scale(1.1);opacity:1}25%{opacity:.2}45%{transform:scale(1.22);opacity:1}70%{opacity:.4}100%{transform:scale(.4);opacity:0}}";
  document.head.appendChild(st);
  var curRows = [], curCols = [];
  function pos(r, c) {                         // khana apni line me kahan hai (baen se / upar se)
    var inR = curRows.indexOf(r) >= 0, inC = curCols.indexOf(c) >= 0;
    return inR && inC ? Math.min(r, c) : (inR ? c : r);
  }
  function mode() { return on ? (preset().mode || "ripple") : "ripple"; }
  function delay(m, r, c) {
    var d = 0;
    if (m === "sweep") d = pos(r, c) * 40;
    else if (m === "wave") d = pos(r, c) * 50;
    else if (m === "lightning") d = 50 + pos(r, c) * 20;
    else if (m === "explode") d = Math.random() * 60;
    else if (m === "drop") d = Math.random() * 140;
    return Math.min(Math.round(d), 330);
  }
  function vec(m, r, c, lp) {                   // udne ka rukh (explode / drop)
    var rot = (Math.random() - 0.5) * 500;
    if (m === "drop") return { dx: (Math.random() - 0.5) * 30, dy: 110 + Math.random() * 70, rot: rot * 0.15 };
    var a = Math.atan2(r - lp.r, c - lp.c); if (r === lp.r && c === lp.c) a = Math.random() * 6.28;
    var dist = 70 + Math.random() * 90;
    return { dx: Math.cos(a) * dist, dy: Math.sin(a) * dist - 20, rot: rot };
  }
  function preset() {
    var id = document.documentElement.getAttribute("data-theme");
    return FX_PRESETS[id] || FX_PRESETS["default"];
  }
  function rnd(a) { return a[0] + Math.random() * (a[1] - a[0]); }
  function colorId(hex) {
    var k = colIdx[hex]; if (k !== undefined) return k;
    cols.push(hex); colIdx[hex] = cols.length - 1; return colIdx[hex];
  }
  function glow(hex) {                      // roshni ka gola, ek baar bana kar dobara istemal
    var s = sprites[hex]; if (s) return s;
    s = document.createElement("canvas"); s.width = s.height = 48;
    var g = s.getContext("2d"), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, "#fff"); gr.addColorStop(0.25, hex); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
    sprites[hex] = s; return s;
  }
  function setup() {
    if (cv) return;
    cv = document.createElement("canvas");
    cv.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:35";
    document.body.appendChild(cv); cx = cv.getContext("2d");
    resize(); window.addEventListener("resize", resize);
  }
  function resize() {
    dpr = 1; // zarre narm hain, hi-res ki zaroorat nahi; canvas chhota = tez
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  function add(x, y, vx, vy, life, size, type, hex, delay, grav, sway) {
    for (var i = 0; i < MAX; i++) {
      if (alive[i]) continue;
      var o = i * S; alive[i] = 1;
      P[o] = x; P[o + 1] = y; P[o + 2] = vx; P[o + 3] = vy; P[o + 4] = 0; P[o + 5] = life; P[o + 6] = size;
      P[o + 7] = Math.random() * 6.28; P[o + 8] = (Math.random() - 0.5) * 14; P[o + 9] = delay || 0; P[o + 10] = type; P[o + 11] = colorId(hex);
      P[o + 12] = grav || 0; P[o + 13] = sway || 0;
      return;
    }
  }
  function spark(x, y, hex, delay, power) {
    var a = Math.random() * 6.28, sp = (90 + Math.random() * 190) * power;
    add(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 60, 0.45 + Math.random() * 0.4, 7 + Math.random() * 8, 0, hex, delay, 520);
  }
  function piece(x, y, pr, hex, delay, power) {       // theme ki shakal ka tukra
    var a = Math.random() * 6.28, sp = rnd(pr.speed) * power;
    var col = pr.colors ? pr.colors[Math.floor(Math.random() * pr.colors.length)] : PARTICLE_HEX[Math.floor(Math.random() * 8)];
    add(x, y, Math.cos(a) * sp, Math.sin(a) * sp - pr.lift, rnd(pr.life), rnd(pr.size), T[pr.shape] || 1, col, delay, pr.grav, pr.sway);
  }
  function burst(dying, lines, comboCount) {
    setup();
    var pr = preset(), perCell = lines >= 2 ? 3 : 2; if (low) perCell = 1;
    var nPiece = low ? Math.max(1, pr.n - 1) : pr.n;
    var useTheme = document.documentElement.getAttribute("data-bstyle") === "classic";
    var rects = dying.map(function (o) { return cellEls[o.r][o.c].getBoundingClientRect(); });
    for (var i = 0; i < dying.length; i++) {
      var o = dying[i], rc = rects[i], x = rc.left + rc.width / 2, y = rc.top + rc.height / 2;
      var h1 = useTheme && o.col ? o.col.c1 : PARTICLE_HEX[(o.col && o.col.idx) || 0];
      var d = (o.d || 0) / 1000 + 0.02;
      add(x, y, 0, 0, 0.32, rc.width * 1.7, 2, h1, d);                     // cell ki chamak
      for (var k = 0; k < perCell; k++) spark(x, y, k % 2 ? "#ffffff" : h1, d, 1);
      for (var q = 0; q < nPiece; q++) if (q === 0 || i % 2 === 0) piece(x, y, pr, h1, d, 1);
    }
    if (lines >= 2 || comboCount >= 3) {                                    // bara kombo: madhy se dhamaka + chhalle
      var br = boardEl.getBoundingClientRect(), bx = br.left + br.width / 2, by = br.top + br.height / 2;
      for (var m = 0; m < (low ? 14 : 30); m++) { spark(bx, by, PARTICLE_HEX[m % 8], 0.08, 1.9); if (m % 2) piece(bx, by, pr, PARTICLE_HEX[m % 8], 0.08, 1.7); }
      rings.push({ x: bx, y: by, age: -0.08, life: 0.55, r: br.width * 0.75, c: pr.ring[0] });
      if (comboCount >= 3) rings.push({ x: bx, y: by, age: -0.2, life: 0.7, r: br.width * 1.0, c: pr.ring[1] });
    }
    if (mode() === "lightning") {
      var lc = pr.bolt || ["#7cc8f5", "#ffffff"], len = dying.length ? cellEls[0][0].getBoundingClientRect().width : 40;
      curRows.forEach(function (rr) { addBolt(cellEls[rr][0], cellEls[rr][SIZE - 1], lc, len); });
      curCols.forEach(function (cc) { addBolt(cellEls[0][cc], cellEls[SIZE - 1][cc], lc, len); });
    }
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
  }
  var bolts = [];
  function addBolt(a, b, lc, w) {
    var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    var x0 = ra.left + ra.width / 2, y0 = ra.top + ra.height / 2, x1 = rb.left + rb.width / 2, y1 = rb.top + rb.height / 2;
    var g = { x0: x0, y0: y0, x1: x1, y1: y1, w: w, c: lc, age: 0, life: 0.5, regen: 0, pts: null };
    bolts.push(g);
    for (var k = 0; k < (low ? 3 : 7); k++) {      // bijli ke saath chingariyan
      var t = Math.random(); spark(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, lc[1], 0.05 + t * 0.25, 0.8);
    }
  }
  function boltPts(g) {                              // tedhi-medhi lakeer ke nuqte
    var n = 11, pts = [], dx = g.x1 - g.x0, dy = g.y1 - g.y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    for (var i = 0; i <= n; i++) {
      var t = i / n, j = (i === 0 || i === n) ? 0 : (Math.random() - 0.5) * g.w * 1.1;
      pts.push([g.x0 + dx * t + nx * j, g.y0 + dy * t + ny * j]);
    }
    return pts;
  }
  function drawBolts(dt) {
    for (var i = bolts.length - 1; i >= 0; i--) {
      var g = bolts[i]; g.age += dt;
      if (g.age >= g.life) { bolts.splice(i, 1); continue; }
      g.regen -= dt; if (!g.pts || g.regen <= 0) { g.pts = boltPts(g); g.regen = 0.05; }
      var q = g.age / g.life, show = Math.max(2, Math.ceil(g.pts.length * Math.min(1, g.age / 0.1)));
      var al = (1 - q * q) * (0.7 + Math.random() * 0.3);
      cx.lineJoin = "round"; cx.lineCap = "round";
      for (var pass = 0; pass < 3; pass++) {
        cx.globalAlpha = Math.min(1, al * (pass === 0 ? 0.45 : (pass === 1 ? 0.9 : 1.2)));
        cx.strokeStyle = pass === 2 ? "#ffffff" : (pass === 1 ? g.c[1] : g.c[0]);
        cx.lineWidth = pass === 0 ? 24 : (pass === 1 ? 10 : 3.5);
        cx.beginPath(); cx.moveTo(g.pts[0][0], g.pts[0][1]);
        for (var k = 1; k < show; k++) cx.lineTo(g.pts[k][0], g.pts[k][1]);
        cx.stroke();
      }
    }
  }
  function frame(t) {
    var dt = Math.min((t - last) / 1000, 0.05); last = t;
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = 0, i, o;
        for (i = 0; i < MAX; i++) {
      if (!alive[i]) continue; o = i * S; n++;
      if (P[o + 9] > 0) { P[o + 9] -= dt; continue; }
      P[o + 4] += dt; var age = P[o + 4], life = P[o + 5];
      if (age >= life) { alive[i] = 0; continue; }
      var f = age / life, type = P[o + 10];
      if (type === 2) {                                                       // chamak: failti hui roshni
        var sz = P[o + 6] * (0.6 + f * 0.9); cx.globalAlpha = (1 - f) * 0.9;
        cx.drawImage(glow(cols[P[o + 11]]), P[o] - sz, P[o + 1] - sz, sz * 2, sz * 2);
        continue;
      }
      P[o + 3] += P[o + 12] * dt; P[o + 2] *= 1 - 1.6 * dt;
      P[o] += P[o + 2] * dt + (P[o + 13] ? Math.sin(age * 7 + P[o + 7]) * P[o + 13] * dt : 0); P[o + 1] += P[o + 3] * dt;
      if (type === 0) {
        var s = P[o + 6] * (1 - f * 0.7); cx.globalAlpha = 1 - f * f;
        cx.drawImage(glow(cols[P[o + 11]]), P[o] - s, P[o + 1] - s, s * 2, s * 2);
      }
    }
    for (i = 0; i < MAX; i++) {                                               // theme ki shakalein
      if (!alive[i]) continue; o = i * S;
      var ty = P[o + 10]; if (ty < 1 || ty === 2 || P[o + 9] > 0) continue;
      var f2 = P[o + 4] / P[o + 5]; cx.globalAlpha = f2 < 0.6 ? 1 : (1 - f2) / 0.4;
      var r = P[o + 7] += P[o + 8] * dt, z = P[o + 6], cs = Math.cos(r) * z, sn = Math.sin(r) * z;
      cx.setTransform(cs, sn, -sn, cs, P[o], P[o + 1]); cx.fillStyle = cols[P[o + 11]];
      if (ty === 1) { cx.fillRect(-0.5, -0.33, 1, 0.66); continue; }
      var pl = POLY[ty]; cx.beginPath(); cx.moveTo(pl[0][0], pl[0][1]);
      for (var v = 1; v < pl.length; v++) cx.lineTo(pl[v][0], pl[v][1]);
      cx.closePath(); cx.fill();
      cx.lineWidth = 0.12; cx.strokeStyle = (ty === 6 || ty === 7) ? "rgba(0,0,0,.3)" : "rgba(255,255,255,.7)"; cx.stroke();
    }
    cx.setTransform(1, 0, 0, 1, 0, 0);
    for (i = rings.length - 1; i >= 0; i--) {                                 // dhamake ki lehar
      var g = rings[i]; g.age += dt; if (g.age < 0) { n++; continue; }
      if (g.age >= g.life) { rings.splice(i, 1); continue; } n++;
      var q = g.age / g.life, e = 1 - Math.pow(1 - q, 3);
      cx.globalAlpha = (1 - q) * 0.85; cx.strokeStyle = g.c; cx.lineWidth = 6 * (1 - q) + 1;
      cx.beginPath(); cx.arc(g.x, g.y, g.r * e, 0, 6.2832); cx.stroke();
    }
    drawBolts(dt); n += bolts.length;
    cx.globalAlpha = 1;
    if (n > 0) requestAnimationFrame(frame);
    else { running = false; cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); }
  }
  if (on) setTimeout(function () {          // pehle se tayyar: pehli line par jhatka na aaye
    try { setup(); PARTICLE_HEX.concat(["#ffffff"]).forEach(glow); } catch (e) {}
  }, 800);
  return { on: function () { return on; }, burst: burst, mode: mode, delay: delay, vec: vec,
    begin: function (rows, cols) { curRows = rows; curCols = cols; }, count: function () { return alive.reduce(function (a, b) { return a + b; }, 0); } };
})();
