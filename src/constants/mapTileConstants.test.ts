import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geoBounds, type GeoBounds } from '@/map/geoBounds';
import type { MapProjection } from '@/map/mapProjection';
import { buildWorldBasemapTileUrl, isMapViewOverJapan, shouldUseJapaneseBasemap } from './mapTileConstants';

function mockMap(bounds: GeoBounds, zoom = 10): MapProjection {
  return {
    getBounds: () => bounds,
    getZoom: () => zoom,
  } as MapProjection;
}

describe('mapTileConstants', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isMapViewOverJapan', () => {
    it('returns true when viewport intersects Japan', () => {
      const map = mockMap(geoBounds([35, 138], [37, 140]));
      expect(isMapViewOverJapan(map)).toBe(true);
    });

    it('returns false when viewport is far from Japan', () => {
      const map = mockMap(geoBounds([40, -75], [42, -73]));
      expect(isMapViewOverJapan(map)).toBe(false);
    });
  });

  describe('shouldUseJapaneseBasemap', () => {
    const outsideJapanMap = (zoom: number) => mockMap(geoBounds([40, -75], [42, -73]), zoom);

    it('returns false for non-ja locale', () => {
      expect(shouldUseJapaneseBasemap(outsideJapanMap(10), false)).toBe(false);
    });

    it('returns true when viewport is over Japan', () => {
      const map = mockMap(geoBounds([35, 138], [37, 140]), 10);
      expect(shouldUseJapaneseBasemap(map, true)).toBe(true);
    });

    it('keeps GSI outside Japan below zoom threshold', () => {
      expect(shouldUseJapaneseBasemap(outsideJapanMap(7), true)).toBe(true);
    });

    it('switches to world basemap outside Japan at or above zoom threshold', () => {
      expect(shouldUseJapaneseBasemap(outsideJapanMap(8), true)).toBe(false);
      expect(shouldUseJapaneseBasemap(outsideJapanMap(12), true)).toBe(false);
    });
  });

  describe('buildWorldBasemapTileUrl', () => {
    it('builds an Esri world street tile URL (z/y/x order)', () => {
      expect(buildWorldBasemapTileUrl({ x: 227, y: 101, z: 8 })).toBe(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/8/101/227'
      );
    });
  });
});
