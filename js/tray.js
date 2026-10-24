"use strict";

/* =========================================================
   PEMILIHAN BALOK PINTAR (adil, bukan sengaja menjebak pemain)
   - tiga balok selalu bisa ditaruh semuanya (ada urutan yang berhasil)
   - makin penuh papan, makin sering balok kecil muncul
   - saat papan hampir penuh, minimal satu balok bisa menghapus baris
   - tetap acak, tidak selalu balok yang sama
========================================================= */
var SMART_TRAY = true;

function gridRows() {
  var rows = [];
  for (var r = 0; r < SIZE; r++) {
    var m = 0;
    for (var c = 0; c < SIZE; c++) { if (grid[r][c]) m |= (1 << c); }
    rows.push(m);
  }
  return rows;
}

function filledCount(rows) {
  var n = 0;
  for (var r = 0; r < SIZE; r++) { for (var c = 0; c < SIZE; c++) { if (rows[r] & (1 << c)) n++; } }
  return n;
}

/* semua posisi sah sebuah bentuk di papan (rows = bitmask per baris) */
function placementsOf(shape, rows) {
  var b = shapeBounds(shape);
  var res = [];
  for (var r0 = 0; r0 + b.rows <= SIZE; r0++) {
    for (var c0 = 0; c0 + b.cols <= SIZE; c0++) {
      var ok = true;
      for (var i = 0; i < shape.length; i++) {
        if (rows[r0 + shape[i][0]] & (1 << (c0 + shape[i][1]))) { ok = false; break; }
      }
      if (ok) res.push([r0, c0]);
    }
  }
  return res;
}

/* taruh bentuk lalu hapus baris/kolom penuh; kembalikan {rows, cleared} */
function applyShape(shape, rows, r0, c0) {
  var nr = rows.slice();
  for (var i = 0; i < shape.length; i++) { nr[r0 + shape[i][0]] |= (1 << (c0 + shape[i][1])); }
  var fullR = [], fullC = [];
  for (var r = 0; r < SIZE; r++) { if (nr[r] === 255) fullR.push(r); }
  for (var c = 0; c < SIZE; c++) {
    var f = true;
    for (var r2 = 0; r2 < SIZE; r2++) { if (!(nr[r2] & (1 << c))) { f = false; break; } }
    if (f) fullC.push(c);
  }
  fullR.forEach(function(r) { nr[r] = 0; });
  fullC.forEach(function(c) { for (var r = 0; r < SIZE; r++) nr[r] &= ~(1 << c); });
  return { rows: nr, cleared: fullR.length + fullC.length };
}

/* apakah ketiga bentuk bisa ditaruh semua, dalam urutan apa pun? (dibatasi biar cepat) */
function setIsSolvable(shapes, rows) {
  var budget = { n: 2500 };
  function dfs(rem, rws) {
    if (!rem.length) return true;
    for (var i = 0; i < rem.length; i++) {
      var pl = placementsOf(rem[i], rws);
      for (var k = 0; k < pl.length; k++) {
        if (--budget.n < 0) return false;
        var res = applyShape(rem[i], rws, pl[k][0], pl[k][1]);
        var rest = rem.slice(0, i).concat(rem.slice(i + 1));
        if (dfs(rest, res.rows)) return true;
      }
    }
    return false;
  }
  return dfs(shapes, rows);
}

/* ada balok yang langsung menghapus baris? */
function setCanClear(shapes, rows) {
  for (var i = 0; i < shapes.length; i++) {
    var pl = placementsOf(shapes[i], rows);
    for (var k = 0; k < pl.length; k++) {
      if (applyShape(shapes[i], rows, pl[k][0], pl[k][1]).cleared > 0) return true;
    }
  }
  return false;
}

function weightedShape(fill) {
  var tot = 0, ws = [];
  var heavy = Math.max(0, fill - 0.35) * 10;
  for (var i = 0; i < SHAPES.length; i++) {
    var w = Math.pow(0.85, heavy * (SHAPES[i].length - 3) / 2);
    ws.push(w); tot += w;
  }
  var x = Math.random() * tot;
  for (var j = 0; j < SHAPES.length; j++) { x -= ws[j]; if (x <= 0) return SHAPES[j]; }
  return SHAPES[SHAPES.length - 1];
}

function pickTrayShapes() {
  if (!SMART_TRAY) return [randShape(), randShape(), randShape()];
  var rows = gridRows();
  var fill = filledCount(rows) / (SIZE * SIZE);
  var needClear = fill >= 0.5;
  var best = null, bestScore = -1;
  for (var t = 0; t < 40; t++) {
    var cand = [weightedShape(fill), weightedShape(fill), weightedShape(fill)];
    var sc = 0;
    if (setIsSolvable(cand, rows)) sc += 100; else continue;
    var distinct = (cand[0] !== cand[1] && cand[1] !== cand[2] && cand[0] !== cand[2]);
    if (distinct) sc += 5;
    if (needClear && setCanClear(cand, rows)) sc += 20;
    if (sc > bestScore) { bestScore = sc; best = cand; }
    if (sc >= 100 + 5 + (needClear ? 20 : 0)) break;
  }
  if (best) return best;
  /* papan sangat penuh: coba balok kecil saja */
  var small = SHAPES.filter(function(sh) { return sh.length <= 3; });
  for (var t2 = 0; t2 < 40; t2++) {
    var c2 = [0, 1, 2].map(function() { return small[Math.floor(Math.random() * small.length)]; });
    if (setIsSolvable(c2, rows)) return c2;
  }
  return [randShape(), randShape(), randShape()];
}

function refillTrayIfEmpty() {
  var allUsed = tray.every(function(p) { return !p || p.used; });
  if (allUsed) {
    var shapes = pickTrayShapes();
    for (var i = 0; i < 3; i++) {
      tray[i] = { shape: shapes[i], color: randColor(), used: false };
    }
    renderTray();
  }
}

function renderTray() {
  for (var i = 0; i < 3; i++) {
    var slot = trayEl.querySelector('[data-slot="' + i + '"]');
    slot.innerHTML = "";
    var piece = tray[i];
    if (!piece || piece.used) {
      slot.classList.add("empty");
      continue;
    }
    slot.classList.remove("empty");
    var bounds = shapeBounds(piece.shape);
    var maxDim = Math.max(bounds.rows, bounds.cols, 3);
    var pg = document.createElement("div");
    pg.className = "piece-grid";
    var cellPx = Math.max(16, Math.min(24, Math.floor(90 / maxDim)));
    pg.style.gridTemplateColumns = "repeat(" + bounds.cols + ", " + cellPx + "px)";
    pg.style.gridTemplateRows = "repeat(" + bounds.rows + ", " + cellPx + "px)";
    
    var filledSet = {};
    piece.shape.forEach(function(off) { filledSet[off[0] + "_" + off[1]] = true; });
    
    for (var r = 0; r < bounds.rows; r++) {
      for (var c = 0; c < bounds.cols; c++) {
        var pc = document.createElement("div");
        pc.className = "piece-cell";
        if (filledSet[r + "_" + c]) {
          pc.classList.add("filled");
          var blk = document.createElement("div");
          blk.className = "block";
          blk.style.setProperty("--c1", piece.color.c1);
          blk.style.setProperty("--c2", piece.color.c2);
          blk.setAttribute("data-i", piece.color.idx || 0);
          blk.style.position = "absolute";
          blk.style.inset = "0";
          pc.appendChild(blk);
        }
        pg.appendChild(pc);
      }
    }
    slot.appendChild(pg);
    
    var hit = document.createElement("div");
    hit.className = "piece-hit";
    slot.appendChild(hit);
    
    attachDrag(hit, slot, i, bounds, cellPx);
  }
}
