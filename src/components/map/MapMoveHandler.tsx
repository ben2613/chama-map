import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { shouldUseJapaneseBasemap } from '@/constants/mapTileConstants';
import { normalizeLongitude } from '@/constants/japanMapConstants';
import { MapProjection } from '@/map/mapProjection';
import { WORLD_LAYER_ID, GSI_LAYER_ID } from '@/map/basemapStyle';
import { MAP_ID } from '@/map/useMapProjection';

interface MapMoveHandlerProps {
  useJapaneseSource: boolean;
}

const MapMoveHandler = ({ useJapaneseSource }: MapMoveHandlerProps) => {
  const maps = useMap();
  const map = (maps[MAP_ID] ?? maps.current)?.getMap();

  useEffect(() => {
    if (!map) return;

    const onMoveEnd = () => {
      const projection = MapProjection.from(map);
      if (!projection) return;
      const center = projection.getCenter();
      const wrappedLng = normalizeLongitude(center.lng);
      if (wrappedLng !== center.lng) {
        projection.setView([center.lat, wrappedLng], projection.getZoom(), { animate: false });
      }
    };

    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const syncBasemap = () => {
      const projection = MapProjection.from(map);
      if (!projection) return;
      const useGsi = shouldUseJapaneseBasemap(projection, useJapaneseSource);
      if (map.getLayer(GSI_LAYER_ID)) {
        map.setLayoutProperty(GSI_LAYER_ID, 'visibility', useGsi ? 'visible' : 'none');
      }
      if (map.getLayer(WORLD_LAYER_ID)) {
        map.setLayoutProperty(WORLD_LAYER_ID, 'visibility', useGsi ? 'none' : 'visible');
      }
    };

    syncBasemap();
    map.on('moveend', syncBasemap);
    map.on('zoomend', syncBasemap);
    return () => {
      map.off('moveend', syncBasemap);
      map.off('zoomend', syncBasemap);
    };
  }, [map, useJapaneseSource]);

  return null;
};

export default MapMoveHandler;
