"use strict";

if ("serviceWorker" in navigator) {
  var hadController = !!navigator.serviceWorker.controller;
  var reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", function() {
    // new version took over -> reload once so the update shows immediately
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("sw.js").catch(function() {});
    /* baqi themes/block styles khali waqt me (load ke 10 sec baad) offline ke liye save hon;
       data saver ya 2G par nahi */
    var cn = navigator.connection;
    var saver = cn && (cn.saveData || /(^|-)2g$/.test(cn.effectiveType || ""));
    if (!saver) {
      setTimeout(function() {
        navigator.serviceWorker.ready.then(function(reg) {
          if (reg.active) reg.active.postMessage({ type: "PRECACHE_EXTRA" });
        }).catch(function() {});
      }, 10000);
    }
  });
}
