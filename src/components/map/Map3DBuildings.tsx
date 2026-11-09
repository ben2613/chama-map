import { useEffect, useRef, useState } from 'react';
import type { FeatureCollection, MultiPolygon } from 'geojson';
import { useMap } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { Tile3DLayer } from '@deck.gl/geo-layers';
import { Tiles3DLoader } from '@loaders.gl/3d-tiles';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { PrefectureProperties } from '@/types/map';
import { MAP_ID } from '@/map/useMapProjection';
import { PLATEAU_TILE_MOVE_DEBOUNCE_MS } from '@/constants/plateau3dConstants';
import { resolvePlateauXingTilesetUrl, shouldLoadPlateauBuildings } from '@/utils/plateau3dUtils';

interface Map3DBuildingsProps {
  enabled: boolean;
  japanData: FeatureCollection<MultiPolygon, PrefectureProperties>;
}

const Map3DBuildings = ({ enabled, japanData }: Map3DBuildingsProps) => {
  const maps = useMap();
  const mapRef = maps[MAP_ID] ?? maps.current;
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [tilesetUrl, setTilesetUrl] = useState<string | null>(null);

  useEffect(() => {
    const map = mapRef?.getMap() as MapLibreMap | undefined;
    if (!map) return;

    const overlay = new MapboxOverlay({ interleaved: true, layers: [] });
    overlayRef.current = overlay;
    map.addControl(overlay);

    const syncTileset = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (!shouldLoadPlateauBuildings(enabled, zoom, center.lat, center.lng)) {
        setTilesetUrl(null);
        return;
      }
      const url = resolvePlateauXingTilesetUrl([center.lng, center.lat], japanData);
      setTilesetUrl(url);
    };

    let debounceId: ReturnType<typeof setTimeout> | undefined;
    const onMoveEnd = () => {
      clearTimeout(debounceId);
      debounceId = setTimeout(syncTileset, PLATEAU_TILE_MOVE_DEBOUNCE_MS);
    };

    map.on('moveend', onMoveEnd);
    syncTileset();

    return () => {
      clearTimeout(debounceId);
      map.off('moveend', onMoveEnd);
      if (overlayRef.current) {
        map.removeControl(overlayRef.current);
        overlayRef.current = null;
      }
    };
  }, [mapRef, japanData, enabled]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (!enabled || !tilesetUrl) {
      overlay.setProps({ layers: [] });
      return;
    }

    overlay.setProps({
      layers: [
        new Tile3DLayer({
          id: 'plateau-xing-buildings',
          data: tilesetUrl,
          loader: Tiles3DLoader,
          pickable: false,
          loadOptions: {
            '3d-tiles': {
              loadGLTF: true,
            },
          },
        }),
      ],
    });
  }, [enabled, tilesetUrl]);

  return null;
};

export default Map3DBuildings;
