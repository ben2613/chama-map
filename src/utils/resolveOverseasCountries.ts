import type { Feature, Point } from 'geojson';
import type { TrackProperties } from '@/types/map';
import { OVERSEAS_PREFECTURE } from '@/utils/mapPrefectureUtils';
import { fetchCountries } from '@/services/degeocode';

/** Sets `country` on overseas track features via degeocode. Mutates in place. */
export async function resolveOverseasCountries(
  features: Feature<Point, TrackProperties>[]
): Promise<void> {
  const overseas = features.filter((f) => f.properties.prefecture === OVERSEAS_PREFECTURE);
  if (overseas.length === 0) return;

  try {
    const points = overseas.map((f) => ({
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));
    const results = await fetchCountries(points);
    for (let i = 0; i < overseas.length; i++) {
      overseas[i].properties.country = results[i]?.country ?? null;
    }
  } catch (err) {
    console.warn('resolveOverseasCountries failed:', err);
    for (const f of overseas) {
      f.properties.country = null;
    }
  }
}
