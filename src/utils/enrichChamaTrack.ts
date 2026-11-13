import type { FeatureCollection, MultiPolygon, Point } from 'geojson';
import type { PrefectureProperties, TrackProperties } from '@/types/map';
import type { DegeocodeConfig } from '@/services/degeocodeCountries';
import { fetchCountries } from '@/services/degeocodeCountries';
import { getPrefectureForPoint } from '@/utils/mapPrefectureUtils';
import { assignOverseasCountries } from '@/utils/assignOverseasCountries';

/** Prefecture + overseas country assignment for build-time GeoJSON output. */
export async function enrichChamaTrack(
  collection: FeatureCollection<Point, TrackProperties>,
  japan: FeatureCollection<MultiPolygon, PrefectureProperties>,
  degeocode?: DegeocodeConfig
): Promise<void> {
  for (const feature of collection.features) {
    feature.properties.prefecture = getPrefectureForPoint(feature.geometry.coordinates, japan);
  }

  if (!degeocode?.apiKey.trim()) {
    return;
  }

  await assignOverseasCountries(collection.features, (points) =>
    fetchCountries(points, {
      url: degeocode.url,
      apiKey: degeocode.apiKey.trim(),
    })
  );
}
