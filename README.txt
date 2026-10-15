BLOCK BLAST 3D - PWA
====================

Files
  index.html            the game
  manifest.webmanifest  app name, icons, colors (makes it installable)
  sw.js                 service worker (caches everything -> works offline)
  icons/                app icons

IMPORTANT: a PWA only installs / works offline when served over HTTPS
(or http://localhost). Opening index.html directly from the phone's file
manager will NOT install it.

Easy ways to host (free)
  - Netlify Drop: drag this whole folder onto https://app.netlify.com/drop
  - GitHub Pages, Cloudflare Pages, Vercel
  - Test on PC:  python3 -m http.server 8000   then open http://localhost:8000

Install on phone
  Android (Chrome): menu (three dots) -> "Install app" / "Add to Home screen"
  iPhone (Safari):  Share button -> "Add to Home Screen"

Updating the game later
  After you change index.html, change CACHE = "block-blast-v1" in sw.js to
  "block-blast-v2" so phones download the new version.
