import { FootageProperties, PrefectureProperties } from '@/types/map';
import type { FeatureCollection, MultiPolygon, Point, Position } from 'geojson';

export async function getChamaFootage(): Promise<FeatureCollection<Point, FootageProperties>> {
  const res = await fetch('/data/chama-footage.geojson');
  const data = await res.json();
  return data;
}

export async function getJapanPrefectures(): Promise<FeatureCollection<MultiPolygon, PrefectureProperties>> {
  const res = await fetch('/data/japan-prefectures.geojson');
  const data = await res.json();
  // set center of each feature
  for (const feature of data.features) {
    const coords =
      feature.geometry.type === 'Polygon'
        ? feature.geometry.coordinates[0]
        : feature.geometry.type === 'MultiPolygon'
        ? feature.geometry.coordinates[0][0]
        : null;
    if (coords && coords.length > 0) {
      // Average the coordinates for a rough center
      const avg = coords.reduce((acc: Position, cur: Position) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]);
      feature.properties.center = [avg[1] / coords.length, avg[0] / coords.length];
    }
  }
  return data;
}
