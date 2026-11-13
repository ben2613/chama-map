import { describe, expect, it } from 'vitest';
import type { FeatureCollection, Point } from 'geojson';
import type { TrackProperties } from '@/types/map';
import { buildSpotSearchIndex, searchSpots } from './spotSearch';

const sampleTrack: FeatureCollection<Point, TrackProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [139.69, 35.68] },
      properties: {
        prefecture: 'Tokyo',
        icon: '',
        title: 'old',
        layerName: 'Trips',
        name: 'Tokyo Tower',
        nameJp: '東京タワー',
        images: [],
        links: [],
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [135.5, 34.69] },
      properties: {
        prefecture: 'Osaka',
        icon: '',
        title: '',
        layerName: 'Trips',
        name: 'Dotonbori',
        nameJp: '道頓堀',
        images: [],
        links: [],
      },
    },
  ],
};

describe('spotSearch', () => {
  it('deduplicates by grouping key', () => {
    const dup: FeatureCollection<Point, TrackProperties> = {
      ...sampleTrack,
      features: [...sampleTrack.features, { ...sampleTrack.features[0] }],
    };
    expect(buildSpotSearchIndex(dup)).toHaveLength(2);
  });

  it('matches English and Japanese names', () => {
    const index = buildSpotSearchIndex(sampleTrack);
    expect(searchSpots(index, 'tower').map((r) => r.nameEn)).toContain('Tokyo Tower');
    expect(searchSpots(index, '東京').map((r) => r.nameJa)).toContain('東京タワー');
  });

  it('matches prefecture', () => {
    const index = buildSpotSearchIndex(sampleTrack);
    const hits = searchSpots(index, 'osaka');
    expect(hits.some((h) => h.nameEn === 'Dotonbori')).toBe(true);
  });
});
