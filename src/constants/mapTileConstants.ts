import { geoBounds, type GeoBounds } from '@/map/geoBounds';
import { MapProjection } from '@/map/mapProjection';
import { JAPAN_BOUNDS } from '@/constants/japanMapConstants';

export const CARTO_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const CARTO_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const GSI_PALE_TILE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
export const GSI_PALE_TILE_ATTRIBUTION =
  '出典: <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院（地理院タイル）</a>';

/**
 * Ja locale + viewport outside Japan: switch to Carto only when zoom >= this level.
 * Below threshold, keep GSI (e.g. wide world pan). Tweak for testing.
 */
export const OUTSIDE_JAPAN_CARTO_MIN_ZOOM = 8;

function japanTileBounds(): GeoBounds {
  return geoBounds(
    [JAPAN_BOUNDS.south, JAPAN_BOUNDS.west],
    [JAPAN_BOUNDS.north, JAPAN_BOUNDS.east]
  );
}

export function isMapViewOverJapan(map: MapProjection): boolean {
  return map.getBounds().intersects(japanTileBounds());
}

/** Whether to use GSI pale tiles (false = Carto). */
export function shouldUseJapaneseBasemap(map: MapProjection, useJapaneseSource: boolean): boolean {
  if (!useJapaneseSource) return false;
  if (isMapViewOverJapan(map)) return true;
  return map.getZoom() < OUTSIDE_JAPAN_CARTO_MIN_ZOOM;
}

export function buildCartoTileUrl(coords: { x: number; y: number; z: number }): string {
  const subdomain = ['a', 'b', 'c', 'd'][Math.abs(coords.x) % 4];
  const retina =
    typeof window !== 'undefined' &&
    window.devicePixelRatio > 1;
  return CARTO_TILE_URL.replace('{s}', subdomain)
    .replace('{z}', String(coords.z))
    .replace('{x}', String(coords.x))
    .replace('{y}', String(coords.y))
    .replace('{r}', retina ? '@2x' : '');
}

/** Carto raster tile URL for MapLibre raster sources ({x}/{y} template). */
export const CARTO_RASTER_TILES = [
  'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
  'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
  'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
  'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
];

export const GSI_RASTER_TILES = [GSI_PALE_TILE_URL];
