# Current position marker and GPS control

## Implementation status (MapLibre)

| Item | Location |
|------|----------|
| Hook | `hooks/useGeolocation.ts`, types in `types/geolocation.ts` |
| Marker + accuracy | `CurrentPositionMarker.tsx` — `Marker` / circle via react-map-gl |
| GPS control | `MapControlStack.tsx` — locate + flyTo when position known |
| Wiring | `JapanMap.tsx` — permission flow, `handleGPSClick` |
| Styles | `CurrentPositionMarker.module.css` |

Legacy `GPSControlButton.tsx` is a **null stub** for excluded Leaflet tests.

---

## Introduction

Shows the user's real-time location on the map with a distinct marker and accuracy visualization, plus a GPS button to center the map. Supports the "Seichi-junrei" use case: seeing proximity to Haachama visit sites.

## Requirements

### Requirement 1: Location permission management

**Acceptance criteria**

1. Request permission when needed through the browser.
2. If denied, do not show marker; avoid further requests.
3. On grant, begin acquiring location.
4. If denied, show how to enable location access.
5. If previously granted, start tracking without re-prompting.

### Requirement 2: Current position display

**Acceptance criteria**

1. Show marker at acquired coordinates.
2. Visually distinct from track markers.
3. Update position in real time when location changes.
4. Localized tooltip ("Current Location" / "現在地").
5. Stays aligned when panning/zooming.

### Requirement 3: Location accuracy indication

**Acceptance criteria**

1. Show accuracy circle when radius is available.
2. Circle size proportional to reported accuracy.
3. Warn when accuracy is very poor (>1000 m).
4. Semi-transparent, distinct styling.
5. Update circle as accuracy improves.

### Requirement 4: Error handling

**Acceptance criteria**

1. Timeout → appropriate message.
2. Unavailable services → continue without marker.
3. Permission revoked → remove marker.
4. Network issues → retain last known position where reasonable.
5. Retry for failed requests.

### Requirement 5: Performance and battery

**Acceptance criteria**

1. High accuracy when map is actively viewed.
2. Reduce update frequency when backgrounded.
3. Stop tracking after inactivity.
4. Resume on map interaction.
5. Sensible update interval on mobile.

### Requirement 6: GPS control button

**Acceptance criteria**

1. GPS button near zoom controls.
2. Recognizable location icon.
3. Click → smooth pan/center on user position.
4. Disabled/hidden when permission denied.
5. Loading state while acquiring.
6. Consistent styling with other controls.
7. Visually disabled when location unavailable.

### Requirement 7: Internationalization

**Acceptance criteria**

1. Tooltip EN/JA.
2. Localized error messages.
3. Localized accuracy warnings.
4. Permission UI follows browser locale where applicable.
5. Consistent with app i18n.

## Design notes (MapLibre)

- Geolocation logic remains **browser API + React hook**; only map rendering changed.
- Marker uses **react-map-gl** `Marker` (and layer/source for accuracy circle as implemented in `CurrentPositionMarker.tsx`).
- GPS flyTo in `MapControlStack`: `map.flyTo([lat, lng], Math.max(zoom, 15), { duration: 1 })` when `position` is set; otherwise triggers `onLocate()` from `JapanMap`.

Default hook options in `JapanMap`: `enableHighAccuracy: true`, `timeout: 10000`, `maximumAge: 60000`.

Testing: `useGeolocation.test.ts` remains active; component/integration Leaflet tests excluded — see [TESTING.md](../TESTING.md).
