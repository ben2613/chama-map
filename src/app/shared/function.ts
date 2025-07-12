import { PrefectureProperties } from '@/types/map';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { Coord } from '@turf/helpers';
import type { FeatureCollection, MultiPolygon } from 'geojson';

export function getPrefectureForPoint(point: Coord, prefectures: FeatureCollection<MultiPolygon, PrefectureProperties>) {
  for (const feature of prefectures.features) {
    if (booleanPointInPolygon(point, feature)) {
      return feature.properties.nam;
    }
  }
  console.error('No prefecture found for point', point);
  return '';
}