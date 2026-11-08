import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

// Vite must not use the broken default worker under node_modules/.vite/deps/
maplibregl.setWorkerUrl(maplibreWorkerUrl);

export default maplibregl;
