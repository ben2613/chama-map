import { describe, expect, it } from 'vitest';
import { tilesetRegionContainsPoint } from './plateauXingResolver';

describe('tilesetRegionContainsPoint', () => {
  it('matches Osaka Miyakojima tileset bounds sample', () => {
    const region = [2.3652019607465706, 0.6054781638455512, 2.365630710609192, 0.6061587418614116, 36, 182];
    const lng = (((region[0] + region[2]) / 2) * 180) / Math.PI;
    const lat = (((region[1] + region[3]) / 2) * 180) / Math.PI;
    expect(tilesetRegionContainsPoint(region, lng, lat)).toBe(true);
    expect(tilesetRegionContainsPoint(region, 139.76, 35.68)).toBe(false);
  });
});
