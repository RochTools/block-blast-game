"use strict";

/* =========================================================
   GAME OVER
========================================================= */
function triggerGameOver() {
  isGameOver = true;
  sfxOver();
  finalScoreEl.textContent = score;
  var isNewBest = score > 0 && score > bestAtStart;
  finalBestLineEl.textContent = isNewBest ? "NEW BEST!" : "Best score: " + best;
  finalBestLineEl.classList.toggle("new", isNewBest);
  document.getElementById("statMoves").textContent = moves;
  document.getElementById("statLines").textContent = linesTotal;
  document.getElementById("statCombo").textContent = "x" + Math.max(maxCombo, 0);
  overlay.classList.add("show");
}

function restartGame() {
  isGameOver = false;
  resetScoreState();
  autoThemeReset();
  buildBoard();
  tray = [null, null, null];
  refillTrayIfEmpty();
  overlay.classList.remove("show");
}
