import type { Feature, FeatureCollection, Point } from 'geojson';
import type { TrackProperties } from '@/types/map';

function normalizeName(properties: TrackProperties): string {
  const candidate =
    (properties.name ?? '').trim() || (properties.nameJp ?? '').trim() || (properties.title ?? '').trim();
  return candidate;
}

function roundCoordinate(value: number, precision: number): string {
  return Number.isFinite(value) ? value.toFixed(precision) : String(value);
}

export function getGroupingKeyForFeature(feature: Feature<Point, TrackProperties>, precision: number): string {
  const name = normalizeName(feature.properties);
  const [lon, lat] = feature.geometry.coordinates;
  const key = `${name}|${roundCoordinate(lon, precision)},${roundCoordinate(lat, precision)}`;
  return key;
}

/**
 * Groups Point features by identical display name and coordinates.
 * Features without matches will appear as a single-element array in the result.
 *
 * precision controls coordinate rounding when grouping to avoid floating-point noise.
 */
export function groupFeaturesByNameAndCoordinates(
  collection: FeatureCollection<Point, TrackProperties>,
  precision: number = 6
): Feature<Point, TrackProperties>[][] {
  const groups = new Map<string, Feature<Point, TrackProperties>[]>();

  for (const feature of collection.features) {
    // Only group valid Point features
    if (feature.geometry.type !== 'Point') continue;
    const key = getGroupingKeyForFeature(feature, precision);
    const arr = groups.get(key);
    if (arr) {
      arr.push(feature);
    } else {
      groups.set(key, [feature]);
    }
  }

  return Array.from(groups.values());
}

/**
 * Same grouping as above, but returns a map keyed by `${name}|${lon},${lat}`.
 */
export function groupMapByNameAndCoordinates(
  collection: FeatureCollection<Point, TrackProperties>,
  precision: number = 6
): Record<string, Feature<Point, TrackProperties>[]> {
  const groupedArrays = groupFeaturesByNameAndCoordinates(collection, precision);
  const result: Record<string, Feature<Point, TrackProperties>[]> = {};
  for (const group of groupedArrays) {
    const first = group[0];
    const key = getGroupingKeyForFeature(first, precision);
    result[key] = group;
  }
  return result;
}
