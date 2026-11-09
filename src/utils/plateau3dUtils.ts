import { JAPAN_BOUNDS } from '@/constants/japanMapConstants';
import { PLATEAU_3D_MAX_ZOOM, PLATEAU_3D_MIN_ZOOM } from '@/constants/plateau3dConstants';

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

export { resolvePlateauXingTilesetUrl } from '@/utils/plateauXingResolver';
