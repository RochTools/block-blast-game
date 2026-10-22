/* Block Blast 3D – service worker (offline cache) */
const CACHE = "block-blast-v9";
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
  "./images/blocks/glossy/red.webp",
  "./images/blocks/glossy/orange.webp",
  "./images/blocks/glossy/yellow.webp",
  "./images/blocks/glossy/green.webp",
  "./images/blocks/glossy/cyan.webp",
  "./images/blocks/glossy/blue.webp",
  "./images/blocks/glossy/purple.webp",
  "./images/blocks/glossy/pink.webp",
  "./images/blocks/gem/red.webp",
  "./images/blocks/gem/orange.webp",
  "./images/blocks/gem/yellow.webp",
  "./images/blocks/gem/green.webp",
  "./images/blocks/gem/cyan.webp",
  "./images/blocks/gem/blue.webp",
  "./images/blocks/gem/purple.webp",
  "./images/blocks/gem/pink.webp",
  "./images/blocks/stone/red.webp",
  "./images/blocks/stone/orange.webp",
  "./images/blocks/stone/yellow.webp",
  "./images/blocks/stone/green.webp",
  "./images/blocks/stone/cyan.webp",
  "./images/blocks/stone/blue.webp",
  "./images/blocks/stone/purple.webp",
  "./images/blocks/stone/pink.webp",
  "./sounds/pick.mp3",
  "./sounds/place.mp3",
  "./sounds/clear.mp3",
  "./sounds/bad.mp3",
  "./sounds/gameover.mp3",
  "./sounds/click.mp3"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
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
