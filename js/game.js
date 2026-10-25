"use strict";

/* =========================================================
   GAME OVER
========================================================= */
function triggerGameOver() {
  isGameOver = true;
  /* best paar kiya? (pehle game me paar karne ko kuch nahi, isliye normal) */
  var won = bestAtStart > 0 && score > bestAtStart;
  var isRecord = score > 0 && score > bestAtStart;
  finalBestLineEl.textContent = isRecord ? "NEW BEST!" : "Best score: " + best;
  finalBestLineEl.classList.toggle("new", isRecord);
  document.getElementById("statMoves").textContent = moves;
  document.getElementById("statLines").textContent = linesTotal;
  document.getElementById("statCombo").textContent = "x" + Math.max(maxCombo, 0);
  overlay.classList.toggle("win", won);
  clearConfetti();
  if (won) {
    sfxClear(4);
    countUpFinal(score);
    if (!REDUCE_MOTION) spawnConfetti();
  } else {
    sfxOver();
    finalScoreEl.textContent = score;
  }
  overlay.classList.add("show");
}

/* jeet wali animation: final score 0 se ginta hua barhta hai */
function countUpFinal(target) {
  var t0 = performance.now(), dur = REDUCE_MOTION ? 1 : 1400;
  finalScoreEl.textContent = 0;
  (function step(now) {
    var k = Math.min((now - t0) / dur, 1);
    k = 1 - Math.pow(1 - k, 3);
    finalScoreEl.textContent = Math.round(target * k);
    if (k < 1 && overlay.classList.contains("win")) requestAnimationFrame(step);
    else finalScoreEl.textContent = target;
  })(t0);
}

function spawnConfetti() {
  var box = document.createElement("div");
  box.className = "confetti-box";
  var cols = ["#ffd84a", "#ff7ad9", "#5fe3ff", "#7dff9b", "#ff8a3d", "#c9a6ff"];
  for (var i = 0; i < 70; i++) {
    var c = document.createElement("i");
    c.style.setProperty("--x", (Math.random() * 100).toFixed(1) + "%");
    c.style.setProperty("--dx", ((Math.random() - .5) * 120).toFixed(0) + "px");
    c.style.setProperty("--d", (Math.random() * 1.6).toFixed(2) + "s");
    c.style.setProperty("--t", (2.2 + Math.random() * 1.8).toFixed(2) + "s");
    c.style.setProperty("--r", ((Math.random() - .5) * 1080).toFixed(0) + "deg");
    c.style.background = cols[i % cols.length];
    if (i % 3 === 0) c.style.borderRadius = "50%";
    box.appendChild(c);
  }
  overlay.appendChild(box);
}

function clearConfetti() {
  var old = overlay.querySelector(".confetti-box");
  if (old) old.remove();
}

function restartGame() {
  isGameOver = false;
  stuck = false;
  resetScoreState();
  autoThemeReset();
  buildBoard();
  tray = [null, null, null];
  refillTrayIfEmpty();
  overlay.classList.remove("show");
  overlay.classList.remove("win");
  clearConfetti();
}
