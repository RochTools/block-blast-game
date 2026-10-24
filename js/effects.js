"use strict";

function buzz(lines) {
  try { if (navigator.vibrate) navigator.vibrate(lines >= 2 ? [25, 35, 45] : 18); } catch (e) {}
}

function showCombo(lines, comboCount, gained) {
  var pop = document.createElement("div");
  var tier = (comboCount >= 5 || lines >= 3) ? " t3" : ((comboCount >= 3 || lines >= 2) ? " t2" : "");
  pop.className = "clear-pop" + tier;
  var label = lines >= 3 ? "AMAZING!" : (lines >= 2 ? "MULTI CLEAR!" : "CLEAR!");
  if (comboCount >= 3) label = "COMBO x" + comboCount + "!";
  pop.innerHTML = label + "<small>+" + gained + "</small>";
  document.body.appendChild(pop);
  setTimeout(function() { pop.remove(); }, 950);
}

var PARTICLE_HEX = ["#ff4d4d", "#ff9a2e", "#ffd93d", "#3ddc6a", "#3dd9ff", "#4d7cff", "#b05dff", "#ff4fb8"];
var REDUCE_MOTION = false;
try { REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

/* partikel konfeti: warna ikut warna balok, jumlah dibatasi supaya HP murah tetap lancar */
function spawnClearParticles(dying, lines, comboCount) {
  if (REDUCE_MOTION || !dying.length) return;
  var useTheme = document.documentElement.getAttribute("data-bstyle") === "classic";
  var perCell = lines >= 2 ? 3 : 2;
  var cap = 44 + Math.min(comboCount, 5) * 6;
  var made = 0;
  var frag = document.createDocumentFragment();
  var made_els = [];
  function mk(cx, cy, hex, delay, power) {
    var p = document.createElement("div");
    p.className = "particle" + (Math.random() > 0.5 ? " round" : "");
    var size = 5 + Math.random() * 6;
    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.left = cx + "px";
    p.style.top = cy + "px";
    p.style.background = hex;
    var angle = Math.random() * Math.PI * 2;
    var dist = (28 + Math.random() * 52) * power;
    p.style.setProperty("--dx", (Math.cos(angle) * dist) + "px");
    p.style.setProperty("--dy", (Math.sin(angle) * dist - 28) + "px");
    p.style.setProperty("--rot", ((Math.random() - 0.5) * 540) + "deg");
    p.style.setProperty("--pd", delay + "ms");
    frag.appendChild(p);
    made_els.push(p);
  }
  /* baca semua posisi sel dulu (satu kali), baru tulis DOM */
  var rects = dying.map(function(o) { return cellEls[o.r][o.c].getBoundingClientRect(); });
  for (var i = 0; i < dying.length && made < cap; i++) {
    var o = dying[i], rc = rects[i];
    var cx = rc.left + rc.width / 2, cy = rc.top + rc.height / 2;
    var hex1 = useTheme && o.col ? o.col.c1 : PARTICLE_HEX[(o.col && o.col.idx) || 0];
    var hex2 = useTheme && o.col ? o.col.c2 : "#ffffff";
    for (var k = 0; k < perCell && made < cap; k++, made++) {
      mk(cx, cy, k % 2 ? hex2 : hex1, o.d + 40, 1);
    }
  }
  /* kombo besar: semburan konfeti tambahan dari tengah papan */
  if (comboCount >= 3 || lines >= 3) {
    var br = boardEl.getBoundingClientRect();
    var bx = br.left + br.width / 2, by = br.top + br.height / 2;
    for (var m = 0; m < 14; m++) {
      mk(bx, by, PARTICLE_HEX[m % 8], 60, 2.4);
    }
  }
  document.body.appendChild(frag);
  setTimeout(function() { made_els.forEach(function(el) { el.remove(); }); }, 1300);
}
