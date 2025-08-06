import { PrefectureProperties } from '@/types/map';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { FeatureCollection, MultiPolygon, Position } from 'geojson';

export function getPrefectureForPoint(
  point: Position,
  prefectures: FeatureCollection<MultiPolygon, PrefectureProperties>
) {
  for (const feature of prefectures.features) {
    if (booleanPointInPolygon(point, feature)) {
      return feature.properties.nam;
    }
  }
  // if no prefecture found, return the closest prefecture, with the prefecture center
  const closestPrefecture = getClosestPrefecture(point, prefectures);
  console.log('No prefecture found for point', point, ', fallback to', closestPrefecture);
  return closestPrefecture;
}

function getClosestPrefecture(point: Position, prefectures: FeatureCollection<MultiPolygon, PrefectureProperties>) {
  let closestPrefecture = '';
  let closestDistance = Infinity;
  for (const feature of prefectures.features) {
    const distance = getDistance(point, feature.properties.center);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPrefecture = feature.properties.nam;
    }
  }
  return closestPrefecture;
}

function getDistance(point: Position, center: Position) {
  return Math.sqrt((point[1] - center[0]) ** 2 + (point[0] - center[1]) ** 2);
}
