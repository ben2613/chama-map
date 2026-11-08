import { Layer, Source } from 'react-map-gl/maplibre';
import type { FeatureCollection, Polygon } from 'geojson';

const TEST_SOURCE_ID = 'map-test-overlay-src';
const TEST_FILL_LAYER_ID = 'map-test-overlay-fill';
const TEST_LINE_LAYER_ID = 'map-test-overlay-line';

/** Obvious ~Kantō box — confirms GeoJSON layers when `?testOverlay=1`. */
const TEST_GEOJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { label: 'map-test-overlay' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [139.2, 35.3],
            [139.9, 35.3],
            [139.9, 35.9],
            [139.2, 35.9],
            [139.2, 35.3],
          ],
        ],
      },
    },
  ],
};

const MapTestOverlay = () => (
  <Source id={TEST_SOURCE_ID} type="geojson" data={TEST_GEOJSON}>
    <Layer
      id={TEST_FILL_LAYER_ID}
      type="fill"
      paint={{ 'fill-color': '#e11d48', 'fill-opacity': 0.45 }}
    />
    <Layer id={TEST_LINE_LAYER_ID} type="line" paint={{ 'line-color': '#9f1239', 'line-width': 4 }} />
  </Source>
);

export default MapTestOverlay;
