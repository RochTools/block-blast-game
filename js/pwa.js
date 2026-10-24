if ("serviceWorker" in navigator) {
  var hadController = !!navigator.serviceWorker.controller;
  var reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", function() {
    // new version took over -> reload once so the update shows immediately
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("sw.js").catch(function() {});
  });
}
