"use strict";

/* =========================================================
   EVENT LISTENER UI
========================================================= */

/* ---------- Menu titik tiga ---------- */
var menuBtn = document.getElementById("menuBtn");
var menuEl = document.getElementById("menu");

function setMenu(open) {
  menuEl.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
}

document.addEventListener("click", function(e) {
  if (e.target.closest && e.target.closest("button") && !e.target.closest("#soundBtn")) { unlockAudio(); sfxClick(); }
}, true);

menuBtn.addEventListener("click", function(e) {
  e.stopPropagation();
  setMenu(!menuEl.classList.contains("open"));
});

document.addEventListener("pointerdown", function(e) {
  if (menuEl.classList.contains("open") && !menuEl.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
    setMenu(false);
  }
});

soundBtn.addEventListener("click", function() {
  muted = !muted;
  lsSet(STORAGE_MUTE, muted ? "1" : "0");
  updateSoundIcon();
  if (!muted) { unlockAudio(); sfxClick(); }
});

restartBtn.addEventListener("click", function() {
  setMenu(false);
  restartGame();
});

playAgainBtn.addEventListener("click", function() {
  restartGame();
});
