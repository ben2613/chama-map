import { geoBounds, type GeoBounds } from '@/map/geoBounds';
import { MapProjection } from '@/map/mapProjection';
import { JAPAN_BOUNDS } from '@/constants/japanMapConstants';

/**
 * English (Latin) place labels in Japan — verified vs Wikimedia osm-intl (still Japanese there).
 * Esri tile scheme is `{z}/{y}/{x}` (note y/x order).
 * Terms: https://developers.arcgis.com/documentation/mapping-apis-and-services/deployment/terms-of-use/
 */
export const WORLD_BASEMAP_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
export const WORLD_BASEMAP_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a>';

export const GSI_PALE_TILE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
export const GSI_PALE_TILE_ATTRIBUTION =
  '出典: <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院（地理院タイル）</a>';

/**
 * Ja locale + viewport outside Japan: switch to world basemap only when zoom >= this level.
 * Below threshold, keep GSI (e.g. wide world pan). Tweak for testing.
 */
export const OUTSIDE_JAPAN_WORLD_BASEMAP_MIN_ZOOM = 8;

function japanTileBounds(): GeoBounds {
  return geoBounds(
    [JAPAN_BOUNDS.south, JAPAN_BOUNDS.west],
    [JAPAN_BOUNDS.north, JAPAN_BOUNDS.east]
  );
}

export function isMapViewOverJapan(map: MapProjection): boolean {
  return map.getBounds().intersects(japanTileBounds());
}

/** Whether to use GSI pale tiles (false = Esri world street / English labels). */
export function shouldUseJapaneseBasemap(map: MapProjection, useJapaneseSource: boolean): boolean {
  if (!useJapaneseSource) return false;
  if (isMapViewOverJapan(map)) return true;
  return map.getZoom() < OUTSIDE_JAPAN_WORLD_BASEMAP_MIN_ZOOM;
}

export function buildWorldBasemapTileUrl(coords: { x: number; y: number; z: number }): string {
  return WORLD_BASEMAP_TILE_URL.replace('{z}', String(coords.z))
    .replace('{y}', String(coords.y))
    .replace('{x}', String(coords.x));
}

export const WORLD_RASTER_TILES = [WORLD_BASEMAP_TILE_URL];

export const GSI_RASTER_TILES = [GSI_PALE_TILE_URL];
