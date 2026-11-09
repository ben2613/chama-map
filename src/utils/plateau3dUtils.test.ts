import { describe, expect, it } from 'vitest';
import { isJapanCenterFor3D, shouldLoadPlateauBuildings } from './plateau3dUtils';
import { PLATEAU_3D_MIN_ZOOM, PLATEAU_3D_MAX_ZOOM } from '@/constants/plateau3dConstants';

describe('plateau3dUtils', () => {
  it('gates building loads by zoom and Japan bounds', () => {
    expect(shouldLoadPlateauBuildings(true, PLATEAU_3D_MIN_ZOOM, 35.68, 139.76)).toBe(true);
    expect(shouldLoadPlateauBuildings(true, PLATEAU_3D_MIN_ZOOM - 1, 35.68, 139.76)).toBe(false);
    expect(shouldLoadPlateauBuildings(true, PLATEAU_3D_MAX_ZOOM + 1, 35.68, 139.76)).toBe(false);
    expect(shouldLoadPlateauBuildings(false, PLATEAU_3D_MIN_ZOOM, 35.68, 139.76)).toBe(false);
    expect(shouldLoadPlateauBuildings(true, PLATEAU_3D_MIN_ZOOM, 0, 0)).toBe(false);
  });

  it('recognizes Japan bounding box', () => {
    expect(isJapanCenterFor3D(36.2, 138.2)).toBe(true);
    expect(isJapanCenterFor3D(10, 100)).toBe(false);
  });
});
