import React, { useCallback, useMemo, useRef, useState } from 'react';
import MapGL, { Layer, Source } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Feature, FeatureCollection, Point, MultiPolygon } from 'geojson';
import TrackMarker from './TrackMarker';
import PrefecturePopup from './PrefecturePopup';
import CurrentPositionMarker from './CurrentPositionMarker';
import MapControlStack from './MapControlStack';
import MapRefBinder from './MapRefBinder';
import MapTestOverlay from './MapTestOverlay';
import MapMoveHandler from './MapMoveHandler';
import MapTopControlStack from './MapTopControlStack';
import SpotSearch from './SpotSearch';
import { isMapTestOverlayEnabled, isPrefectureOverlaySkipped } from '@/map/mapTestOverlay';
import { TrackProperties, PrefectureProperties, SmartPositionConfig } from '@/types/map';
import { useMapRefs } from '@/hooks/useMapRefs';
import { useGeolocation } from '@/hooks/useGeolocation';
import { SOFT_RED, SOFT_YELLOW } from '@/utils/mapStyles';
import { handlePrefectureMapClick, OVERSEAS_PREFECTURE } from '@/utils/mapPrefectureUtils';
import { ClickPositionManager } from '@/utils/ClickPositionManager';
import { getGroupingKeyForFeature, groupMapByNameAndCoordinates } from '@/utils/groupTrackFeatures';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useTranslation } from 'react-i18next';
import { createBasemapStyle } from '@/map/basemapStyle';
import maplibregl from '@/map/maplibreSetup';
import {
  PREFECTURE_FILL_LAYER_ID,
  PREFECTURE_LINE_LAYER_ID,
  PREFECTURE_SOURCE_ID,
  PREFECTURE_HOVER_STATE,
} from '@/map/layerIds';
import { MapProjection } from '@/map/mapProjection';
import { JAPAN_DEFAULT_VIEW, getOptimalAnimationDuration, ANIMATION_CONFIG } from '@/constants/japanMapConstants';

interface JapanMapProps {
  className?: string;
  japanData: FeatureCollection<MultiPolygon, PrefectureProperties>;
  chamaTrack: FeatureCollection<Point, TrackProperties>;
  showPrefectureOverlay?: boolean;
  onPrefectureOverlayToggle?: () => void;
}

const JapanMap: React.FC<JapanMapProps> = ({
  className,
  japanData,
  chamaTrack,
  showPrefectureOverlay = true,
  onPrefectureOverlayToggle,
}) => {
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [positionConfig, setPositionConfig] = useState<SmartPositionConfig | null>(null);
  const [popupKey, setPopupKey] = useState<number>(0);
  const [isAnimatingToJapan, setIsAnimatingToJapan] = useState<boolean>(false);
  const [activeTrackPopupId, setActiveTrackPopupId] = useState<string | null>(null);
  const hoveredPrefectureRef = useRef<string | null>(null);
  const { markerRefs, popupRef, mapRef, popupOpening, registerMarkerRef } = useMapRefs();
  const { i18n, t } = useTranslation();

  const {
    position,
    error,
    isLoading,
    isPermissionGranted,
    requestLocation,
    watchPosition,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  });

  const groupedChamaTracks = useMemo(() => {
    if (!chamaTrack) return {};
    return groupMapByNameAndCoordinates(chamaTrack, 6);
  }, [chamaTrack]);

  const useJapaneseSource = i18n.language.startsWith('ja');
  const basemapStyle = useMemo(() => createBasemapStyle(), []);

  const devMapOverlayFlags = useMemo(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    return {
      showTestOverlay: isMapTestOverlayEnabled(search),
      skipPrefectureOverlay: isPrefectureOverlaySkipped(search),
    };
  }, []);

  const prefecturesWithTracks = useMemo(() => {
    const names = new Set<string>();
    chamaTrack?.features.forEach((f) => {
      const name = f.properties.prefecture;
      if (name && name !== OVERSEAS_PREFECTURE) names.add(name);
    });
    return [...names];
  }, [chamaTrack]);

  const overseasGroups = useMemo(
    () =>
      Object.values(groupedChamaTracks).filter(
        (group) => group.length > 0 && group[0].properties.prefecture === OVERSEAS_PREFECTURE
      ),
    [groupedChamaTracks]
  );

  const handleGPSClick = () => {
    if (!isPermissionGranted) {
      requestLocation();
    } else if (!position) {
      requestLocation();
    }
    if (isPermissionGranted) {
      watchPosition();
    }
  };

  const handleReturnToJapan = useCallback(() => {
    if (isAnimatingToJapan || !mapRef.current) return;
    setIsAnimatingToJapan(true);

    const map = mapRef.current;
    const duration = Math.max(
      ANIMATION_CONFIG.DURATION_MIN,
      Math.min(ANIMATION_CONFIG.DURATION_MAX, getOptimalAnimationDuration())
    );
    map.stop();
    map.flyTo(JAPAN_DEFAULT_VIEW.center, JAPAN_DEFAULT_VIEW.zoom, { duration });

    const completeAnimation = () => {
      setIsAnimatingToJapan(false);
      map.off('moveend', onMoveEnd);
    };
    const onMoveEnd = () => completeAnimation();
    map.on('moveend', onMoveEnd);
    setTimeout(() => completeAnimation(), duration * 1000 + ANIMATION_CONFIG.TIMEOUT_BUFFER);
  }, [isAnimatingToJapan, mapRef]);

  const onPrefectureSelect = useCallback(
    (name: string, smartPositionConfig: SmartPositionConfig) => {
      const groupsForPrefecture = Object.values(groupedChamaTracks).filter(
        (group) => group.length > 0 && group[0].properties.prefecture === name
      );
      if (groupsForPrefecture.length === 1) {
        const rep = groupsForPrefecture[0][0];
        const originalIdx = chamaTrack.features.findIndex((f1) => f1 === rep);
        const ref = markerRefs.current[name]?.[originalIdx];
        if (ref?.current) {
          setTimeout(() => ref.current?.openPopup(), 0);
        }
        return;
      }

      setPopupKey((prev) => prev + 1);
      setSelectedPrefecture(name);
      setPositionConfig(smartPositionConfig);
    },
    [groupedChamaTracks, chamaTrack, markerRefs]
  );

  const closePrefecturePopup = useCallback(() => {
    if (selectedPrefecture) {
      ClickPositionManager.getInstance().clearPrefecturePositions(selectedPrefecture);
    }
    setSelectedPrefecture(null);
    setPositionConfig(null);
  }, [selectedPrefecture]);

  const closeTrackPopup = useCallback(() => setActiveTrackPopupId(null), []);

  const openTrackPopup = useCallback(
    (popupId: string) => {
      closePrefecturePopup();
      setActiveTrackPopupId(popupId);
    },
    [closePrefecturePopup]
  );

  const onOverseasSelect = useCallback(
    (feature: (typeof chamaTrack.features)[number]) => {
      closePrefecturePopup();
      const [lng, lat] = feature.geometry.coordinates;
      const map = mapRef.current;
      if (map) {
        map.flyTo([lat, lng], Math.max(map.getZoom(), 10), { duration: 1 });
      }
      openTrackPopup(getGroupingKeyForFeature(feature, 6));
    },
    [closePrefecturePopup, mapRef, openTrackPopup]
  );

  const onOverseasOpenChange = useCallback(
    (open: boolean) => {
      if (open) closePrefecturePopup();
    },
    [closePrefecturePopup]
  );

  const onSpotSearchSelect = useCallback(
    (feature: Feature<Point, TrackProperties>) => {
      closePrefecturePopup();
      closeTrackPopup();
      const [lng, lat] = feature.geometry.coordinates;
      const map = mapRef.current;
      if (map) {
        map.flyTo([lat, lng], Math.max(map.getZoom(), 12), { duration: 1 });
      }
      openTrackPopup(getGroupingKeyForFeature(feature, 6));
    },
    [closePrefecturePopup, closeTrackPopup, mapRef, openTrackPopup]
  );

  const onMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const target = event.originalEvent.target;
      if (target instanceof Element) {
        // Marker / popup / control clicks are handled separately — do not treat as prefecture area.
        if (
          target.closest('.maplibregl-marker') ||
          target.closest('.maplibregl-popup') ||
          target.closest('.chama-map-control')
        ) {
          return;
        }
      }

      const feature = event.features?.[0];
      if (!feature?.properties?.nam || !event.lngLat) {
        closePrefecturePopup();
        closeTrackPopup();
        return;
      }

      const mapInstance = event.target;
      const projection = MapProjection.from(mapInstance);
      if (!projection) return;

      const prefectureFeature = japanData.features.find((f) => f.properties.nam === feature.properties.nam);
      if (!prefectureFeature) return;

      const prefectureName = feature.properties.nam as string;
      if (selectedPrefecture === prefectureName) {
        closePrefecturePopup();
        closeTrackPopup();
        return;
      }

      handlePrefectureMapClick(
        prefectureName,
        prefectureFeature,
        { lat: event.lngLat.lat, lng: event.lngLat.lng },
        projection,
        japanData,
        onPrefectureSelect,
        popupOpening,
        ClickPositionManager.getInstance()
      );
    },
    [
      japanData,
      onPrefectureSelect,
      popupOpening,
      closePrefecturePopup,
      closeTrackPopup,
      selectedPrefecture,
    ]
  );

  const onMouseMove = useCallback((event: MapLayerMouseEvent) => {
    const map = event.target;
    const feature = event.features?.[0];
    const nextId = feature?.properties?.nam as string | undefined;

    if (hoveredPrefectureRef.current && hoveredPrefectureRef.current !== nextId) {
      map.setFeatureState(
        { source: PREFECTURE_SOURCE_ID, id: hoveredPrefectureRef.current },
        { [PREFECTURE_HOVER_STATE]: false }
      );
      hoveredPrefectureRef.current = null;
    }

    if (nextId) {
      map.getCanvas().style.cursor = 'pointer';
      if (hoveredPrefectureRef.current !== nextId) {
        hoveredPrefectureRef.current = nextId;
        map.setFeatureState({ source: PREFECTURE_SOURCE_ID, id: nextId }, { [PREFECTURE_HOVER_STATE]: true });
      }
    } else {
      map.getCanvas().style.cursor = '';
    }
  }, []);

  const onMouseLeave = useCallback((event: MapLayerMouseEvent) => {
    const map = event.target;
    map.getCanvas().style.cursor = '';
    if (hoveredPrefectureRef.current) {
      map.setFeatureState(
        { source: PREFECTURE_SOURCE_ID, id: hoveredPrefectureRef.current },
        { [PREFECTURE_HOVER_STATE]: false }
      );
      hoveredPrefectureRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!showPrefectureOverlay) {
      closePrefecturePopup();
      hoveredPrefectureRef.current = null;
    }
  }, [showPrefectureOverlay, closePrefecturePopup]);

  return (
    <div className={className} style={{ position: 'relative', height: '100%', width: '100%' }}>
      <SpotSearch chamaTrack={chamaTrack} japanData={japanData} onSelect={onSpotSearchSelect} />
      {error && (
        <div className="absolute top-4 left-4 z-[1000] bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded shadow-lg">
          <div className="text-sm font-medium">
            {error.code === 'PERMISSION_DENIED' && t('geolocation.permissionDenied')}
            {error.code === 'POSITION_UNAVAILABLE' && t('geolocation.positionUnavailable')}
            {error.code === 'TIMEOUT' && t('geolocation.timeout')}
          </div>
          {error.code === 'PERMISSION_DENIED' && (
            <div className="text-xs mt-1">{t('geolocation.enableLocationInstructions')}</div>
          )}
        </div>
      )}

      <MapGL
        mapLib={maplibregl}
        id="japan-map"
        mapStyle={basemapStyle}
        initialViewState={{
          longitude: JAPAN_DEFAULT_VIEW.center[1],
          latitude: JAPAN_DEFAULT_VIEW.center[0],
          zoom: JAPAN_DEFAULT_VIEW.zoom,
        }}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        renderWorldCopies
        maxPitch={0}
        touchPitch={false}
        interactiveLayerIds={showPrefectureOverlay ? [PREFECTURE_FILL_LAYER_ID] : []}
        onClick={onMapClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <MapRefBinder mapRef={mapRef} />
        <MapMoveHandler useJapaneseSource={useJapaneseSource} />
        <MapTopControlStack
          onLocate={handleGPSClick}
          gpsLoading={isLoading}
          gpsDisabled={!navigator.geolocation || error?.code === 'PERMISSION_DENIED'}
          position={position}
          prefectureOverlayVisible={showPrefectureOverlay}
          onPrefectureOverlayToggle={onPrefectureOverlayToggle ?? (() => undefined)}
          overseasGroups={overseasGroups}
          onOverseasSelect={onOverseasSelect}
          onOverseasOpenChange={onOverseasOpenChange}
          onReturnToJapan={handleReturnToJapan}
          returnAnimating={isAnimatingToJapan}
        />

        {devMapOverlayFlags.showTestOverlay && <MapTestOverlay />}

        {japanData && showPrefectureOverlay && !devMapOverlayFlags.skipPrefectureOverlay && (
          <Source id={PREFECTURE_SOURCE_ID} type="geojson" data={japanData} promoteId="nam">
            <Layer
              id={PREFECTURE_FILL_LAYER_ID}
              type="fill"
              paint={{
                'fill-color': [
                  'case',
                  ['boolean', ['feature-state', PREFECTURE_HOVER_STATE], false],
                  SOFT_RED,
                  [
                    'case',
                    ['in', ['get', 'nam'], ['literal', prefecturesWithTracks]],
                    SOFT_RED,
                    SOFT_YELLOW,
                  ],
                ],
                'fill-opacity': ['case', ['boolean', ['feature-state', PREFECTURE_HOVER_STATE], false], 0.2, 0.6],
              }}
            />
            <Layer
              id={PREFECTURE_LINE_LAYER_ID}
              type="line"
              paint={{
                'line-color': [
                  'case',
                  ['boolean', ['feature-state', PREFECTURE_HOVER_STATE], false],
                  SOFT_RED,
                  '#2C3E50',
                ],
                'line-width': ['case', ['boolean', ['feature-state', PREFECTURE_HOVER_STATE], false], 5, 3],
              }}
            />
          </Source>
        )}

        <CurrentPositionMarker
          position={position}
          accuracy={position?.accuracy}
          isLoading={isLoading}
          isPermissionGranted={isPermissionGranted}
        />

        {chamaTrack?.features.map((feature, idx) => {
          if (feature.geometry.type !== 'Point') return null;
          const coords = feature.geometry.coordinates as [number, number];
          const name = (feature.properties.name || feature.properties.nameJp || feature.properties.title || '').trim();
          const key = `${name}|${coords[0].toFixed(6)},${coords[1].toFixed(6)}`;
          const group = groupedChamaTracks[key];
          return (
            <TrackMarker
              key={idx}
              ref={registerMarkerRef(feature.properties.prefecture, idx)}
              coordinates={coords}
              icon={feature.properties.icon}
              groupedKey={key}
              groupedTracks={group}
              prefecture={feature.properties.prefecture}
              popupId={key}
              activePopupId={activeTrackPopupId}
              onOpenPopup={openTrackPopup}
              onClosePopup={closeTrackPopup}
            />
          );
        })}

        {selectedPrefecture && chamaTrack && positionConfig && (
          <PrefecturePopup
            key={`${selectedPrefecture}-${popupKey}`}
            selectedPrefecture={selectedPrefecture}
            positionConfig={positionConfig}
            chamaTrack={chamaTrack}
            japanData={japanData}
            markerRefs={markerRefs}
            popupRef={popupRef}
            groupedMap={groupedChamaTracks}
            onClose={closePrefecturePopup}
          />
        )}

        <ErrorBoundary
          fallback={
            <div className="absolute bottom-3 right-3 text-xs text-red-600 bg-white p-1 rounded">Map controls error</div>
          }
        >
          <MapControlStack />
        </ErrorBoundary>
      </MapGL>
    </div>
  );
};

export default JapanMap;
