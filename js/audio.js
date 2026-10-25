"use strict";

/* =========================================================
   AUDIO SEDERHANA (Web Audio API, tanpa file eksternal)
========================================================= */
function ensureAudio() {
  if (!audioCtx) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    } catch (e) { audioCtx = null; }
  }
}

function unlockAudio() {
  ensureAudio();
  if (audioCtx && audioCtx.state === "suspended") { audioCtx.resume(); }
  loadSounds();
}

/* nada tunggal dengan envelope + slide frekuensi opsional */
function tone(freq, start, dur, type, vol, slideTo) {
  if (muted) return;
  ensureAudio();
  if (!audioCtx) return;
  try {
    var t0 = audioCtx.currentTime + start;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.min((vol || 0.15) * 1.8, 0.9), t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  } catch (e) { /* suara opsional */ }
}

function beep(freq, dur, type, vol) { tone(freq, 0, dur, type, vol); }

/* angkat balok */
function synthPick() { tone(520, 0, 0.07, "sine", 0.10, 760); }

/* taruh balok: "pop" lembut */
function synthPlace() {
  tone(260, 0, 0.12, "triangle", 0.22, 120);
  tone(520, 0, 0.05, "sine", 0.08);
}

/* baris terhapus: arpeggio naik, makin tinggi saat kombo */
function synthClear(n) {
  var base = 523 * Math.pow(1.0595, Math.min(combo, 6) * 2); // naik tiap kombo
  var notes = [1, 1.25, 1.5, 2, 2.5];
  var count = Math.min(2 + n, notes.length);
  for (var i = 0; i < count; i++) {
    tone(base * notes[i], i * 0.07, 0.22, "triangle", 0.17);
    tone(base * notes[i] * 2, i * 0.07, 0.12, "sine", 0.05);
  }
}

/* tidak bisa ditaruh */
function synthBad() {
  tone(200, 0, 0.14, "square", 0.07, 110);
}

/* game over: nada turun sedih */
function synthOver() {
  tone(392, 0, 0.28, "triangle", 0.18);
  tone(330, 0.22, 0.28, "triangle", 0.18);
  tone(262, 0.44, 0.28, "triangle", 0.18);
  tone(196, 0.66, 0.6, "triangle", 0.2, 150);
}


/* =========================================================
   SOUND FILES (sounds/*.mp3) - fallback ke synth jika gagal
   pick.mp3  = whoosh saat blok diangkat
   place.mp3 = klik normal saat blok ditaruh
   clear.mp3 = lagu/suara saat baris terhapus
   bad.mp3   = tidak bisa ditaruh
   gameover.mp3 = game over
   click.mp3 = tombol menu/UI
========================================================= */
var SOUND_FILES = { pick: "sounds/pick.mp3", place: "sounds/place.mp3", clear: "sounds/clear.mp3",
  bad: "sounds/bad.mp3", gameover: "sounds/gameover.mp3", click: "sounds/Click.mp3" };
var SOUND_VOL = { pick: 0.8, place: 0.9, clear: 1, bad: 0.7, gameover: 1, click: 0.7 };
var sndBuf = {}, sndTries = {}, sndRunning = false;
var SOUND_ORDER = ["place", "pick", "click", "clear", "bad", "gameover"]; // zaroori awazen pehle

/* awazen ek ek kar ke decode hoti hain (pehle touch par 6 ek sath CPU par bojh na dalen).
   fail ho to agli dafa (max 5 baar) dobara koshish */
function loadSounds() {
  if (!audioCtx || sndRunning) return;
  var todo = SOUND_ORDER.filter(function(k) { return !sndBuf[k] && (sndTries[k] || 0) < 5; });
  if (!todo.length) return;
  sndRunning = true;
  (function next(i) {
    if (i >= todo.length) { sndRunning = false; return; }
    var k = todo[i];
    sndTries[k] = (sndTries[k] || 0) + 1;
    fetch(SOUND_FILES[k]).then(function(r) {
      if (!r.ok) throw new Error("bad status");
      return r.arrayBuffer();
    }).then(function(ab) {
      return new Promise(function(res, rej) {
        var p = audioCtx.decodeAudioData(ab, res, rej);
        if (p && p.catch) p.catch(rej);
      });
    }).then(function(buf) { sndBuf[k] = buf; })
      .catch(function() { /* abhi synth chalega */ })
      .then(function() { setTimeout(function() { next(i + 1); }, 80); });
  })(0);
}

function playSound(name, rate) {
  if (muted) return false;
  ensureAudio();
  if (!audioCtx) return false;
  loadSounds();
  var buf = sndBuf[name];
  if (!buf) return false;
  try {
    var src = audioCtx.createBufferSource();
    var g = audioCtx.createGain();
    g.gain.value = SOUND_VOL[name] || 1;
    src.buffer = buf;
    if (rate) src.playbackRate.value = rate;
    src.connect(g); g.connect(audioCtx.destination);
    src.start(0);
    return true;
  } catch (e) { return false; }
}

function sfxPick() { if (!playSound("pick")) synthPick(); }
function sfxPlace() { if (!playSound("place")) synthPlace(); }
function sfxClear(n) {
  /* makin tinggi nadanya saat kombo */
  var rate = 1 + 0.05 * Math.min(Math.max(combo - 1, 0), 6);
  if (!playSound("clear", rate)) { synthClear(n); return; }
}
function sfxBad() { if (!playSound("bad")) synthBad(); }
function sfxOver() { if (!playSound("gameover")) synthOver(); }
function sfxClick() { if (!playSound("click")) beep(440, 0.05, "sine", 0.08); }

function updateSoundIcon() {
  soundWave.style.opacity = muted ? "0.15" : "1";
  soundBtn.style.opacity = muted ? "0.55" : "1";
  var sl = document.getElementById("soundLabel");
  if (sl) sl.textContent = muted ? "Sound: Off" : "Sound: On";
}
