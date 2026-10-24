"use strict";

/* =========================================================
   INISIALISASI GRID & BOARD
========================================================= */
function buildBoard() {
  boardEl.innerHTML = "";
  grid = [];
  cellEls = [];
  blockEls = [];
  for (var r = 0; r < SIZE; r++) {
    grid.push(new Array(SIZE).fill(null));
    var rowCells = [];
    var rowBlocks = [];
    for (var c = 0; c < SIZE; c++) {
      var cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.r = r;
      cell.dataset.c = c;
      boardEl.appendChild(cell);
      rowCells.push(cell);
      rowBlocks.push(null);
    }
    cellEls.push(rowCells);
    blockEls.push(rowBlocks);
  }
}

/* =========================================================
   LOGIKA PENEMPATAN
========================================================= */
function canPlace(shape, row, col) {
  for (var i = 0; i < shape.length; i++) {
    var r = row + shape[i][0];
    var c = col + shape[i][1];
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return false;
    if (grid[r][c]) return false;
  }
  return true;
}

function anyValidMoveExists() {
  for (var i = 0; i < 3; i++) {
    var piece = tray[i];
    if (!piece || piece.used) continue;
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (canPlace(piece.shape, r, c)) return true;
      }
    }
  }
  return false;
}

var lastPlaced = { r: 3.5, c: 3.5 };

function placePiece(piece, row, col) {
  var sr = 0, sc = 0;
  piece.shape.forEach(function(o) { sr += row + o[0]; sc += col + o[1]; });
  lastPlaced = { r: sr / piece.shape.length, c: sc / piece.shape.length };
  piece.shape.forEach(function(off) {
    var r = row + off[0],
      c = col + off[1];
    grid[r][c] = piece.color;
    var blk = document.createElement("div");
    blk.className = "block placed";
    blk.style.setProperty("--c1", piece.color.c1);
    blk.style.setProperty("--c2", piece.color.c2);
          blk.setAttribute("data-i", piece.color.idx || 0);
    cellEls[r][c].appendChild(blk);
    blockEls[r][c] = blk;
  });
  score += piece.shape.length;
  moves += 1;
  updateScoreUI();
  sfxPlace();
  checkLines();
}

function checkLines() {
  var fullRows = [];
  var fullCols = [];
  for (var r = 0; r < SIZE; r++) {
    var full = true;
    for (var c = 0; c < SIZE; c++) { if (!grid[r][c]) { full = false; break; } }
    if (full) fullRows.push(r);
  }
  for (var c2 = 0; c2 < SIZE; c2++) {
    var fullC = true;
    for (var r2 = 0; r2 < SIZE; r2++) { if (!grid[r2][c2]) { fullC = false; break; } }
    if (fullC) fullCols.push(c2);
  }
  
  var totalLines = fullRows.length + fullCols.length;
  if (totalLines === 0) {
    combo = 0;
    return;
  }
  
  combo += 1;
  if (combo > maxCombo) maxCombo = combo;
  linesTotal += totalLines;
  var cellsToClear = {};
  fullRows.forEach(function(r) {
    for (var c = 0; c < SIZE; c++) cellsToClear[r + "_" + c] = [r, c];
  });
  fullCols.forEach(function(c) {
    for (var r = 0; r < SIZE; r++) cellsToClear[r + "_" + c] = [r, c];
  });
  
  var keys = Object.keys(cellsToClear);
  var gained = lineScore(totalLines) * Math.min(combo, COMBO_CAP);
  score += gained;
  updateScoreUI();
  showScoreFloat("+" + gained);
  sfxClear(totalLines);
  buzz(totalLines);
  
  /* logika papan langsung dikosongkan; hanya tampilan yang beranimasi */
  var dying = [];
  var maxD = 0;
  keys.forEach(function(k) {
    var pos = cellsToClear[k];
    var r = pos[0], c = pos[1];
    var blk = blockEls[r][c];
    var col = grid[r][c];
    grid[r][c] = null;
    blockEls[r][c] = null;
    if (blk) {
      var d = Math.min(Math.round(Math.hypot(r - lastPlaced.r, c - lastPlaced.c) * 28), 230);
      if (d > maxD) maxD = d;
      blk.style.setProperty("--d", d + "ms");
      blk.classList.add("clearing");
      dying.push({ el: blk, r: r, c: c, d: d, col: col });
    }
  });
  
  spawnClearParticles(dying, totalLines, combo);
  showCombo(totalLines, combo, gained);
  if (totalLines >= 2 || combo >= 3) {
    boardWrap.classList.remove("shake");
    void boardWrap.offsetWidth;
    boardWrap.classList.add("shake");
    setTimeout(function() { boardWrap.classList.remove("shake"); }, 360);
  }
  
  /* poora board khali? bara inaam */
  var empty = true;
  for (var er = 0; er < SIZE && empty; er++) {
    for (var ec = 0; ec < SIZE; ec++) { if (grid[er][ec]) { empty = false; break; } }
  }
  if (empty) {
    score += BOARD_CLEAR_BONUS;
    updateScoreUI();
    showScoreFloat("+" + BOARD_CLEAR_BONUS);
    setTimeout(function() {
      var pop = document.createElement("div");
      pop.className = "clear-pop t3";
      pop.innerHTML = "PERFECT!<small>+" + BOARD_CLEAR_BONUS + "</small>";
      document.body.appendChild(pop);
      setTimeout(function() { pop.remove(); }, 1000);
    }, 450);
  }
  
  autoThemeCheck(totalLines);
  
  setTimeout(function() {
    dying.forEach(function(o) { if (o.el.parentNode) o.el.remove(); });
  }, maxD + 400);
}
