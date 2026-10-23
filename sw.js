/* Block Blast 3D – service worker (offline cache) */
const CACHE = "block-blast-v22";
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
  "./themes/rock.webp",
  "./themes/wood-bg.webp",
  "./themes/ice-bg.webp",
  "./sounds/pick.mp3",
  "./sounds/place.mp3",
  "./sounds/clear.mp3",
  "./sounds/bad.mp3",
  "./sounds/gameover.mp3",
  "./sounds/click.mp3"
];

/* baca images/blocks/styles.json lalu simpan semua gambar blok untuk offline */
const BLOCK_COLORS = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink"];
function precacheBlocks(c) {
  return fetch("./images/blocks/styles.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((list) => {
      const urls = ["./images/blocks/styles.json"];
      list.forEach((id) => BLOCK_COLORS.forEach((col) => urls.push("./images/blocks/" + id + "/" + col + ".webp")));
      return Promise.all(urls.map((u) => c.add(u).catch(() => {})));
    })
    .catch(() => {});
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS).then(() => precacheBlocks(c)))
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

  // Stale-while-revalidate: cache se foran kholo (tez), background me naya version le kar cache update karo
  e.respondWith(
    caches.open(CACHE).then((c) =>
      c.match(req, { ignoreSearch: true }).then((hit) => {
        const net = fetch(req)
          .then((res) => { if (res && res.ok) c.put(req, res.clone()); return res; })
          .catch(() => hit || c.match("./index.html"));
        return hit || net;
      })
    )
  );
});
