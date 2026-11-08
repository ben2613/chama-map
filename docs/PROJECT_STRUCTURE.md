# Project structure

## Root

| Path | Role |
|------|------|
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | Build, chunks, `optimizeDeps` |
| `vitest.config.ts` | Test environment and exclusions |
| `index.html` | HTML entry |
| `tsconfig.json` / `tsconfig.build.json` | TypeScript |
| `eslint.config.mjs` | Lint |
| `postcss.config.mjs`, `tailwind.config.js` | Tailwind 4 |
| `.env.example` | Env template |

## `src/` application

| Path | Role |
|------|------|
| `main.tsx`, `App.tsx` | Entry and shell |
| `app/globals.css` | Global styles, MapLibre overrides |
| `components/map/` | Map UI (see below) |
| `components/ui/` | Info panel, splash, metadata, etc. |
| `components/providers/` | Redux and i18n providers |
| `map/` | MapLibre adapter (`mapProjection`, `basemapStyle`, `layerIds`, `useMapProjection`) |
| `hooks/` | `useGeolocation`, `useMapRefs`, `useViewportHeight` |
| `lib/` | Redux store, slices, `i18n.ts` |
| `services/api.ts` | Data fetching |
| `types/` | `map.ts`, `geolocation.ts` |
| `utils/` | Prefecture handlers, `ViewportCalculator`, styles, grouping |
| `constants/` | Japan view, tile URLs, animation tuning |
| `locales/` | en/ja JSON (also mirrored under `public/locales` if used at runtime) |
| `test/setup.ts` | Vitest geolocation/permissions mocks |

## Map components (`src/components/map/`)

| File | Role |
|------|------|
| `JapanMap.tsx` | Main `MapGL` shell, layers, state wiring |
| `MapControlStack.tsx` | Zoom, GPS, return-to-Japan (DOM controls, not MapLibre `IControl`) |
| `MapRefBinder.tsx` / `MapMoveHandler.tsx` | Ref and move/end handlers |
| `BasemapTileLayer.tsx` | Raster GSI/Carto rules (via style) |
| `PrefecturePopup.tsx` | Prefecture detail popup |
| `TrackMarker.tsx` | Visit markers |
| `CurrentPositionMarker.tsx` | User location + accuracy circle |
| `MapStyles.tsx` | Layer paint/filters |
| `MapEventHandler.tsx` | Legacy/helper event wiring where needed |
| `GPSControlButton.tsx`, `ReturnToJapanButton.tsx` | **Deprecated stubs** for old Leaflet tests |

## `public/`

- `data/` — GeoJSON and images
- `locales/` — translations
- PWA assets

## Conventions

- Components: PascalCase (`JapanMap.tsx`)
- Hooks: `use*` camelCase
- CSS modules: `ComponentName.module.css`
- Imports: prefer `@/` alias; type-only imports when appropriate
- Feature grouping: map vs ui vs providers
