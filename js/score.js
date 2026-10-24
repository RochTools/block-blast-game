"use strict";

function updateScoreUI() {
  scoreValEl.textContent = score;
  if (score > best) {
    best = score;
    lsSet(STORAGE_BEST, String(best));
  }
  bestValEl.textContent = best;
}
