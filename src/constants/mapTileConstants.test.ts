import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geoBounds, type GeoBounds } from '@/map/geoBounds';
import type { MapProjection } from '@/map/mapProjection';
import { buildCartoTileUrl, isMapViewOverJapan, shouldUseJapaneseBasemap } from './mapTileConstants';

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

    it('switches to Carto outside Japan at or above zoom threshold', () => {
      expect(shouldUseJapaneseBasemap(outsideJapanMap(8), true)).toBe(false);
      expect(shouldUseJapaneseBasemap(outsideJapanMap(12), true)).toBe(false);
    });
  });

  describe('buildCartoTileUrl', () => {
    it('builds a Carto tile URL for the given coordinates', () => {
      vi.stubGlobal('window', { devicePixelRatio: 1 });
      expect(buildCartoTileUrl({ x: 10, y: 20, z: 6 })).toBe(
        'https://c.basemaps.cartocdn.com/light_all/6/10/20.png'
      );
    });
  });
});
