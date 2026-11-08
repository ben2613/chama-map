import type { StyleSpecification } from 'maplibre-gl';
import {
  CARTO_RASTER_TILES,
  CARTO_TILE_ATTRIBUTION,
  GSI_RASTER_TILES,
  GSI_PALE_TILE_ATTRIBUTION,
} from '@/constants/mapTileConstants';

export const CARTO_LAYER_ID = 'carto-layer';
export const GSI_LAYER_ID = 'gsi-layer';

export function createBasemapStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      carto: {
        type: 'raster',
        tiles: CARTO_RASTER_TILES,
        tileSize: 256,
        attribution: CARTO_TILE_ATTRIBUTION,
      },
      gsi: {
        type: 'raster',
        tiles: GSI_RASTER_TILES,
        tileSize: 256,
        attribution: GSI_PALE_TILE_ATTRIBUTION,
      },
    },
    layers: [
      {
        id: CARTO_LAYER_ID,
        type: 'raster',
        source: 'carto',
        layout: { visibility: 'visible' },
      },
      {
        id: GSI_LAYER_ID,
        type: 'raster',
        source: 'gsi',
        layout: { visibility: 'none' },
      },
    ],
  };
}
