/* Block Blast 3D – service worker (offline cache) */
const CACHE = "block-blast-v31";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
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

/* baca images/blocks/styles.json lalu simpan semua gambar blok untuk offline */
const BLOCK_COLORS = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink"];
function precacheBlocks(c) {
  return fetch("./images/blocks/styles.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((list) => {
      const urls = ["./images/blocks/styles.json"];
      list.forEach((id) => BLOCK_COLORS.forEach((col) => urls.push("./images/blocks/" + id + "/" + col + ".webp")));
      return Promise.all(urls.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {})));
    })
    .catch(() => {});
}

/* baca themes/themes.json -> simpan tiap <id>.css dan semua gambar yang dipakai di dalamnya (url(...)) */
function precacheThemes(c) {
  return fetch("./themes/themes.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((list) => {
      const urls = ["./themes/themes.json"];
      return Promise.all(list.map((t) => {
        const cssUrl = "./themes/" + t.id + ".css";
        urls.push(cssUrl);
        return fetch(cssUrl, { cache: "no-cache" })
          .then((r) => r.text())
          .then((txt) => {
            const re = /url\(\s*["']?([^"')]+)["']?\s*\)/g;
            let m;
            while ((m = re.exec(txt))) { if (!/^(data:|https?:|\/)/.test(m[1])) urls.push("./themes/" + m[1]); }
          })
          .catch(() => {});
      })).then(() => Promise.all(Array.from(new Set(urls)).map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {}))));
    })
    .catch(() => {});
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      /* har file alag se cache hoti hai: koi ek file (jaise images/block.webp) missing ho to bhi install fail nahi hota */
      .then((c) => Promise.all(ASSETS.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {})))
        .then(() => precacheBlocks(c)).then(() => precacheThemes(c)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  // Stale-while-revalidate: cache se foran kholo, background me naya version le kar cache update karo
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
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
      // index.html sirf page (navigate) ke liye; awaz/tasveer/css ke liye HTML dena galat hai
      if (req.mode === "navigate") {
        const idx = await c.match("./index.html");
        if (idx) return idx;
      }
      return Response.error();
    }
  })());
});
