import type { Feature, Point } from 'geojson';
import type { TrackProperties } from '@/types/map';
import { OVERSEAS_PREFECTURE } from '@/utils/mapPrefectureUtils';
import type { DegeocodePoint, DegeocodeResult } from '@/services/degeocodeCountries';

export type CountryLookup = (points: DegeocodePoint[]) => Promise<DegeocodeResult[]>;

/** Sets `country` on overseas track features. Mutates in place. */
export async function assignOverseasCountries(
  features: Feature<Point, TrackProperties>[],
  lookup: CountryLookup
): Promise<void> {
  const overseas = features.filter((f) => f.properties.prefecture === OVERSEAS_PREFECTURE);
  if (overseas.length === 0) return;

  try {
    const points = overseas.map((f) => ({
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));
    const results = await lookup(points);
    for (let i = 0; i < overseas.length; i++) {
      overseas[i].properties.country = results[i]?.country ?? null;
    }
  } catch (err) {
    console.warn('assignOverseasCountries failed:', err);
    for (const f of overseas) {
      f.properties.country = null;
    }
  }
}
