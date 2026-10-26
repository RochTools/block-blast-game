"use strict";

var STORAGE_THEME = "ikky_blockblast3d_theme";
/* ===== TEMA =====
   Daftar tema: themes/themes.json  ->  [{"id":"wood","name":"Wood"}, ...]   (yang pertama = bawaan)
   Gaya tiap tema: themes/<id>.css  (lihat themes/_template.css)
   Tema baru = 1 file .css + 1 baris di themes.json. Tidak perlu mengubah index.html. */
var DEFAULT_THEMES = [
  { id: "wood", name: "Wood" },
  { id: "rock", name: "Rock Wall" },
  { id: "ice", name: "Ice" },
  { id: "emerald", name: "Emerald" },
  { id: "amethyst", name: "Amethyst Crystal" }
];
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
  THEMES = ok.map(function(t) { return { id: t.id, name: t.name || t.id, bstyle: (typeof t.bstyle === "string" ? t.bstyle : ""), blocks: COLORS }; });
  var saved = lsGet(STORAGE_THEME);
  themeIdx = 0;
  for (var ti = 0; ti < THEMES.length; ti++) { if (THEMES[ti].id === saved) themeIdx = ti; }
  applyTheme();
}

/* sirf mojooda theme ki CSS lagti hai; naye theme par pehle CSS aati hai phir tabdeeli (jhalak nahi) */
var themeSeq = 0;
function applyTheme() {
  var th = THEMES[themeIdx];
  COLORS = th.blocks;
  try { lsSet(STORAGE_THEME, th.id); } catch (e) {}
  var seq = ++themeSeq;
  var l = ensureThemeCss(th.id);
  function commit() {
    if (seq !== themeSeq) return; // tez tez badalne par sirf aakhri jeete
    document.documentElement.setAttribute("data-theme", th.id);
    markReady();
  }
  if (l.sheet || l.getAttribute("data-done")) { commit(); return; }
  l.addEventListener("load", function() { l.setAttribute("data-done", "1"); commit(); }, { once: true });
  l.addEventListener("error", commit, { once: true });
  setTimeout(commit, 1200);
}

/* langsung pakai tema bawaan (cepat), lalu timpa dengan themes/themes.json kalau ada.
   Khiladi ki chuni hui theme bhi shuru ki list me shamil hoti hai, warna ye pehle wood laga kar
   saved theme ko overwrite kar deta tha (emerald/amethyst har reload par wood ban jate the). */
var _savedTheme = lsGet(STORAGE_THEME);
var _initialThemes = DEFAULT_THEMES.slice();
if (_savedTheme && /^[a-z0-9_-]+$/i.test(_savedTheme) && !_initialThemes.some(function(t) { return t.id === _savedTheme; })) {
  _initialThemes.push({ id: _savedTheme, name: _savedTheme });
}
setThemes(_initialThemes);
try {
  fetch("themes/themes.json").then(function(r) { return r.ok ? r.json() : null; }).then(function(list) {
    if (!Array.isArray(list) || !list.length) return;
    var same = JSON.stringify(list.map(function(t) { return t && t.id; })) === JSON.stringify(THEMES.map(function(t) { return t.id; }));
    if (!same) setThemes(list);
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
    var tp = tray[i];
    if (!tp || tp.used || !tp.color) continue; // khali / istemal ho chuka slot chhor do (yahi 'reading c1' error tha)
    var ti2 = (tp.color.idx || 0) % COLORS.length;
    tp.color = { c1: COLORS[ti2].c1, c2: COLORS[ti2].c2, idx: ti2 };
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
  applyBlockStyle(true); // shuru me save nahi karte, warna chuni hui style (parrot/bevel) overwrite ho jati thi
  if (!saved && THEMES.length) themeBlockStyle(THEMES[themeIdx]); // naye khiladi ko theme ki apni style
}

/* har theme ki apni block style: themes.json -> {"id":"jungle","name":"Jungle","bstyle":"parrot"}
   Theme badalne par (button ya Auto Theme) ye style lag jati hai; khiladi Blocks button se phir bhi badal sakta hai. */
function themeBlockStyle(th) {
  if (!th || !th.bstyle || !BSTYLES.length) return;
  for (var bj = 0; bj < BSTYLES.length; bj++) {
    if (BSTYLES[bj].id === th.bstyle) { bstyleIdx = bj; applyBlockStyle(); return; }
  }
}

function applyBlockStyle(noSave) {
  var cur = BSTYLES[bstyleIdx];
  document.documentElement.setAttribute("data-bstyle", cur.id);
  var l = document.getElementById("blockStyleLabel");
  if (l) l.textContent = "Blocks: " + cur.name;
  if (!noSave) { try { lsSet(STORAGE_BSTYLE, cur.id); } catch (e) {} }
}

/* langsung pakai daftar bawaan, lalu timpa dengan styles.json kalau ada */
var _initialBStyles = ["glossy", "gem", "stone", "crystal", "ice"];
var _savedB = lsGet(STORAGE_BSTYLE);
if (_savedB && /^[a-z0-9_-]+$/i.test(_savedB) && _savedB !== "classic" && _initialBStyles.indexOf(_savedB) < 0) _initialBStyles.push(_savedB);
setBlockStyles(_initialBStyles);
try {
  fetch("images/blocks/styles.json").then(function(r) { return r.ok ? r.json() : null; }).then(function(list) {
    if (!Array.isArray(list) || !list.length) return;
    var cur = BSTYLES.filter(function(s) { return s.id !== "classic"; }).map(function(s) { return s.id; });
    if (JSON.stringify(list) !== JSON.stringify(cur)) setBlockStyles(list); // wahi list ho to dobara na lagao
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
  themeBlockStyle(THEMES[themeIdx]);
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

/* ===== AUTO THEME (menu me Off/On, default Off) =====
   On ho to har AUTO_THEME_LINES lines saaf karne par agli theme lag jati hai
   (chaal aur animation khatam hone ke baad, beech me nahi). */
var STORAGE_AUTOTHEME = "ikky_blockblast3d_autotheme";
var AUTO_THEME_LINES = 10;
var autoTheme = lsGet(STORAGE_AUTOTHEME) === "1";
var autoThemeLines = 0;

function updateAutoThemeLabel() {
  var l = document.getElementById("autoThemeLabel");
  if (l) l.textContent = "Auto Theme: " + (autoTheme ? "On" : "Off");
}

function autoThemeReset() { autoThemeLines = 0; }

function autoThemeCheck(clearedLines) {
  if (!autoTheme || THEMES.length < 2) return;
  autoThemeLines += clearedLines;
  if (autoThemeLines < AUTO_THEME_LINES) return;
  autoThemeLines = 0;
  setTimeout(function tryApply() {
    if (isGameOver) return;
    if (dragState) { setTimeout(tryApply, 300); return; } // kheench rahe ho to intezar
    themeIdx = (themeIdx + 1) % THEMES.length;
    applyTheme();
    themeBlockStyle(THEMES[themeIdx]);
    recolorAll();
    showThemeName(THEMES[themeIdx].name);
  }, 900);
}

document.getElementById("autoThemeBtn").addEventListener("click", function() {
  autoTheme = !autoTheme;
  autoThemeLines = 0;
  lsSet(STORAGE_AUTOTHEME, autoTheme ? "1" : "0");
  updateAutoThemeLabel();
});
updateAutoThemeLabel();
