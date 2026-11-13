# Technology stack

## Framework and runtime

- **React 19** — UI
- **TypeScript 6** — types
- **Node.js 24** — local development and CI (see `.nvmrc`; `nvm use`)

## Build and styling

- **Vite 8** — dev server and production build (static output in `dist/`)
- **vite-plugin-pwa** (Workbox) — precache app + `data/*` in production; no tile/image runtime cache
- **Tailwind CSS 4** — utility CSS via `@tailwindcss/postcss`
- **PostCSS** — pipeline with Autoprefixer

## Map and geospatial

- **maplibre-gl** — map engine (basemap, GeoJSON layers, flyTo)
- **react-map-gl** (`/maplibre` entry) — React bindings
- **@turf/boolean-point-in-polygon** — point-in-polygon checks for click validation

Map logic uses a thin **`MapProjection`** facade (`src/map/mapProjection.ts`) and **`GeoBounds`** (`src/map/geoBounds.ts`) so viewport math is independent of the renderer.

## State, i18n, UI

- **Redux Toolkit** + **React Redux**
- **i18next**, **react-i18next**, **i18next-browser-languagedetector**
- **Framer Motion**, **React Icons**

## Utilities

- **fflate**, **@xmldom/xmldom**, **striptags**, **react-use-cookie**

## Development

- **ESLint 10**, **Vitest 5**, **Testing Library**, **fast-check** (property tests)
- Path alias `@/` → `./src/`

## Commands

```bash
npm run dev       # Vite dev server (port 3000)
npm run ingest:track  # fetch KMZ → public/data/ (gitignored)
npm run build         # ingest + tsc + vite build
npm run preview   # preview production build
npm run lint      # ESLint
npm test          # vitest --run
npm run test:watch
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_SITE_URL` | Production domain for social meta tags |
| `VITE_BASE_PATH` | Base path for subdirectory deployments |
| `VITE_CORS_PROXY` | CORS proxy for external images |

Build / ingest only (not exposed to the browser):

| Variable | Purpose |
|----------|---------|
| `DEGEOCODE_URL` | Country lookup service (`degeocode.benlab.link`; default if unset) |
| `DEGEOCODE_API_KEY` | API key for overseas `country` on bundled GeoJSON (CI: `secrets.VITE_DEGEOCODE_API_KEY`) |

Access in app code: `import.meta.env.VITE_*`.

## Vite notes

- `optimizeDeps.include` must list **`react-map-gl/maplibre`**, not `react-map-gl` (v8 has no package root export).
- MapLibre’s GeoJSON worker: `src/map/maplibreSetup.ts` calls `setWorkerUrl()` via `maplibre-gl/dist/maplibre-gl-worker.mjs?url` (import from `main.tsx` before the app mounts).
- Optional: set `"type": "module"` in `package.json` or use `vite.config.mjs` to silence native config-loader warnings.
