import { useMemo } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { MapProjection } from './mapProjection';

const MAP_ID = 'japan-map';

/** Returns a Leaflet-compatible projection facade for the current MapLibre map. */
export function useMapProjection(): MapProjection | null {
  const maps = useMap();
  const mapRef = maps[MAP_ID] ?? maps.current;
  const map = mapRef?.getMap();
  return useMemo(() => MapProjection.from(map ?? null), [map]);
}

export { MAP_ID };
