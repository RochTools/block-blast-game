"use strict";

/* =========================================================
   STATE
========================================================= */
var grid = []; // grid[r][c] = null atau {c1,c2}
var score = 0;
var best = parseInt(lsGet(STORAGE_BEST) || "0", 10) || 0;
var muted = lsGet(STORAGE_MUTE) === "1";
var combo = 0;
var moves = 0;          // kitni chalein chali gayin
var linesTotal = 0;     // is game me kul lines saaf
var maxCombo = 0;       // sab se bada combo
var bestAtStart = best; // game shuru hone par best (NEW BEST pehchanne ke liye)
var newBestShown = false;
var shownScore = 0;     // screen par dikhne wala (ginti wala) score
var scoreAnim = null;
var tray = [null, null, null]; // {shape,color,used}
var isGameOver = false;
var audioCtx = null;

/* =========================================================
   ELEMEN DOM
========================================================= */
var boardEl = document.getElementById("board");
var trayEl = document.getElementById("tray");
var scoreValEl = document.getElementById("scoreVal");
var bestValEl = document.getElementById("bestVal");
var soundBtn = document.getElementById("soundBtn");
var soundWave = document.getElementById("soundWave");
var restartBtn = document.getElementById("restartBtn");
var overlay = document.getElementById("gameOverOverlay");
var finalScoreEl = document.getElementById("finalScore");
var finalBestLineEl = document.getElementById("finalBestLine");
var playAgainBtn = document.getElementById("playAgainBtn");
var boardWrap = document.querySelector(".board-wrap");

var cellEls = []; // cellEls[r][c] -> DOM cell
var blockEls = []; // blockEls[r][c] -> DOM block atau null
