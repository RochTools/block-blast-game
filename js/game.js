"use strict";

/* =========================================================
   GAME OVER
========================================================= */
function triggerGameOver() {
  isGameOver = true;
  sfxOver();
  finalScoreEl.textContent = score;
  finalBestLineEl.textContent = "Best score: " + best;
  overlay.classList.add("show");
}

function restartGame() {
  isGameOver = false;
  score = 0;
  combo = 0;
  updateScoreUI();
  buildBoard();
  tray = [null, null, null];
  refillTrayIfEmpty();
  overlay.classList.remove("show");
}
