import React, { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { MapProjection } from '@/map/mapProjection';
import { MAP_ID } from '@/map/useMapProjection';

interface MapRefBinderProps {
  mapRef: React.RefObject<MapProjection | null>;
}

/** Keeps parent `mapRef` synced with the live MapLibre instance. */
const MapRefBinder = ({ mapRef }: MapRefBinderProps) => {
  const maps = useMap();
  const map = (maps[MAP_ID] ?? maps.current)?.getMap();

  useEffect(() => {
    mapRef.current = MapProjection.from(map ?? null);
  }, [map, mapRef]);

  return null;
};

export default MapRefBinder;
