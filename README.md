# Haachama Radar

Track the Chama are! 🗾

## Disclaimer

```
This project and README contains code and text AI generated.
Please assume they are misleading or features are not implemented.
```

## About

**Haachama Radar** is a static fan site that shows where Akai Haato (Haachama) has been across Japan (and overseas), using an interactive MapLibre map, prefecture overlay, and location popups with photos and links.

Trip data is maintained in **Google My Maps** and loaded by the app at runtime (see [Data sources](#data-sources)). Deeper product and architecture notes live in [`docs/`](./docs/README.md).

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

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (see `vite.config.ts` for the dev port).

| Command | Purpose |
|---------|---------|
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Vitest (unit / component) |
| `npm run lint` | ESLint |

Stack details: [docs/TECH_STACK.md](./docs/TECH_STACK.md).  
Layout: [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md).

Main entry: `src/main.tsx` → `src/App.tsx` → lazy-loaded `src/components/map/JapanMap.tsx`.

## Data sources

- **Prefecture boundaries** — [dataofjapan/land](https://github.com/dataofjapan/land/blob/master/japan.geojson), simplified to `public/data/japan-prefectures.geojson` via [mapshaper.org](https://mapshaper.org/) (explode → simplify → dissolve by prefecture name)
- **Chama locations** — Google My Maps KMZ (`src/services/api.ts` → `getChamaTrack()`)
- **Map tiles** — third-party free providers (see basemap setup in `src/map/basemapStyle.ts`)

This site displays geographic data and map tiles from third-party sources. Providers are chosen because they are free to use where applicable.

## Credits

- React, TypeScript, Vite, MapLibre GL, Tailwind CSS — see [docs/TECH_STACK.md](./docs/TECH_STACK.md)
