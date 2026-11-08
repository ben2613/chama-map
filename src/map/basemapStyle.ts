import type { StyleSpecification } from 'maplibre-gl';
import {
  WORLD_RASTER_TILES,
  WORLD_BASEMAP_ATTRIBUTION,
  GSI_RASTER_TILES,
  GSI_PALE_TILE_ATTRIBUTION,
} from '@/constants/mapTileConstants';

export const WORLD_LAYER_ID = 'world-layer';
export const GSI_LAYER_ID = 'gsi-layer';

export function createBasemapStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      world: {
        type: 'raster',
        tiles: WORLD_RASTER_TILES,
        tileSize: 256,
        attribution: WORLD_BASEMAP_ATTRIBUTION,
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
        id: WORLD_LAYER_ID,
        type: 'raster',
        source: 'world',
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
