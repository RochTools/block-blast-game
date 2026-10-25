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
var crownCardEl = null, crownFillBoxEl = null, scoreCenterEl = null;

/* DOM tabhi chhua jata hai jab nambar sach me badla ho (tez aur halka) */
function renderScoreNumbers() {
  var shown = Math.round(shownScore);
  if (shown !== lastShownInt) {
    lastShownInt = shown;
    scoreValEl.textContent = shown;
  }
  /* best tab tak score ke sath chalta hai jab tak score hi best hai */
  var bshow = (score >= best) ? Math.min(shown, best) : best;
  if (bshow !== lastBestShown) {
    lastBestShown = bshow;
    bestValEl.textContent = bshow;
  }
  updateCrown();
}

/* taj: best ke qareeb jate hue neeche se sunehri bharta hai; best par pohonchne par chamak uthta hai */
function updateCrown() {
  if (!crownCardEl) crownCardEl = document.getElementById("crownCard");
  if (!crownCardEl) return;
  if (!crownFillBoxEl) crownFillBoxEl = crownCardEl.querySelector(".crown-fillbox");

  var p = bestAtStart > 0 ? Math.min(shownScore / bestAtStart, 1) : 0;
  if (Math.abs(p - lastCrownP) >= 0.005 || ((p === 0 || p === 1) && p !== lastCrownP)) {
    lastCrownP = p;
    var pStr = p.toFixed(3);
    if (crownFillBoxEl) crownFillBoxEl.style.setProperty("--p", pStr);
    else crownCardEl.style.setProperty("--p", pStr);
  }
  var reached = bestAtStart > 0 && score >= bestAtStart;
  if (reached !== crownCardEl.classList.contains("reached")) {
    crownCardEl.classList.toggle("reached", reached);
  }
}

/* ===== SMOOTH GINTI (60 FPS / High Refresh) =====
   Snappy critically damped spring (SmoothDamp):
   - Har frame (60fps/120fps) par chalta hai, koi artificial 30fps/33ms rukawat nahi.
   - Tez settling time (~0.7s) taake agla block drag karte waqt counter pehle hi complete ho chuka ho.
   - Lambi tail ko khatam karne ke liye < 1 point par target par snap ho jata hai. */
var SCORE_SMOOTH_TIME = 0.22;
var scoreVel = 0, scoreLastT = 0, scoreBumpAt = 0;

function scoreStep(now) {
  var dt = Math.min((now - scoreLastT) / 1000, 0.05); // tab/lag ke baad jhatka nahi
  scoreLastT = now;
  var omega = 2 / SCORE_SMOOTH_TIME, x = omega * dt;
  var e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  var change = shownScore - score;
  var temp = (scoreVel + omega * change) * dt;
  scoreVel = (scoreVel - omega * temp) * e;
  shownScore = score + (change + temp) * e;

  if (Math.abs(score - shownScore) < 1 && Math.abs(scoreVel) < 10) {
    shownScore = score;
    scoreVel = 0;
    scoreAnim = null;
    renderScoreNumbers();
    return;
  }

  renderScoreNumbers();
  scoreAnim = requestAnimationFrame(scoreStep);
}

function animateScoreTo(target) {
  if (REDUCE_MOTION || target < shownScore) {
    if (scoreAnim) { cancelAnimationFrame(scoreAnim); scoreAnim = null; }
    shownScore = target;
    scoreVel = 0;
    renderScoreNumbers();
    return;
  }
  /* Score card par halka sa bump effect */
  var now = performance.now();
  if (target - shownScore >= 100 && now - scoreBumpAt > 350) {
    scoreBumpAt = now;
    if (!scoreCenterEl) scoreCenterEl = document.querySelector(".score-center");
    if (scoreCenterEl) {
      scoreCenterEl.classList.remove("bump");
      void scoreCenterEl.offsetWidth;
      scoreCenterEl.classList.add("bump");
    }
  }
  if (!scoreAnim) {
    scoreLastT = performance.now();
    scoreAnim = requestAnimationFrame(scoreStep);
  }
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
  if (!crownCardEl) crownCardEl = document.getElementById("crownCard");
  if (crownCardEl) {
    crownCardEl.classList.add("flash");
    setTimeout(function() { crownCardEl.classList.remove("flash"); }, 1600);
  }
}

/* naya game: sab kuch zero */
function resetScoreState() {
  if (scoreAnim) { cancelAnimationFrame(scoreAnim); scoreAnim = null; }
  score = 0; shownScore = 0; scoreVel = 0;
  combo = 0; moves = 0; linesTotal = 0; maxCombo = 0;
  bestAtStart = best; newBestShown = false;
  lastCrownP = -1; lastShownInt = -1; lastBestShown = -1;
  renderScoreNumbers();
}
