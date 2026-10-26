"use strict";
/* ===== CANVAS FX (tajruba) =====
   Line saaf hone ke effects ek hi canvas par: sab zarre ek jagah GPU par bante hain, DOM ke hazaron element nahi.
   Default band. Chalane ke liye site kholen:  ?fx=canvas   (yaad rakhta hai)    Wapas purana:  ?fx=dom */
var FX = (function () {
  var on = false;
  try {
    var q = new URLSearchParams(location.search).get("fx");
    if (q === "canvas") localStorage.setItem("ikky_fx", "canvas");
    else if (q === "dom") localStorage.removeItem("ikky_fx");
    on = localStorage.getItem("ikky_fx") === "canvas";
  } catch (e) {}
  var low = (typeof LOW_END !== "undefined") ? LOW_END : false;
  var MAX = low ? 90 : 170, S = 12;      // zarre aur har zarre ke 12 maidan
  var P = new Float32Array(MAX * S), alive = new Uint8Array(MAX), cols = [], colIdx = {};
  var rings = [], cv = null, cx = null, W = 0, H = 0, dpr = 1, running = false, last = 0, sprites = {};
  // maidan: 0 x,1 y,2 vx,3 vy,4 age,5 life,6 size,7 rot,8 vrot,9 delay,10 type(0 spark,1 confetti,2 flash),11 colour
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
  function add(x, y, vx, vy, life, size, type, hex, delay) {
    for (var i = 0; i < MAX; i++) {
      if (alive[i]) continue;
      var o = i * S; alive[i] = 1;
      P[o] = x; P[o + 1] = y; P[o + 2] = vx; P[o + 3] = vy; P[o + 4] = 0; P[o + 5] = life; P[o + 6] = size;
      P[o + 7] = Math.random() * 6.28; P[o + 8] = (Math.random() - 0.5) * 14; P[o + 9] = delay || 0; P[o + 10] = type; P[o + 11] = colorId(hex);
      return;
    }
  }
  function spark(x, y, hex, delay, power) {
    var a = Math.random() * 6.28, sp = (90 + Math.random() * 190) * power;
    add(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 60, 0.45 + Math.random() * 0.4, 7 + Math.random() * 8, 0, hex, delay);
  }
  function confetti(x, y, hex, delay, power) {
    var a = Math.random() * 6.28, sp = (70 + Math.random() * 150) * power;
    add(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 140, 0.8 + Math.random() * 0.5, 5 + Math.random() * 4, 1, hex, delay);
  }
  function burst(dying, lines, comboCount) {
    setup();
    var perCell = lines >= 2 ? 4 : 3; if (low) perCell = 2;
    var useTheme = document.documentElement.getAttribute("data-bstyle") === "classic";
    var rects = dying.map(function (o) { return cellEls[o.r][o.c].getBoundingClientRect(); });
    for (var i = 0; i < dying.length; i++) {
      var o = dying[i], rc = rects[i], x = rc.left + rc.width / 2, y = rc.top + rc.height / 2;
      var h1 = useTheme && o.col ? o.col.c1 : PARTICLE_HEX[(o.col && o.col.idx) || 0];
      var d = (o.d || 0) / 1000 + 0.02;
      add(x, y, 0, 0, 0.32, rc.width * 1.7, 2, h1, d);                     // cell ki chamak
      for (var k = 0; k < perCell; k++) spark(x, y, k % 2 ? "#ffffff" : h1, d, 1);
      if (i % 2 === 0) confetti(x, y, PARTICLE_HEX[Math.floor(Math.random() * 8)], d, 1);
    }
    if (lines >= 2 || comboCount >= 3) {                                    // bara kombo: madhy se dhamaka + chhalle
      var br = boardEl.getBoundingClientRect(), bx = br.left + br.width / 2, by = br.top + br.height / 2;
      for (var m = 0; m < (low ? 14 : 34); m++) { spark(bx, by, PARTICLE_HEX[m % 8], 0.08, 1.9); if (m % 2) confetti(bx, by, PARTICLE_HEX[(m + 3) % 8], 0.08, 1.6); }
      rings.push({ x: bx, y: by, age: -0.08, life: 0.55, r: br.width * 0.75, c: "#ffffff" });
      if (comboCount >= 3) rings.push({ x: bx, y: by, age: -0.2, life: 0.7, r: br.width * 1.0, c: "#ffd93d" });
    }
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
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
      P[o + 3] += (type === 1 ? 430 : 520) * dt; P[o + 2] *= 1 - 1.6 * dt;
      P[o] += P[o + 2] * dt; P[o + 1] += P[o + 3] * dt;
      if (type === 0) {
        var s = P[o + 6] * (1 - f * 0.7); cx.globalAlpha = 1 - f * f;
        cx.drawImage(glow(cols[P[o + 11]]), P[o] - s, P[o + 1] - s, s * 2, s * 2);
      }
    }
    for (i = 0; i < MAX; i++) {                                               // chhalle
      if (!alive[i]) continue; o = i * S;
      if (P[o + 10] !== 1 || P[o + 9] > 0) continue;
      var f2 = P[o + 4] / P[o + 5]; cx.globalAlpha = f2 < 0.6 ? 1 : (1 - f2) / 0.4;
      var r = P[o + 7] += P[o + 8] * dt, z = P[o + 6];
      var cs = Math.cos(r), sn = Math.sin(r); cx.setTransform(cs, sn, -sn, cs, P[o], P[o + 1]); cx.fillStyle = cols[P[o + 11]];
      cx.fillRect(-z / 2, -z / 3, z, z * 0.66);
    }
    cx.setTransform(1, 0, 0, 1, 0, 0);
    for (i = rings.length - 1; i >= 0; i--) {                                 // dhamake ki lehar
      var g = rings[i]; g.age += dt; if (g.age < 0) { n++; continue; }
      if (g.age >= g.life) { rings.splice(i, 1); continue; } n++;
      var q = g.age / g.life, e = 1 - Math.pow(1 - q, 3);
      cx.globalAlpha = (1 - q) * 0.85; cx.strokeStyle = g.c; cx.lineWidth = 6 * (1 - q) + 1;
      cx.beginPath(); cx.arc(g.x, g.y, g.r * e, 0, 6.2832); cx.stroke();
    }
    cx.globalAlpha = 1;
    if (n > 0) requestAnimationFrame(frame);
    else { running = false; cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); }
  }
  if (on) setTimeout(function () {          // pehle se tayyar: pehli line par jhatka na aaye
    try { setup(); PARTICLE_HEX.concat(["#ffffff"]).forEach(glow); } catch (e) {}
  }, 800);
  return { on: function () { return on; }, burst: burst, count: function () { return alive.reduce(function (a, b) { return a + b; }, 0); } };
})();
