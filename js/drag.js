"use strict";

/* =========================================================
   DRAG & DROP (Pointer Events: mouse + touch + pen)
========================================================= */
var dragState = null;

function attachDrag(hitEl, slotEl, index, bounds, cellPx) {
  hitEl.addEventListener("pointerdown", function(ev) {
    if (isGameOver) return;
    /* satu drag saja: jari kedua/ketiga diabaikan supaya balok tidak nyangkut */
    if (dragState) { ev.preventDefault(); return; }
    var piece = tray[index];
    if (!piece || piece.used) return;
    ev.preventDefault();
    unlockAudio();
    sfxPick();
    
    // ukuran sel papan yang sebenarnya (diukur langsung dari DOM)
    var c0 = cellEls[0][0].getBoundingClientRect();
    var c1 = cellEls[0][1].getBoundingClientRect();
    var cellSize = c0.width;
    var stepSize = c1.left - c0.left;
    var gapSize = stepSize - cellSize;
    var originLeft = c0.left;
    var originTop = c0.top;
    
    var ghost = document.createElement("div");
    ghost.className = "dragging-piece";
    ghost.style.gap = gapSize + "px";
    ghost.style.gridTemplateColumns = "repeat(" + bounds.cols + ", " + cellSize + "px)";
    ghost.style.gridTemplateRows = "repeat(" + bounds.rows + ", " + cellSize + "px)";
    
    var filledSet = {};
    piece.shape.forEach(function(off) { filledSet[off[0] + "_" + off[1]] = true; });
    for (var r = 0; r < bounds.rows; r++) {
      for (var c = 0; c < bounds.cols; c++) {
        var cellDiv = document.createElement("div");
        cellDiv.style.width = cellSize + "px";
        cellDiv.style.height = cellSize + "px";
        if (filledSet[r + "_" + c]) {
          var blk = document.createElement("div");
          blk.className = "block";
          blk.style.setProperty("--c1", piece.color.c1);
          blk.style.setProperty("--c2", piece.color.c2);
          blk.setAttribute("data-i", piece.color.idx || 0);
          /* gap ke aadhe hisse tak phela do taake ghost ke blocks bhi ek dusre se milen */
          blk.style.width = (cellSize + gapSize) + "px";
          blk.style.height = (cellSize + gapSize) + "px";
          blk.style.margin = (-gapSize / 2) + "px";
          cellDiv.appendChild(blk);
        }
        ghost.appendChild(cellDiv);
      }
    }
    document.body.appendChild(ghost);
    
    dragState = {
      piece: piece,
      index: index,
      ghost: ghost,
      bounds: bounds,
      cellPx: cellPx,
      cellSize: cellSize,
      stepSize: stepSize,
      originLeft: originLeft,
      originTop: originTop,
      gw: bounds.cols * stepSize - gapSize,
      gh: bounds.rows * stepSize - gapSize,
      lastHighlight: [],
      startX: ev.clientX,
      startY: ev.clientY,
      pointerId: ev.pointerId
    };
    
    slotEl.style.opacity = "0.35";
    dragState.slotEl = slotEl;
    
    // ---- Pickup halus: balok mulai kecil di jari, lalu naik & membesar pelan ----
    var s0 = Math.max(0.4, Math.min(0.8, cellPx / cellSize));
    ghost.style.transformOrigin = "50% 100%";
    ghost.style.transform = "translate3d(" + (ev.clientX - dragState.gw / 2) + "px, " + (ev.clientY - dragState.gh) + "px, 0) scale(" + s0 + ")";
    void ghost.offsetWidth; // paksa browser catat posisi awal
    ghost.style.transition = "transform .16s cubic-bezier(.2, .8, .3, 1)";
    moveGhost(ev.clientX, ev.clientY);
    updateHoverHighlight(ev.clientX, ev.clientY);
    setTimeout(function() { ghost.style.transition = "none"; }, 180);
    
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }, { passive: false });
}

var FINGER_GAP = 36;   // jarak awal balok di atas jari (px)
/* GHASEETNE KI RAFTAR (bara nambar = block tez bhagta hai):
   jari ke har 1px par block itne px chalta hai. 1 = bilkul jari ke barabar (pehle yahi tha) */
var GAIN_X = 1.3;      // dayen/bayen
var RUN_FACTOR = 0.6;  // jari upar jaye to block utna aur upar (pehle 0.4)
var DOWN_FACTOR = 0.2; // jari neeche jaye to block utna aur neeche

/* block ki jagah: pakarne ki jagah se jari jitna hile, block us se zyada hilta hai */
function ghostPos(x, y) {
  var d = dragState;
  var up = Math.max(0, d.startY - y);
  var down = Math.max(0, y - d.startY);
  var cx = d.startX + (x - d.startX) * GAIN_X;
  var left = cx - d.gw / 2;
  var maxLeft = window.innerWidth - d.gw / 2;
  if (left < -d.gw / 2) left = -d.gw / 2;      // screen se bahar na nikle
  if (left > maxLeft) left = maxLeft;
  var top = y - d.gh - FINGER_GAP - up * RUN_FACTOR + down * DOWN_FACTOR;
  if (top < 0) top = 0;
  return { left: left, top: top };
}

function moveGhost(x, y) {
  if (!dragState) return;
  var p = ghostPos(x, y);
  dragState.ghost.style.transform = "translate3d(" + p.left + "px, " + p.top + "px, 0) scale(1)";
}

function clearHighlight() {
  if (!dragState || !dragState.layer) return;
  dragState.layer.remove();
  dragState.layer = null;
}

function getAnchorFromPointer(x, y) {
  var p = ghostPos(x, y);
  var col = Math.round((p.left - dragState.originLeft) / dragState.stepSize);
  var row = Math.round((p.top - dragState.originTop) / dragState.stepSize);
  return { row: row, col: col };
}

/* bayangan target: satu lapisan ringan, hanya geser transform (tanpa ubah class tiap sel) */
function ensureLayer() {
  var d = dragState;
  if (d.layer) return;
  var layer = document.createElement("div");
  layer.className = "hint-layer";
  d.kids = [];
  for (var i = 0; i < d.piece.shape.length; i++) {
    var k = document.createElement("div");
    k.style.width = d.cellSize + "px";
    k.style.height = d.cellSize + "px";
    k.style.opacity = "0";
    layer.appendChild(k);
    d.kids.push(k);
  }
  // lapisan bayangan ditaruh DI LUAR grid papan, supaya papan tidak pernah berubah ukuran
  boardWrap.appendChild(layer);
  var br = boardWrap.getBoundingClientRect();
  d.baseX = d.originLeft - br.left - boardWrap.clientLeft;
  d.baseY = d.originTop - br.top - boardWrap.clientTop;
  d.layer = layer;
  d.bars = [];
  d.wasValid = null;
}

/* baris/kolom mana yang akan penuh kalau bentuk ditaruh di (ar, ac)? */
function completedLines(shape, ar, ac) {
  var inShape = {}, rowsT = {}, colsT = {};
  for (var i = 0; i < shape.length; i++) {
    var r = ar + shape[i][0], c = ac + shape[i][1];
    inShape[r + "_" + c] = true; rowsT[r] = true; colsT[c] = true;
  }
  var rowsDone = [], colsDone = [];
  Object.keys(rowsT).forEach(function(rk) {
    var r = +rk, full = true;
    for (var c = 0; c < SIZE; c++) { if (!grid[r][c] && !inShape[r + "_" + c]) { full = false; break; } }
    if (full) rowsDone.push(r);
  });
  Object.keys(colsT).forEach(function(ck) {
    var c = +ck, full = true;
    for (var r = 0; r < SIZE; r++) { if (!grid[r][c] && !inShape[r + "_" + c]) { full = false; break; } }
    if (full) colsDone.push(c);
  });
  return { rows: rowsDone, cols: colsDone };
}

function showLineGlow(lines) {
  var d = dragState;
  var need = lines.rows.length + lines.cols.length;
  var pad = 3;
  var span = (SIZE - 1) * d.stepSize + d.cellSize;
  while (d.bars.length < need) {
    var bar = document.createElement("div");
    bar.className = "line-glow";
    bar.style.display = "none";
    d.layer.appendChild(bar);
    d.bars.push(bar);
  }
  var n = 0;
  lines.rows.forEach(function(r) {
    var b = d.bars[n++];
    b.style.width = (span + pad * 2) + "px";
    b.style.height = (d.cellSize + pad * 2) + "px";
    b.style.transform = "translate3d(" + (d.baseX - pad) + "px," + (d.baseY + r * d.stepSize - pad) + "px,0)";
    b.style.display = "";
  });
  lines.cols.forEach(function(c) {
    var b = d.bars[n++];
    b.style.width = (d.cellSize + pad * 2) + "px";
    b.style.height = (span + pad * 2) + "px";
    b.style.transform = "translate3d(" + (d.baseX + c * d.stepSize - pad) + "px," + (d.baseY - pad) + "px,0)";
    b.style.display = "";
  });
  /* baqi bars chhupao. NOTE: opacity:0 kaam nahi karta kyunke CSS animation inline opacity ko dabati hai -> display:none */
  for (; n < d.bars.length; n++) { d.bars[n].style.display = "none"; }
}

function updateHoverHighlight(x, y) {
  if (!dragState) return;
  var anchor = getAnchorFromPointer(x, y);
  
  // kerja hanya kalau kotak target berubah
  var prev = dragState.hoverAnchor;
  if (prev && prev.row === anchor.row && prev.col === anchor.col) return;
  
  ensureLayer();
  var d = dragState;
  var shape = d.piece.shape;
  var valid = canPlace(shape, anchor.row, anchor.col);
  d.hoverAnchor = anchor;
  d.hoverValid = valid;
  
  if (valid !== d.wasValid) {
    d.layer.classList.toggle("bad", !valid);
    d.wasValid = valid;
  }
  /* baris/kolom yang akan selesai -> menyala (hanya dihitung kalau posisi sah) */
  if (valid) {
    var lines = completedLines(shape, anchor.row, anchor.col);
    var had = d.hadLines;
    if (lines.rows.length + lines.cols.length > 0) {
      showLineGlow(lines); d.hadLines = true;
    } else if (had) { showLineGlow(lines); d.hadLines = false; }
  } else if (d.hadLines) { showLineGlow({ rows: [], cols: [] }); d.hadLines = false; }
  for (var i = 0; i < shape.length; i++) {
    var r = anchor.row + shape[i][0];
    var c = anchor.col + shape[i][1];
    var k = d.kids[i];
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
      k.style.transform = "translate3d(" + (d.baseX + c * d.stepSize) + "px," + (d.baseY + r * d.stepSize) + "px,0)";
      k.style.opacity = "1";
    } else {
      k.style.opacity = "0";
    }
  }
}

function onPointerMove(ev) {
  if (!dragState || ev.pointerId !== dragState.pointerId) return;
  // langsung gerakkan balok (tanpa tunggu frame) supaya tidak terasa nyangkut
  moveGhost(ev.clientX, ev.clientY);
  updateHoverHighlight(ev.clientX, ev.clientY);
}

/* batalkan drag yang menggantung (misal sentuhan hilang karena gesture sistem / pindah aplikasi) */
function abortDrag() {
  if (!dragState) return;
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);
  clearHighlight();
  if (dragState.ghost) dragState.ghost.remove();
  if (dragState.slotEl) dragState.slotEl.style.opacity = "1";
  dragState = null;
}

/* semua jari terangkat tapi drag masih ada -> pasti menggantung */
["touchend", "touchcancel"].forEach(function(evName) {
  document.addEventListener(evName, function(e) {
    if (dragState && e.touches && e.touches.length === 0) {
      setTimeout(function() { if (dragState) abortDrag(); }, 60);
    }
  }, { passive: true });
});
window.addEventListener("blur", abortDrag);
document.addEventListener("visibilitychange", function() { if (document.hidden) abortDrag(); });

function onPointerUp(ev) {
  if (!dragState || ev.pointerId !== dragState.pointerId) return;
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);
  
  clearHighlight();
  dragState.ghost.remove();
  
  var piece = dragState.piece;
  var anchor = dragState.hoverAnchor;
  var valid = dragState.hoverValid;
  
  if (valid && canPlace(piece.shape, anchor.row, anchor.col)) {
    piece.used = true;
    placePiece(piece, anchor.row, anchor.col);
    dragState.slotEl.style.opacity = "1";
    renderTray();
    refillTrayIfEmpty();
    /* jagah khatam ho gayi? game abhi khatam NAHI: khiladi ko khud koshish karne do */
    setTimeout(function() { stuck = !anyValidMoveExists(); }, 200);
  } else {
    dragState.slotEl.style.opacity = "1";
    if (valid === false || stuck) { sfxBad(); }
    /* jagah nahi thi aur khiladi ne tukra utha kar chhor diya (ya sirf chhua) -> ab game over.
       pointercancel (system ne touch cancel kiya) koshish nahi mana jata */
    if (stuck && ev.type !== "pointercancel") {
      setTimeout(function() {
        if (!stuck || isGameOver) return;
        abortDrag();
        triggerGameOver();
      }, 500);
    }
  }
  dragState = null;
}
