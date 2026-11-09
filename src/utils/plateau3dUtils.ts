import type { FeatureCollection, MultiPolygon } from 'geojson';
import type { PrefectureProperties } from '@/types/map';
import { JAPAN_BOUNDS } from '@/constants/japanMapConstants';
import {
  PLATEAU_3D_MAX_ZOOM,
  PLATEAU_3D_MIN_ZOOM,
  PLATEAU_XING_LOD1_BY_PREFECTURE,
} from '@/constants/plateau3dConstants';
import { getPrefectureForPoint } from '@/utils/mapPrefectureUtils';

export function isJapanCenterFor3D(lat: number, lng: number): boolean {
  return (
    lat >= JAPAN_BOUNDS.south &&
    lat <= JAPAN_BOUNDS.north &&
    lng >= JAPAN_BOUNDS.west &&
    lng <= JAPAN_BOUNDS.east
  );
}

export function shouldLoadPlateauBuildings(enabled: boolean, zoom: number, lat: number, lng: number): boolean {
  if (!enabled) return false;
  if (zoom < PLATEAU_3D_MIN_ZOOM || zoom > PLATEAU_3D_MAX_ZOOM) return false;
  return isJapanCenterFor3D(lat, lng);
}

export function resolvePlateauXingTilesetUrl(
  coordinates: [number, number],
  japanData: FeatureCollection<MultiPolygon, PrefectureProperties>
): string | null {
  const prefecture = getPrefectureForPoint(coordinates, japanData);
  if (!prefecture) return null;
  return PLATEAU_XING_LOD1_BY_PREFECTURE[prefecture] ?? null;
}
