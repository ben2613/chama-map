# Leaflet → MapLibre GL JS migration plan

Project documentation (product, structure, features, testing) lives in [docs/README.md](./README.md).

**Branch:** `cursor/maplibre-revamp-6938`  
**Stack:** `maplibre-gl` + `react-map-gl` (MapLibre backend)  
**Status:** Core port on branch — build green; legacy Leaflet tests excluded pending MapLibre harness; **UI QA in local IDE**.

## Goals

- Replace `leaflet` / `react-leaflet` with MapLibre for basemap, GeoJSON, markers, and popups.
- Preserve smart prefecture popup positioning (`ViewportCalculator`) and GSI/Carto basemap switching.
- Keep GPS, return-to-Japan, and track marker behavior.

## Non-goals (this PR)

- Vector tile style JSON / 3D terrain.
- Re-enabling commented `SmoothWheelZoom` (separate follow-up if needed).
- Full rewrite of every integration test mock (stabilize core unit tests first).

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Migration plan + `MapProjection` adapter | ✅ |
| 1 | Dependencies, Vite chunks, global CSS | ✅ |
| 2 | `JapanMap` shell (Map, controls layout, longitude wrap) | ✅ |
| 3 | Raster basemaps (Carto / GSI, locale + viewport rules) | ✅ |
| 4 | Prefecture GeoJSON (hover via feature-state, click → smart popup) | ✅ |
| 5 | Track markers + prefecture popup (HTML Marker / Popup) | ✅ |
| 6 | GPS + geolocation marker + accuracy circle | ✅ |
| 7 | Port `ViewportCalculator` + `mapPrefectureUtils` off Leaflet types | ✅ |
| 8 | Tests + lint + build | 🟡 (unit tests green; legacy suites excluded) |
| 9 | Manual UI QA (local IDE) | ⬜ — owner |

## Architecture

```
JapanMap (react-map-gl Map)
  ├── BasemapSource (raster: gsi | carto)
  ├── PrefectureLayers (fill + line, feature-state hover)
  ├── TrackMarkerOverlay[] (Marker + Popup)
  ├── PrefecturePopupOverlay
  ├── CurrentPositionOverlay
  └── MapControlStack (zoom, GPS, return-to-Japan — DOM, not IControl)

MapProjection — thin facade over maplibregl.Map for ViewportCalculator
GeoBounds — LatLngBounds-like type (contains, intersects, N/S/E/W)
```

## Risks

1. **Smart popup** — control avoidance must target `.maplibregl-ctrl` / custom control class.
2. **World copies** — `renderWorldCopies` + `normalizeLongitude` on `moveend`.
3. **Imperative track popup** — `TrackMarkerHandle.openPopup()` via ref on Marker.
4. **Test mocks** — large Leaflet mock surface; prioritize `ViewportCalculator` + `mapTileConstants` unit tests.

## UI QA checklist (local)

- [ ] Prefecture click popup placement (corners, mobile)
- [ ] Bottom-right control stack (zoom, GPS, home)
- [ ] GSI when ja + over Japan; Carto when zoomed out abroad
- [ ] Fly-to GPS and return-to-Japan
- [ ] Track marker popups + single-track prefecture shortcut
- [ ] Geolocation accuracy circle

## Completion criteria

- No runtime imports from `leaflet` / `react-leaflet`.
- `npm run build` and `npm run test` pass (integration tests may be quarantined with `describe.skip` only if documented).
