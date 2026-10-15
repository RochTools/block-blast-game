# Block Blast 3D

A fast, offline-ready Progressive Web App (PWA) puzzle game with 3D visuals and multiple theme sounds. Install it on your phone or computer and play anywhere, even without internet.

Made by StepTudeen.

**Live game:** [Add link here]

---

## Features

- Multiple theme sounds built into the game
- Super fast and smooth gameplay
- Works offline after the first load, thanks to a service worker
- Installable on Android, iPhone, and desktop like a native app
- Kid-friendly: no inappropriate ads and no gambling promotions
- 100% ad-free

---

## Project Structure

```
block-blast-3d/
├── index.html              # The game
├── manifest.webmanifest    # App name, icons, and theme colors
├── sw.js                   # Service worker (enables offline play)
└── icons/                  # App icons
```

---

## Getting Started

### Important

PWAs can only be installed over HTTPS (or on `http://localhost` for testing).
Opening `index.html` directly from your phone's file manager will not install the app.

### Test Locally on a PC

From the project folder, run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

---

## Free Hosting Options

| Service | How to deploy |
|---|---|
| Netlify Drop | Drag the whole folder onto app.netlify.com/drop |
| GitHub Pages | Push the folder to a repo and enable Pages in settings |
| Cloudflare Pages | Connect your repo or upload the folder |
| Vercel | Import the project or deploy with the CLI |

---

## Installing the App on Your Phone

**Android (Chrome)**
1. Open the game link.
2. Tap the three-dot menu.
3. Tap "Install app".

**iPhone (Safari)**
1. Open the game link.
2. Tap the Share button.
3. Tap "Add to Home Screen".

---

## Updating the Game

After changing `index.html`, bump the cache version in `sw.js`:

```js
// Change this
const CACHE_NAME = 'block-blast-v1';
// to this
const CACHE_NAME = 'block-blast-v2';
```

This forces phones to download the new version instead of using the cached one.

---

## Content Policy

Block Blast 3D is designed to be a safe, family-friendly experience:

- No ads of any kind
- No inappropriate content
- No promotion of gambling or betting apps

---

Made by StepTudeen.
