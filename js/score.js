"use strict";

/* =========================================================
   SCORE: formula + ginti wali animation + NEW BEST
========================================================= */
var SCORE_PER_CELL = 10;      // har rakhe hue khane ke points
var POINTS_PER_LINE = 500;    // 1 line = 500, 2 = 1000, 3 = 1500 ...
var COMBO_CAP = 8;            // combo multiplier ki hadd
var BOARD_CLEAR_BONUS = 5000; // poora board khali karne ka inaam

function lineScore(n) { return POINTS_PER_LINE * n; }

function renderScoreNumbers() {
  var shown = Math.round(shownScore);
  scoreValEl.textContent = shown;
  /* best tab tak score ke sath chalta hai jab tak score hi best hai */
  bestValEl.textContent = (score >= best) ? Math.min(shown, best) : best;
  updateCrown();
}

/* taj: best ke qareeb jate hue neeche se sunehri bharta hai; best par pohonchne par chamak uthta hai */
function updateCrown() {
  var fill = document.getElementById("crownFill");
  var card = document.getElementById("crownCard");
  if (!fill || !card) return;
  var p = bestAtStart > 0 ? Math.min(shownScore / bestAtStart, 1) : 0;
  fill.style.setProperty("--p", p.toFixed(3));
  card.classList.toggle("reached", bestAtStart > 0 && score >= bestAtStart);
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
  if (!newBestShown && bestAtStart > 0 && score >= bestAtStart) {
    newBestShown = true;
    showNewBest();
  }
  animateScoreTo(score);
}

/* score card ke neeche +N udta hua */
function showScoreFloat(text) {
  var card = document.querySelector(".score-center");
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
  pop.innerHTML = (score > bestAtStart ? "NEW BEST!" : "BEST!") + "<small>" + best + "</small>";
  document.body.appendChild(pop);
  setTimeout(function() { pop.remove(); }, 1100);
  var card = document.getElementById("crownCard");
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
