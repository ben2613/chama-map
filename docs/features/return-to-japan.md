# Return to Japan control

## Implementation status (MapLibre)

| Item | Location |
|------|----------|
| UI | `MapControlStack.tsx` — home button with `FaHouse`, bottom-right stack |
| Navigation | `JapanMap.tsx` — `flyTo` via `MapProjection` / map ref |
| Constants | `constants/japanMapConstants.ts` — `JAPAN_DEFAULT_VIEW`, `ANIMATION_CONFIG` |
| i18n | `locales/en`, `locales/ja` — tooltip and ARIA strings |

Legacy `ReturnToJapanButton.tsx` is a **null stub** kept only for excluded Leaflet-era tests.

---

## Introduction

Users who fly the map to their GPS position far from Japan need a quick way back to the default Japan view. A home control recenters on Japan (~36.2°N, 138.3°E, zoom 6) with a smooth animation.

## Requirements

### Requirement 1: Return to Japan button display

**User story:** As a user, I want a clearly visible "Return to Japan" button on the map, so that I can easily navigate back to Japan from any location.

**Acceptance criteria**

1. The control shall be displayed near other navigation controls.
2. It shall use a recognizable home/Japan-related icon.
3. It shall be positioned consistently (bottom-right area).
4. It shall match GPS and zoom control styling.
5. It shall be visible at all zoom levels and positions.

### Requirement 2: Navigation to Japan view

**User story:** As a user, I want to click the button to smoothly navigate back to Japan.

**Acceptance criteria**

1. On click, animate to center **36.2048°N, 138.2529°E**.
2. Set zoom level **6** to show prefectures clearly.
3. Use smooth flyTo with appropriate duration and easing.
4. Animation duration between **1–2 seconds**.
5. On completion, frame Japan's main islands clearly.

### Requirement 3: Button state and interaction

**Acceptance criteria**

1. Hover feedback on hover.
2. Brief active/pressed state on click.
3. Loading/active state while animating.
4. Disabled during animation to prevent concurrent flyTo.
5. Normal state restored when animation completes.

### Requirement 4: Accessibility

**Acceptance criteria**

1. Appropriate ARIA labels.
2. Keyboard accessible (Enter/Space).
3. Descriptive tooltip.
4. Localized tooltip (EN/JA).
5. Sufficient color contrast.

### Requirement 5: Internationalization

**Acceptance criteria**

1. English tooltip: "Return to Japan".
2. Japanese tooltip: "日本に戻る".
3. Localized ARIA labels.
4. Icon language-neutral.
5. Integrates with i18n; updates on language change.

### Requirement 6: Performance and responsiveness

**Acceptance criteria**

1. Click response within ~100ms.
2. Smooth animation on mobile.
3. Touch targets ≥44px.
4. Tolerates lower-end devices.
5. Works in portrait and landscape.

### Requirement 7: Integration with existing controls

**Acceptance criteria**

1. No overlap with GPS/zoom controls.
2. Same visual design language.
3. Graceful handling of concurrent animations.
4. No interference with pan/zoom/markers.
5. Consistent spacing across breakpoints.

## Design notes (MapLibre)

Original specs assumed a **Leaflet `L.Control`** with React `createRoot`. The MapLibre port uses a **fixed DOM stack** (`MapControlStack`) with `maplibregl-ctrl` styling class, `useMapProjection()` for `flyTo`/`zoomIn`/`zoomOut`, and animation gating via `isAnimatingToJapan` in `JapanMap`.

Constants:

```typescript
// constants/japanMapConstants.ts
JAPAN_DEFAULT_VIEW.center // [36.2048, 138.2529]
JAPAN_DEFAULT_VIEW.zoom    // 6
```

Testing: see [TESTING.md](../TESTING.md) — Leaflet-based ReturnToJapan tests are excluded pending MapLibre harness.
