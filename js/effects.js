"use strict";

function buzz(lines) {
  // Vibration disabled
}

function showCombo(lines, comboCount, gained) {
  var pop = document.createElement("div");
  var tier = (comboCount >= 5 || lines >= 3) ? " t3" : ((comboCount >= 3 || lines >= 2) ? " t2" : "");
  var label = lines >= 3 ? "AMAZING!" : (lines >= 2 ? "MULTI CLEAR!" : "CLEAR!");
  if (comboCount >= 3) label = "COMBO x" + comboCount + "!";
  pop.className = "clear-pop" + tier;
  pop.textContent = label;
  document.body.appendChild(pop);
  setTimeout(function() {
    if (pop.parentNode) pop.parentNode.removeChild(pop);
  }, 650);
}

var PARTICLE_HEX = ["#ff4d4d", "#ff9a2e", "#ffd93d", "#3ddc6a", "#3dd9ff", "#4d7cff", "#b05dff", "#ff4fb8"];
var LOW_END = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 2;
var REDUCE_MOTION = false;
try { REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

// Prevent overlapping clears from creating an unlimited number of DOM particles.
var MAX_ACTIVE_PARTICLES = LOW_END ? 32 : 72;
var activeParticleCount = 0;

/* DOM confetti fallback; Canvas FX is used when enabled. */
function spawnClearParticles(dying, lines, comboCount) {
  if (REDUCE_MOTION || !dying || !dying.length) return;
  if (typeof FX !== "undefined" && FX.on()) {
    FX.burst(dying, lines, comboCount);
    return;
  }

  var remaining = MAX_ACTIVE_PARTICLES - activeParticleCount;
  if (remaining <= 0) return;

  var useTheme = document.documentElement.getAttribute("data-bstyle") === "classic";
  var perCell = lines >= 2 ? 2 : 1;
  var cap = 24 + Math.min(comboCount || 0, 4) * 4;
  if (LOW_END) cap = Math.round(cap * 0.5);

  var extraCombo = (comboCount >= 3 || lines >= 3) ? 8 : 0;
  var totalCap = Math.min(cap + extraCombo, remaining);
  var made = 0;
  var frag = document.createDocumentFragment();
  var madeEls = [];

  function mk(cx, cy, hex, delay, power) {
    if (made >= totalCap) return;
    var p = document.createElement("div");
    p.className = "particle" + (Math.random() > 0.5 ? " round" : "");
    var size = 5 + Math.random() * 6;
    var angle = Math.random() * Math.PI * 2;
    var dist = (28 + Math.random() * 52) * power;

    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.left = cx + "px";
    p.style.top = cy + "px";
    p.style.background = hex;
    p.style.setProperty("--dx", (Math.cos(angle) * dist) + "px");
    p.style.setProperty("--dy", (Math.sin(angle) * dist - 28) + "px");
    p.style.setProperty("--rot", ((Math.random() - 0.5) * 540) + "deg");
    p.style.setProperty("--pd", delay + "ms");

    frag.appendChild(p);
    madeEls.push(p);
    made++;
  }

  // Read all layout positions before creating or appending particle nodes.
  var positions = [];
  for (var i = 0; i < dying.length; i++) {
    var o = dying[i];
    var cellRow = cellEls && cellEls[o.r];
    var cell = cellRow && cellRow[o.c];
    if (!cell) continue;
    var rc = cell.getBoundingClientRect();
    positions.push({
      x: rc.left + rc.width / 2,
      y: rc.top + rc.height / 2,
      color: useTheme && o.col ? o.col.c1 : PARTICLE_HEX[(o.col && o.col.idx) || 0],
      altColor: useTheme && o.col ? o.col.c2 : "#ffffff",
      delay: (o.d || 0) + 40
    });
  }

  for (var j = 0; j < positions.length && made < Math.min(cap, totalCap); j++) {
    var pos = positions[j];
    for (var k = 0; k < perCell && made < Math.min(cap, totalCap); k++) {
      mk(pos.x, pos.y, k % 2 ? pos.altColor : pos.color, pos.delay, 1);
    }
  }

  // Extra center burst for larger combos, within the same global particle budget.
  if (extraCombo && made < totalCap && typeof boardEl !== "undefined" && boardEl) {
    var br = boardEl.getBoundingClientRect();
    var bx = br.left + br.width / 2;
    var by = br.top + br.height / 2;
    for (var m = 0; m < 8 && made < totalCap; m++) {
      mk(bx, by, PARTICLE_HEX[m % 8], 60, 2);
    }
  }

  if (!made) return;
  activeParticleCount += made;
  document.body.appendChild(frag);

  setTimeout(function() {
    for (var n = 0; n < madeEls.length; n++) {
      var el = madeEls[n];
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    activeParticleCount = Math.max(0, activeParticleCount - madeEls.length);
  }, 700);
}

/* Show the score at the approximate center of the cleared cells. */
function showBoardScore(cells, gained, lines) {
  if (!cells || !cells.length) return;

  var sr = 0, sc = 0;
  for (var i = 0; i < cells.length; i++) {
    sr += cells[i][0];
    sc += cells[i][1];
  }

  var mr = Math.round(sr / cells.length);
  var mc = Math.round(sc / cells.length);
  var midEl = cellEls && cellEls[mr] && cellEls[mr][mc];
  if (!midEl) return;

  var rc = midEl.getBoundingClientRect();
  var pop = document.createElement("div");
  var comboActive = (typeof combo !== "undefined" && combo >= 3);
  pop.className = "board-pop" + (lines >= 3 ? " t3" : (lines >= 2 || comboActive ? " t2" : ""));
  pop.textContent = "+" + gained;

  var x = Math.max(60, Math.min(window.innerWidth - 60, rc.left + rc.width / 2));
  pop.style.left = x + "px";
  pop.style.top = (rc.top + rc.height / 2) + "px";
  document.body.appendChild(pop);

  setTimeout(function() {
    if (pop.parentNode) pop.parentNode.removeChild(pop);
  }, 850);
}
