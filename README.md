# Haachama Radar

Track the Chama are! 🗾

## Disclaimer

```
This project and README contains code and text AI generated.
Please assume they are misleading or features are not implemented.
```

## About

**Haachama Radar** is a static fan site that shows where Akai Haato (Haachama) has been across Japan (and overseas), using an interactive MapLibre map, prefecture overlay, and location popups with photos and links.

Trip data is maintained in **Google My Maps**. A build-time **ingest** step downloads the KMZ, writes `public/data/chama-track.geojson`, marker icons, and `track-meta.json` (not committed; shipped inside `dist/`). Deeper notes live in [`docs/`](./docs/README.md).

## Meta tags and i18n

The app is a **Vite** SPA with a static `index.html` and client-side updates:

1. **Initial HTML** — default Open Graph / Twitter meta tags in `index.html`
2. **Runtime** — `DynamicMetadata` updates title and description when the language changes (`src/locales/` via i18next)

Set the production site URL for absolute social image URLs:

```bash
VITE_SITE_URL=https://your-domain.com
```

Use `<DynamicMetadata />` in `App.tsx` with optional overrides for custom title, description, image, or URL.

## Project goals / feature status

- Interactive map of Japan's 47 prefectures
- Highlight visited prefectures and show trip details (photos, tweets, YouTube)
- Multi-language UI (EN / JA)
- Spot search (top-left)
- Checklist / progress visualization — **planned**
- Fan-submitted media — **under consideration**
- Manual content via Google My Maps — **in use**

See [docs/PRODUCT.md](./docs/PRODUCT.md) for full product context.

## Getting started

Use **Node 24** (see `.nvmrc`; `nvm use`).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (see `vite.config.ts` for the dev port).

| Command | Purpose |
|---------|---------|
| `npm run ingest:track` | Fetch KMZ and write `public/data/` track bundle (also runs before `build`) |
| `npm run build` | Ingest track + typecheck + production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Vitest (unit / component) |
| `npm run lint` | ESLint |

Stack details: [docs/TECH_STACK.md](./docs/TECH_STACK.md).  
Layout: [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md).

Main entry: `src/main.tsx` → `src/App.tsx` → lazy-loaded `src/components/map/JapanMap.tsx`.

## Data sources

- **Prefecture boundaries** — [dataofjapan/land](https://github.com/dataofjapan/land/blob/master/japan.geojson), simplified to `public/data/japan-prefectures.geojson` via [mapshaper.org](https://mapshaper.org/) (explode → simplify → dissolve by prefecture name)
- **Chama locations** — Google My Maps KMZ ingested at build (`scripts/ingest-chama-track.ts`); app loads `data/chama-track.geojson` (`getChamaTrack()` in `src/services/api.ts`). Dev can fall back to live KMZ; set `VITE_USE_LIVE_KMZ=true` to force live fetch.
- **Map tiles** — third-party free providers (see basemap setup in `src/map/basemapStyle.ts`)

This site displays geographic data and map tiles from third-party sources. Providers are chosen because they are free to use where applicable.

## Refreshing map data (no track commit)

Trip GeoJSON is **not** in git; it is produced at build time. After editing the Google My Map:

1. **Automatic (recommended)** — workflow **Check My Maps update** runs on a schedule (every 6 hours UTC), compares the live Google KMZ SHA-256 to **`kmzSha256` in the published `data/track-meta.json`**, and dispatches **Deploy Vite React site to Pages** when they differ (or when the live file is missing). No git commits and no repository variables.
2. **Manual** — Actions → **Deploy Vite React site to Pages** → Run workflow, or push to `master`.

## Offline (PWA)

Production builds register a **service worker** (via `vite-plugin-pwa`) that precaches the app shell and **same-origin data**: prefecture GeoJSON, ingested `chama-track.geojson`, `track-meta.json`, and vendored pin icons.

**Map tiles** (Esri / GSI) and **popup gallery images** are **not** stored in the service worker; they rely on the **browser HTTP cache** if you viewed them while online.

After one online visit, you can use search, prefectures, and pins offline with an amber banner at the bottom. Install via **Add to Home Screen** when your browser offers it (manifest `display: standalone`).

## Credits

- React, TypeScript, Vite, MapLibre GL, Tailwind CSS — see [docs/TECH_STACK.md](./docs/TECH_STACK.md)
