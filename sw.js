const CODE_VERSION = 47;
const ASSET_VERSION = 2;
const CODE_CACHE = "bb-code-v" + CODE_VERSION;
const ASSET_CACHE = "bb-assets-v" + ASSET_VERSION;

const CODE_CORE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/config.js",
  "./js/theme.js",
  "./js/shapes.js",
  "./js/state.js",
  "./js/audio.js",
  "./js/board.js",
  "./js/tray.js",
  "./js/effects.js",
  "./js/fx.js",
  "./js/score.js",
  "./js/drag.js",
  "./js/game.js",
  "./js/ui.js",
  "./js/main.js",
  "./js/pwa.js",
  "./manifest.webmanifest"
];
const ASSET_CORE = [
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./images/block.webp",
  "./sounds/pick.mp3",
  "./sounds/place.mp3",
  "./sounds/clear.mp3",
  "./sounds/bad.mp3",
  "./sounds/gameover.mp3",
  "./sounds/Click.mp3"
];

const BLOCK_COLORS = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink"];
/* bhari/kam badalne wali cheezen: ek baar save, dobara download nahi (cache-first) */
const HEAVY = /\.(webp|png|jpe?g|gif|svg|mp3|ogg|wav|woff2?)$/i;

const cacheNameFor = (url) => (HEAVY.test(new URL(url, self.location).pathname) ? ASSET_CACHE : CODE_CACHE);

/* agar pehle se cache me hai to dobara download nahi karta */
async function addIfMissing(url) {
  try {
    const c = await caches.open(cacheNameFor(url));
    if (await c.match(url)) return;
    await c.add(new Request(url, { cache: "reload" }));
  } catch (e) { /* ek file na mile to baqi par asar nahi */ }
}

async function getJson(url) {
  const c = await caches.open(CODE_CACHE);
  try {
    const r = await fetch(url, { cache: "no-cache" });
    if (r.ok) { c.put(url, r.clone()); return await r.json(); }
  } catch (e) {}
  const hit = await c.match(url);
  return hit ? hit.json() : null;
}

/* core = pehla block style + pehli theme (zaroori); extra = baqi sab */
async function plan() {
  const core = [],
    extra = [];
  const styles = await getJson("./images/blocks/styles.json");
  if (Array.isArray(styles)) {
    styles.forEach((id, i) => BLOCK_COLORS.forEach((col) => (i === 0 ? core : extra).push("./images/blocks/" + id + "/" + col + ".webp")));
  }
  const themes = await getJson("./themes/themes.json");
  if (Array.isArray(themes)) {
    const cc = await caches.open(CODE_CACHE);
    for (let i = 0; i < themes.length; i++) {
      const dest = i === 0 ? core : extra;
      const cssUrl = "./themes/" + themes[i].id + ".css";
      dest.push(cssUrl);
      try {
        const r = await fetch(cssUrl, { cache: "no-cache" });
        if (!r.ok) continue;
        cc.put(cssUrl, r.clone());
        const txt = await r.text();
        const re = /url\(\s*["']?([^"')]+)["']?\s*\)/g;
        let m;
        while ((m = re.exec(txt))) { if (!/^(data:|https?:|\/)/.test(m[1])) dest.push("./themes/" + m[1]); }
      } catch (e) {}
    }
  }
  return { core: Array.from(new Set(core)), extra: Array.from(new Set(extra)) };
}

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cc = await caches.open(CODE_CACHE);
    await Promise.all(CODE_CORE.map((u) => cc.add(new Request(u, { cache: "reload" })).catch(() => {})));
    await Promise.all(ASSET_CORE.map(addIfMissing));
    const p = await plan().catch(() => ({ core: [] }));
    await Promise.all(p.core.map(addIfMissing));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CODE_CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim())
  );
});

/* page se paigham: khali waqt me baqi themes/block styles ek ek kar ke save karo (network par halka) */
self.addEventListener("message", (e) => {
  if (!e.data || e.data.type !== "PRECACHE_EXTRA") return;
  e.waitUntil((async () => {
    const p = await plan();
    for (const u of p.extra) await addIfMissing(u);
  })().catch(() => {}));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const path = new URL(req.url).pathname;
  
  /* tasveer/awaz: cache-first. cache me ho to network ko haath hi nahi lagate */
  if (HEAVY.test(path)) {
    e.respondWith((async () => {
      const c = await caches.open(ASSET_CACHE);
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.status === 200) c.put(req, res.clone());
        return res;
      } catch (err) {
        return Response.error();
      }
    })());
    return;
  }
  
  /* html/css/js/json: cache se foran, background me naya le kar update (chhoti files) */
  e.respondWith((async () => {
    const c = await caches.open(CODE_CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then((res) => {
      if (res && res.status === 200) c.put(req, res.clone());
      return res;
    });
    if (hit) {
      e.waitUntil(net.catch(() => {})); // background update ko beech me marne se bachao
      return hit;
    }
    try {
      return await net;
    } catch (err) {
      // index.html sirf page (navigate) ke liye; css/js ke liye HTML dena galat hai
      if (req.mode === "navigate") {
        const idx = await c.match("./index.html");
        if (idx) return idx;
      }
      return Response.error();
    }
  })());
});
