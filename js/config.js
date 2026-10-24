"use strict";

/* =========================================================
   KONFIGURASI DASAR
========================================================= */
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
var SIZE = 8;
var STORAGE_BEST = "ikky_blockblast3d_best";
var STORAGE_MUTE = "ikky_blockblast3d_muted";

var COLORS = [
  { name: "red", c1: "#ff8a8a", c2: "#ee3b56" },
  { name: "orange", c1: "#ffd08a", c2: "#ff8f2e" },
  { name: "yellow", c1: "#fff2a8", c2: "#ffcf33" },
  { name: "green", c1: "#8bf0c9", c2: "#12b886" },
  { name: "cyan", c1: "#9beeff", c2: "#0ab8de" },
  { name: "blue", c1: "#9ec3ff", c2: "#3b6fe0" },
  { name: "purple", c1: "#d4b8ff", c2: "#8752f0" },
  { name: "pink", c1: "#ffb3ec", c2: "#f13fbf" }
];
