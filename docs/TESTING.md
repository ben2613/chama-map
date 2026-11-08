# Testing

## Stack

- **Vitest** with **jsdom**, **@testing-library/react**, **@testing-library/jest-dom**
- **fast-check** for property-based tests where used
- Shared setup: `src/test/setup.ts` (geolocation, permissions, `document.hidden`)

Config: `vitest.config.ts` (10s timeout for property tests).

## Manual map overlay check (dev)

While debugging MapLibre GeoJSON layers, load the app with:

- `?testOverlay=1` — hot-pink Kantō test polygon (GeoJSON sanity check)
- `?noPrefecture=1` — skip the real prefecture layer (combine with `testOverlay=1` to isolate basemap vs GeoJSON)

Example: `http://localhost:3000/?testOverlay=1&noPrefecture=1`

## Running tests

```bash
npm test                    # all non-excluded tests
npm test ViewportCalculator # single file (no extra --run; script already uses vitest --run)
npm run test:watch
```

## Legacy Leaflet suites (excluded)

After the MapLibre migration, several suites still mock **Leaflet** / **react-leaflet** and target deprecated control stubs. They are **excluded** in `vitest.config.ts` until rewritten for `MapControlStack` / `react-map-gl`.

Excluded paths include:

- `JapanMap.integration.test.tsx`
- `CurrentPositionMarker*.test.tsx`, `GPSControlButton.test.tsx`
- `ReturnToJapanButton*.test.tsx`, `GeolocationInternationalization.test.tsx`
- `SmartPrefecturePopupPositioning*.test.tsx`, `PrefecturePopup.test.tsx`
- `mapPrefectureUtils.test.ts` (Leaflet handler assumptions)

**Still active** examples: `ViewportCalculator.test.ts`, `ClickPositionManager.test.ts`, `useGeolocation.test.ts`, `mapTileConstants.test.ts`, `ErrorBoundary.test.tsx`.

See [MAP_LIBRE_MIGRATION_PLAN.md](./MAP_LIBRE_MIGRATION_PLAN.md) phase 8.

## Mocking patterns (current)

### Browser APIs

Use or extend `src/test/setup.ts`:

- `navigator.geolocation` — `getCurrentPosition`, `watchPosition`, `clearWatch`
- `navigator.permissions.query`
- `document.hidden` for visibility-based geolocation behavior

### Geolocation hook

```typescript
vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => mockReturnValue,
}));
```

### Map projection (preferred for MapLibre era)

Mock `@/map/useMapProjection` or pass a fake `MapProjection` into pure utilities:

- `flyTo`, `getZoom`, `getCenter`, `getBounds`, `project`, `unproject`

`ViewportCalculator` tests use **`MapProjection`** + **`GeoBounds`** without a live map.

### react-map-gl (integration tests — TODO)

For component tests that mount map children, mock `react-map-gl/maplibre`:

```typescript
vi.mock('react-map-gl/maplibre', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-gl">{children}</div>
  ),
  Marker: ({ children }: { children?: React.ReactNode }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: { children?: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  Source: () => null,
  Layer: () => null,
  useMap: () => mockMapInstance,
}));
```

Align `useMap` behavior with `src/map/useMapProjection.ts` expectations.

### Property-based tests

- Coordinate generators: lat ∈ [-89, 89], lng ∈ [-179, 179]
- Run ≥100 iterations where properties are used
- Tag tests by feature when adding new property suites

### Practices

- Use `data-testid` in mocks for stable queries
- `vi.clearAllMocks()` in `beforeEach` / `afterEach`
- Suppress `console.error` only when testing error boundaries
- Fake timers for inactivity / debounce tests

## Contributing

When fixing an excluded suite for MapLibre, remove its path from `vitest.config.ts` `test.exclude` in the same PR as the harness update.
