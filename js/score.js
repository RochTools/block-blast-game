"use strict";

/* =========================================================
   SCORE: formula + ginti wali animation + NEW BEST
========================================================= */
var SCORE_PER_CELL = 10;      // har rakhe hue khane ke points
var POINTS_PER_LINE = 500;    // 1 line = 500, 2 = 1000, 3 = 1500 ...
var COMBO_CAP = 8;            // combo multiplier ki hadd
var BOARD_CLEAR_BONUS = 5000; // poora board khali karne ka inaam

function lineScore(n) { return POINTS_PER_LINE * n; }

var lastShownInt = -1, lastBestShown = -1, lastCrownP = -1;

/* DOM tabhi chhua jata hai jab nambar sach me badla ho (tez aur halka) */
function renderScoreNumbers() {
  var shown = Math.round(shownScore);
  if (shown !== lastShownInt) { lastShownInt = shown; scoreValEl.textContent = shown; }
  /* best tab tak score ke sath chalta hai jab tak score hi best hai */
  var bshow = (score >= best) ? Math.min(shown, best) : best;
  if (bshow !== lastBestShown) { lastBestShown = bshow; bestValEl.textContent = bshow; }
  updateCrown();
}

/* taj: best ke qareeb jate hue neeche se sunehri bharta hai; best par pohonchne par chamak uthta hai */
function updateCrown() {
  var fill = document.getElementById("crownFill");
  var card = document.getElementById("crownCard");
  if (!fill || !card) return;
  var p = bestAtStart > 0 ? Math.min(shownScore / bestAtStart, 1) : 0;
  if (Math.abs(p - lastCrownP) > 0.003 || p === 1 || p === 0) {
    lastCrownP = p;
    fill.style.setProperty("--p", p.toFixed(3));
  }
  var reached = bestAtStart > 0 && score >= bestAtStart;
  if (reached !== card.classList.contains("reached")) card.classList.toggle("reached", reached);
}

/* ginti ki raftar: jitne zyada points, utna zyada waqt (aaram se), max 2.4 second.
   ye rAF par alag chalti hai, game ya drag ko nahi rokti. */
function animateScoreTo(target) {
  if (scoreAnim) { cancelAnimationFrame(scoreAnim); scoreAnim = null; }
  var from = shownScore;
  if (REDUCE_MOTION || target <= from) { shownScore = target; renderScoreNumbers(); return; }
  var diff = target - from;
  var dur = Math.min(300 + diff * 1.6, 2400);
  var t0 = performance.now();
  /* halka sa ubhaar (reflow ke bagair) sirf bade points par */
  if (diff >= 100 && scoreValEl.animate) {
    scoreValEl.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }],
      { duration: 320, easing: "ease-out" });
  }
  function step(now) {
    var k = Math.min((now - t0) / dur, 1);
    k = 1 - (1 - k) * (1 - k); // narm ease-out (cubic se kam tez)
    shownScore = from + diff * k;
    renderScoreNumbers();
    if (now - t0 < dur) scoreAnim = requestAnimationFrame(step);
    else { scoreAnim = null; shownScore = target; renderScoreNumbers(); }
  }
  scoreAnim = requestAnimationFrame(step);
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
