# 3D mode (Project PLATEAU via Source Cooperative `xing`)

**Status:** Implemented (V1 — deck.gl Tile3DLayer + Source Cooperative xing LOD1 per prefecture)  
**Data:** [smartmaps/xing](https://source.coop/smartmaps/xing) — PLATEAU 3D Tiles + MVT (spec V3 mirror; catalog last updated 2025-08-21).

## Goals

- Optional pitched “3D mode” with PLATEAU building geometry; default remains flat 2D (`maxPitch: 0`).
- Top-right **3D toggle** in a horizontal row immediately **to the left** of the existing control column (compass, prefecture overlay, language, GPS).
- Attribution and license notes in the info panel.

## Non-goals (V1)

- Cesium ion, MLIT `plateauview` `latest` composite URLs (swap tile base later without UI change).
- Nationwide LOD3 / deck.gl 3D Tiles (follow-up if MVT extrusion is insufficient).
- Terrain mesh / offline 3D.

## UX

| Piece | Behavior |
|--------|----------|
| Default | `maxPitch={0}`, `touchPitch={false}`. |
| 3D on | `maxPitch` ~55°, `touchPitch={true}`; ease pitch ~45° when zoom ≥ building min. |
| 3D off | `easeTo({ pitch: 0 })`, remove building layers. |
| Return to Japan | Flatten pitch during fly (readability at zoom 6). |
| Compass | Resets bearing + pitch to 0 (unchanged). |

Persistence: `localStorage` key `chama-map-3d-mode`, default off.

## Rendering

1. **V1 (shipped):** deck.gl `Tile3DLayer` against `xing` LOD1 `tileset.json` (per-prefecture representative URL).
2. **V2 (optional):** Ward-level tileset index or MVT if added to `xing`.

Constants and URLs: `src/constants/plateau3dConstants.ts`.

## Zoom / performance gates

| Gate | Value |
|------|--------|
| Min zoom to load buildings | 14 |
| Min zoom to allow pitch in 3D mode | 14 |
| Max zoom (soft cap for 3D) | 18 |
| Geographic gate | Center inside `JAPAN_BOUNDS` |
| Debounce | ~200 ms on `moveend` / `zoomend` before (re)loading MVT |

Below min zoom: hide building layer; tooltip explains “zoom in for 3D buildings.”

## License / info panel

- [PLATEAU site policy](https://www.mlit.go.jp/plateau/site-policy/) (PDL 1.0 / CC BY–compatible); credit 国土交通省 Project PLATEAU.
- Distribution: [UN Smart Maps / Source Cooperative `xing`](https://source.coop/smartmaps/xing).
- Note mirror date and per-municipality vintages; this app processes/forwards tiles only.

## Implementation phases

| Phase | Deliverable |
|-------|-------------|
| 0 | Verify `xing` MVT / tileset URLs; constants file |
| 1 | Toggle UI, pitch caps, zoom gates, Japan bounds |
| 2 | MVT fill-extrusion layer lifecycle |
| 3 | Info panel + i18n attribution |
| 4 | (Optional) deck.gl 3D Tiles at high zoom |

## Code touch list

- `JapanMap.tsx` — dynamic pitch, 3D state, buildings child
- `MapTopControlStack.tsx` — horizontal layout + toggle
- `Mode3DToggle.tsx`, `Map3DBuildings.tsx`
- `plateau3dConstants.ts`
- `InfoPanel.tsx`, `public/locales/*`, `src/locales/*`
