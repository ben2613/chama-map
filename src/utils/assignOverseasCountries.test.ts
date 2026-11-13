import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Feature, Point } from 'geojson';
import type { TrackProperties } from '@/types/map';
import { OVERSEAS_PREFECTURE } from '@/utils/mapPrefectureUtils';
import { assignOverseasCountries } from './assignOverseasCountries';

function overseasFeature(lng: number, lat: number): Feature<Point, TrackProperties> {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      prefecture: OVERSEAS_PREFECTURE,
      icon: '',
      title: '',
      layerName: '',
      name: 'x',
      nameJp: 'x',
      images: [],
      links: [],
    },
  };
}

describe('assignOverseasCountries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assigns country codes onto overseas features', async () => {
    const lookup = vi.fn().mockResolvedValue([
      { lat: 14.6, lng: 121.0, country: 'PH' },
      { lat: 51.5, lng: -0.1, country: 'GB' },
    ]);

    const features = [overseasFeature(121.0, 14.6), overseasFeature(-0.1, 51.5)];
    await assignOverseasCountries(features, lookup);

    expect(features[0].properties.country).toBe('PH');
    expect(features[1].properties.country).toBe('GB');
    expect(lookup).toHaveBeenCalledWith([
      { lat: 14.6, lng: 121.0 },
      { lat: 51.5, lng: -0.1 },
    ]);
  });

  it('skips non-overseas features', async () => {
    const lookup = vi.fn();
    const tokyo: Feature<Point, TrackProperties> = {
      ...overseasFeature(139.7, 35.7),
      properties: { ...overseasFeature(139.7, 35.7).properties, prefecture: 'Tokyo' },
    };
    await assignOverseasCountries([tokyo], lookup);
    expect(lookup).not.toHaveBeenCalled();
    expect(tokyo.properties.country).toBeUndefined();
  });
});
