# Smart prefecture popup positioning

## Implementation status (MapLibre)

| Item | Location |
|------|----------|
| Click handling | `utils/mapPrefectureUtils.ts` — `handlePrefectureMapClick` (MapLibre layer events) |
| Viewport math | `utils/ViewportCalculator.ts` + `MapProjection`, `GeoBounds` |
| Click state | `utils/ClickPositionManager.ts` |
| Types | `types/map.ts` — `SmartPositionConfig` |
| Popup | `PrefecturePopup.tsx` |
| Orchestration | `JapanMap.tsx` — selection state, `positionConfig`, `popupKey` |

Prefecture interaction uses **fill layer click** and **feature-state hover** (`src/map/layerIds.ts`), not Leaflet `onEachFeature`.

---

## Introduction

At high zoom, anchoring the prefecture popup at the prefecture center can pan the map uncomfortably. When the center is outside the viewport, position the popup at the **click location** (validated inside the prefecture), while keeping the popup fully visible and clear of controls.

## Requirements

### Requirement 1: Viewport boundary detection

**Acceptance criteria**

1. On prefecture click, determine current viewport boundaries.
2. Check whether prefecture center is inside viewport bounds.
3. If center is inside → use center for popup anchor.
4. If center is outside → use click position.
5. Account for popup dimensions so the full popup fits.

### Requirement 2: Click position capture

**Acceptance criteria**

1. Capture exact geographic coordinates of the click.
2. Pass click position to the popup flow.
3. Validate click lies within the clicked prefecture (`@turf/boolean-point-in-polygon`).
4. Fallback to center if click invalid/unavailable.
5. Hold click position until popup closes or another prefecture is selected.

### Requirement 3: Smart popup positioning logic

**Acceptance criteria**

1. Center visible → popup at center.
2. Center not visible → popup at click location.
3. Avoid placing popup outside viewport.
4. Adjust position if click would clip the popup.
5. Consistent behavior across zoom levels and map sizes.

### Requirement 4: Popup visibility and accessibility

**Acceptance criteria**

1. Popup fully visible in viewport.
2. Auto-adjust when near edges.
3. Padding from viewport edges.
4. Avoid overlapping map controls (zoom, GPS, home — `.maplibregl-ctrl`, `.chama-map-control`).
5. Keyboard accessibility preserved.

### Requirement 5: Performance

**Acceptance criteria**

1. Viewport calculation completes quickly after click.
2. No noticeable delay before popup shows.
3. Cache viewport calculations where useful.
4. Efficient on mobile.
5. No meaningful map render regression.

### Requirement 6: Integration with existing popup system

**Acceptance criteria**

1. Works with `PrefecturePopup` content and behavior.
2. Same content regardless of anchor strategy.
3. Consistent close behavior.
4. Compatible with popup refs and Redux-adjacent state in `JapanMap`.
5. Track list and navigation unchanged.

### Requirement 7: Edge cases

**Acceptance criteria**

1. Boundary clicks handled gracefully.
2. Extreme zoom levels handled.
3. Small viewports prioritize visibility.
4. Rapid clicks do not corrupt state.
5. In-flight map motion accounted for (`MapMoveHandler` / fresh bounds).

### Requirement 8: Fallback and errors

**Acceptance criteria**

1. Viewport calculation failure → center fallback.
2. Click capture failure → center fallback.
3. Log errors, continue with fallback.
4. Graceful degradation.
5. User can always open prefecture information.

## Design notes (MapLibre)

**Flow**

1. User clicks prefecture fill layer → `handlePrefectureMapClick`.
2. Build `SmartPositionConfig` using `ViewportCalculator` and `MapProjection` (replaces Leaflet `getBounds()` / `L.LatLng`).
3. `PrefecturePopup` receives anchor from `positionConfig` (center vs click vs adjusted).
4. `ClickPositionManager` tracks transient click data between open/close.

**Control avoidance:** scan DOM for MapLibre default controls and custom `chama-map-control` nodes when computing safe popup placement.

**Tests:** `ViewportCalculator.test.ts` and `ClickPositionManager.test.ts` are active; Leaflet integration property tests remain excluded until MapLibre popup harness exists.
