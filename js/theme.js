"use strict";

var STORAGE_THEME = "ikky_blockblast3d_theme";
/* ===== TEMA =====
   Daftar tema: themes/themes.json  ->  [{"id":"wood","name":"Wood"}, ...]   (yang pertama = bawaan)
   Gaya tiap tema: themes/<id>.css  (lihat themes/_template.css)
   Tema baru = 1 file .css + 1 baris di themes.json. Tidak perlu mengubah index.html. */
var DEFAULT_THEMES = [ { id: "wood", name: "Wood" }, { id: "rock", name: "Rock Wall" }, { id: "ice", name: "Ice" } ];
var THEMES = [];
var themeIdx = 0;

function markReady() { document.documentElement.setAttribute("data-ready", "1"); }

function ensureThemeCss(id) {
  var lid = "themecss-" + id;
  var l = document.getElementById(lid);
  if (l) return l;
  l = document.createElement("link");
  l.rel = "stylesheet";
  l.id = lid;
  l.href = "themes/" + id + ".css";
  document.head.appendChild(l);
  return l;
}

function setThemes(list) {
  var ok = list.filter(function(t) { return t && typeof t.id === "string" && /^[a-z0-9_-]+$/i.test(t.id); });
  if (!ok.length) ok = DEFAULT_THEMES;
  THEMES = ok.map(function(t) { return { id: t.id, name: t.name || t.id, blocks: COLORS }; });
  THEMES.forEach(function(t) { ensureThemeCss(t.id); });
  var saved = lsGet(STORAGE_THEME);
  themeIdx = 0;
  for (var ti = 0; ti < THEMES.length; ti++) { if (THEMES[ti].id === saved) themeIdx = ti; }
  applyTheme();
}

function applyTheme() {
  var th = THEMES[themeIdx];
  document.documentElement.setAttribute("data-theme", th.id);
  COLORS = th.blocks;
  try { lsSet(STORAGE_THEME, th.id); } catch (e) {}
  var l = ensureThemeCss(th.id);
  if (l.sheet) { markReady(); }
  else {
    l.addEventListener("load", markReady);
    l.addEventListener("error", markReady);
    setTimeout(markReady, 1200);
  }
}

/* langsung pakai tema bawaan (cepat), lalu timpa dengan themes/themes.json kalau ada */
setThemes(DEFAULT_THEMES);
try {
  fetch("themes/themes.json").then(function(r) { return r.ok ? r.json() : null; }).then(function(list) {
    if (Array.isArray(list) && list.length) setThemes(list);
  }).catch(function() {});
} catch (e) {}

/* ganti warna balok yang sudah ada di papan & tray ke palet tema baru */
function recolorAll() {
  var map = {};
  var old = window.__prevColors || [];
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var g = grid[r][c];
      if (!g) continue;
      var gi = (g.idx || 0) % COLORS.length;
      var nc = { c1: COLORS[gi].c1, c2: COLORS[gi].c2, idx: gi };
      grid[r][c] = nc;
      var el = blockEls[r][c];
      if (el) { el.style.setProperty("--c1", nc.c1);
        el.style.setProperty("--c2", nc.c2); el.setAttribute("data-i", gi); }
    }
  }
  for (var i = 0; i < 3; i++) {
    if (tray[i] && !tray[i].used) var ti2 = (tray[i].color.idx || 0) % COLORS.length;
      tray[i].color = { c1: COLORS[ti2].c1, c2: COLORS[ti2].c2, idx: ti2 };
  }
  renderTray();
}

/* ===== STYLE BLOK (gambar) =====
   Daftar style ada di images/blocks/styles.json  (contoh: ["glossy","gem","stone","crystal"])
   Tiap style = folder images/blocks/<nama>/ berisi 8 gambar: red orange yellow green cyan blue purple pink (.webp)
   "classic" selalu ada di akhir (gaya lama, warna ikut tema). */
var STORAGE_BSTYLE = "ikky_blockblast3d_bstyle";
var BCOLORS = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink"];
var BSTYLES = [];
var bstyleIdx = 0;

function setBlockStyles(list) {
  var ids = list.filter(function(x) { return typeof x === "string" && /^[a-z0-9_-]+$/i.test(x) && x !== "classic"; });
  ids.push("classic");
  BSTYLES = ids.map(function(id) { return { id: id, name: id.charAt(0).toUpperCase() + id.slice(1) }; });
  var css = "";
  ids.forEach(function(id) {
    if (id === "classic") return;
    BCOLORS.forEach(function(c, i) {
      css += 'html[data-bstyle="' + id + '"] .block[data-i="' + i + '"]{background-image:url("images/blocks/' + id + '/' + c + '.webp")}\n';
    });
  });
  var st = document.getElementById("bstyleCss");
  if (!st) { st = document.createElement("style"); st.id = "bstyleCss"; document.head.appendChild(st); }
  st.textContent = css;
  var saved = lsGet(STORAGE_BSTYLE);
  bstyleIdx = 0;
  for (var bi = 0; bi < BSTYLES.length; bi++) { if (BSTYLES[bi].id === saved) bstyleIdx = bi; }
  applyBlockStyle();
}

function applyBlockStyle() {
  var cur = BSTYLES[bstyleIdx];
  document.documentElement.setAttribute("data-bstyle", cur.id);
  var l = document.getElementById("blockStyleLabel");
  if (l) l.textContent = "Blocks: " + cur.name;
  try { lsSet(STORAGE_BSTYLE, cur.id); } catch (e) {}
}

/* langsung pakai daftar bawaan, lalu timpa dengan styles.json kalau ada */
setBlockStyles(["glossy", "gem", "stone", "crystal", "ice"]);
try {
  fetch("images/blocks/styles.json").then(function(r) { return r.ok ? r.json() : null; }).then(function(list) {
    if (Array.isArray(list) && list.length) setBlockStyles(list);
  }).catch(function() {});
} catch (e) {}

document.getElementById("blockStyleBtn").addEventListener("click", function() {
  bstyleIdx = (bstyleIdx + 1) % BSTYLES.length;
  applyBlockStyle();
  showThemeName("BLOCKS: " + BSTYLES[bstyleIdx].name);
});

document.getElementById("themeBtn").addEventListener("click", function() {
  themeIdx = (themeIdx + 1) % THEMES.length;
  applyTheme();
  recolorAll();
  showThemeName(THEMES[themeIdx].name);
});

function showThemeName(name) {
  var pop = document.createElement("div");
  pop.className = "combo-pop";
  pop.textContent = "THEME: " + name;
  document.body.appendChild(pop);
  setTimeout(function() { pop.remove(); }, 620);
}
