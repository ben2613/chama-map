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
  const enabledRef = useRef(enabled);
  const [tilesetUrl, setTilesetUrl] = useState<string | null>(null);

  enabledRef.current = enabled;

  useEffect(() => {
    const map = mapRef?.getMap() as MapLibreMap | undefined;
    if (!map) return;

    // shortcut: MapLibre + deck.gl interleaved WebGL context is unreliable; use overlaid canvas
    const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
    overlayRef.current = overlay;
    map.addControl(overlay);

    let cancelled = false;
    let debounceId: ReturnType<typeof setTimeout> | undefined;

    const syncTileset = async () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (!shouldLoadPlateauBuildings(enabledRef.current, zoom, center.lat, center.lng)) {
        if (!cancelled) setTilesetUrl(null);
        return;
      }
      const url = await resolvePlateauXingTilesetUrl([center.lng, center.lat], japanData);
      if (!cancelled) setTilesetUrl(url);
    };

    const onMoveEnd = () => {
      clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        void syncTileset();
      }, PLATEAU_TILE_MOVE_DEBOUNCE_MS);
    };

    map.on('moveend', onMoveEnd);
    void syncTileset();

    return () => {
      cancelled = true;
      clearTimeout(debounceId);
      map.off('moveend', onMoveEnd);
      if (overlayRef.current) {
        map.removeControl(overlayRef.current);
        overlayRef.current = null;
      }
    };
  }, [mapRef, japanData]);

  useEffect(() => {
    if (!enabled) {
      setTilesetUrl(null);
      overlayRef.current?.setProps({ layers: [] });
      return;
    }
    const map = mapRef?.getMap() as MapLibreMap | undefined;
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    if (!shouldLoadPlateauBuildings(true, zoom, center.lat, center.lng)) {
      setTilesetUrl(null);
      return;
    }
    let cancelled = false;
    void resolvePlateauXingTilesetUrl([center.lng, center.lat], japanData).then((url) => {
      if (!cancelled) setTilesetUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, mapRef, japanData]);

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
            '3d-tiles': { loadGLTF: true },
          },
        }),
      ],
    });
  }, [enabled, tilesetUrl]);

  return null;
};

export default Map3DBuildings;
