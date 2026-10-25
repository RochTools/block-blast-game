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

/* screen par dikhne wala nambar: bade farq par 10-10, chhote par 5-5, aakhir me 1-1 ke qadam
   (aakhri digit tez na phadphadae; chal bilkul narm lagti hai) */
function displayValue() {
  var rem = Math.abs(score - shownScore);
  var q = rem > 300 ? 10 : (rem > 60 ? 5 : 1);
  var v = Math.round(shownScore / q) * q;
  return v > score ? score : v;
}

/* DOM tabhi chhua jata hai jab nambar sach me badla ho (tez aur halka) */
function renderScoreNumbers() {
  var shown = displayValue();
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

/* ===== SMOOTH GINTI =====
   Pehle har naye point par "ease" dobara shuru hota tha, is liye raftar jhatke se badalti thi.
   Ab ek narm spring (critically damped, "SmoothDamp") hai: ghati hui raftar kabhi achanak nahi
   badalti, chahe beech me aur points aa jayen. Alag rAF par chalti hai, game ko nahi rokti. */
var SCORE_SMOOTH_TIME = 0.6;   // bara = aur aaram se (seconds)
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
  if (Math.abs(score - shownScore) < 0.5 && Math.abs(scoreVel) < 2) {
    shownScore = score; scoreVel = 0; scoreAnim = null;
    renderScoreNumbers();
    return;
  }
  renderScoreNumbers();
  scoreAnim = requestAnimationFrame(scoreStep);
}

function animateScoreTo(target) {
  if (REDUCE_MOTION || target < shownScore) {
    if (scoreAnim) { cancelAnimationFrame(scoreAnim); scoreAnim = null; }
    shownScore = target; scoreVel = 0; renderScoreNumbers(); return;
  }
  /* halka ubhaar sirf bade points par, aur har 400ms me ek baar */
  var now = performance.now();
  if (target - shownScore >= 100 && now - scoreBumpAt > 400 && scoreValEl.animate) {
    scoreBumpAt = now;
    scoreValEl.animate([{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }],
      { duration: 360, easing: "ease-in-out" });
  }
  if (!scoreAnim) { scoreLastT = now; scoreAnim = requestAnimationFrame(scoreStep); }
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
  score = 0; shownScore = 0; scoreVel = 0;
  combo = 0; moves = 0; linesTotal = 0; maxCombo = 0;
  bestAtStart = best; newBestShown = false;
  renderScoreNumbers();
}
