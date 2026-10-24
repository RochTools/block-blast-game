"use strict";

/* =========================================================
   SCORE: formula + ginti wali animation + NEW BEST
========================================================= */
var COMBO_CAP = 8;          // combo multiplier ki hadd
var BOARD_CLEAR_BONUS = 300; // poora board khali karne ka inaam

/* n lines ek saath: 1->10, 2->30, 3->60, 4->100 ... (10 * n(n+1)/2) */
function lineScore(n) { return 10 * n * (n + 1) / 2; }

function renderScoreNumbers() {
  var shown = Math.round(shownScore);
  scoreValEl.textContent = shown;
  /* best tab tak score ke sath chalta hai jab tak score hi best hai */
  bestValEl.textContent = (score >= best) ? Math.min(shown, best) : best;
}

function animateScoreTo(target) {
  if (scoreAnim) cancelAnimationFrame(scoreAnim);
  var from = shownScore;
  if (REDUCE_MOTION || target <= from) { shownScore = target; renderScoreNumbers(); return; }
  var diff = target - from;
  var dur = Math.min(260 + diff * 4, 900);
  var t0 = performance.now();
  scoreValEl.classList.remove("bump");
  void scoreValEl.offsetWidth;
  scoreValEl.classList.add("bump");
  (function step(now) {
    var k = Math.min((now - t0) / dur, 1);
    k = 1 - Math.pow(1 - k, 3); // shuru me tez, aakhir me narm
    shownScore = from + diff * k;
    renderScoreNumbers();
    if (k < 1) scoreAnim = requestAnimationFrame(step);
    else { scoreAnim = null; shownScore = target; renderScoreNumbers(); }
  })(t0);
}

function updateScoreUI() {
  if (score > best) {
    best = score;
    lsSet(STORAGE_BEST, String(best));
  }
  if (!newBestShown && bestAtStart > 0 && score > bestAtStart) {
    newBestShown = true;
    showNewBest();
  }
  animateScoreTo(score);
}

/* score card ke neeche +N udta hua */
function showScoreFloat(text) {
  var card = document.querySelector(".stats-card");
  if (!card) return;
  var f = document.createElement("div");
  f.className = "score-float";
  f.textContent = text;
  card.appendChild(f);
  setTimeout(function() { f.remove(); }, 1000);
}

function showNewBest() {
  var pop = document.createElement("div");
  pop.className = "clear-pop t2 best-pop";
  pop.innerHTML = "NEW BEST!<small>" + best + "</small>";
  document.body.appendChild(pop);
  setTimeout(function() { pop.remove(); }, 1100);
  var card = document.querySelector(".stat.best");
  if (card) { card.classList.add("flash"); setTimeout(function() { card.classList.remove("flash"); }, 1600); }
}

/* naya game: sab kuch zero */
function resetScoreState() {
  if (scoreAnim) { cancelAnimationFrame(scoreAnim); scoreAnim = null; }
  score = 0; shownScore = 0;
  combo = 0; moves = 0; linesTotal = 0; maxCombo = 0;
  bestAtStart = best; newBestShown = false;
  renderScoreNumbers();
}
