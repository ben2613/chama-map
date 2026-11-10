import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Feature, Point } from 'geojson';
import type { TrackProperties } from '@/types/map';
import { OVERSEAS_PREFECTURE } from '@/utils/mapPrefectureUtils';
import { resolveOverseasCountries } from './resolveOverseasCountries';
import * as degeocode from '@/services/degeocode';

vi.mock('@/services/degeocode', () => ({
  fetchCountries: vi.fn(),
}));

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

describe('resolveOverseasCountries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assigns country codes from degeocode onto overseas features', async () => {
    vi.mocked(degeocode.fetchCountries).mockResolvedValue([
      { lat: 14.6, lng: 121.0, country: 'PH' },
      { lat: 51.5, lng: -0.1, country: 'GB' },
    ]);

    const features = [overseasFeature(121.0, 14.6), overseasFeature(-0.1, 51.5)];
    await resolveOverseasCountries(features);

    expect(features[0].properties.country).toBe('PH');
    expect(features[1].properties.country).toBe('GB');
    expect(degeocode.fetchCountries).toHaveBeenCalledWith([
      { lat: 14.6, lng: 121.0 },
      { lat: 51.5, lng: -0.1 },
    ]);
  });

  it('skips non-overseas features', async () => {
    const tokyo: Feature<Point, TrackProperties> = {
      ...overseasFeature(139.7, 35.7),
      properties: { ...overseasFeature(139.7, 35.7).properties, prefecture: 'Tokyo' },
    };
    await resolveOverseasCountries([tokyo]);
    expect(degeocode.fetchCountries).not.toHaveBeenCalled();
    expect(tokyo.properties.country).toBeUndefined();
  });
});
