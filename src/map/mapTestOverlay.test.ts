import { describe, it, expect } from 'vitest';
import { isMapTestOverlayEnabled, isPrefectureOverlaySkipped } from './mapTestOverlay';

describe('mapTestOverlay flags', () => {
  it('enables test overlay only in dev with query flag', () => {
    expect(isMapTestOverlayEnabled('', true)).toBe(false);
    expect(isMapTestOverlayEnabled('?testOverlay=1', true)).toBe(true);
    expect(isMapTestOverlayEnabled('?testOverlay=1', false)).toBe(false);
  });

  it('skips prefecture overlay only in dev with noPrefecture', () => {
    expect(isPrefectureOverlaySkipped('', true)).toBe(false);
    expect(isPrefectureOverlaySkipped('?noPrefecture=1', true)).toBe(true);
    expect(isPrefectureOverlaySkipped('?noPrefecture=1', false)).toBe(false);
  });
});
