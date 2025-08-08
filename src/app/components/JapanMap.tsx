'use client';
import React, { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { FeatureCollection, Point, MultiPolygon } from 'geojson';
import TrackMarker from './TrackMarker';
import MapEventHandler from './map/MapEventHandler';
import PrefecturePopup from './map/PrefecturePopup';
import MapStyles from './map/MapStyles';
import { TrackProperties, PrefectureProperties } from '@/types/map';
import { useMapRefs } from '../hooks/useMapRefs';
import { getFeatureStyle } from '../utils/mapStyles';
import { createPrefectureHandlers } from '../utils/prefectureHandlers';

// Fix for default markers in React Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});
L.SVG.prototype.options.padding = 0.5;

interface JapanMapProps {
  className?: string;
  japanData: FeatureCollection<MultiPolygon, PrefectureProperties>;
  chamaTrack: FeatureCollection<Point, TrackProperties>;
}

const JapanMap: React.FC<JapanMapProps> = ({ className, japanData, chamaTrack }) => {
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const { markerRefs, popupRef, mapRef, isPopupOpening, registerMarkerRef } = useMapRefs();

  // Create prefecture interaction handlers
  const onEachFeature = createPrefectureHandlers(setSelectedPrefecture, isPopupOpening, chamaTrack);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <MapContainer
        center={[36.2048, 138.2529]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-lg"
      >
        <MapEventHandler
          onPopupClose={() => setSelectedPrefecture(null)}
          isPopupOpening={isPopupOpening}
          mapRef={mapRef}
        />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {japanData && (
          <GeoJSON
            data={japanData}
            style={(feature) => getFeatureStyle(feature, chamaTrack)}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Render markers for all track */}
        {chamaTrack?.features.map((feature, idx) => {
          // Only render markers for Point geometries
          if (feature.geometry.type !== 'Point') return null;
          const coords = feature.geometry.coordinates as [number, number];
          return (
            <TrackMarker
              key={idx}
              ref={registerMarkerRef(feature.properties.prefecture, idx)}
              coordinates={coords}
              title={feature.properties.title}
              description={feature.properties.description ?? ''}
              images={feature.properties.images}
              tweets={feature.properties.tweets}
              icon={feature.properties.icon}
            />
          );
        })}

        {/* Prefecture popup */}
        {selectedPrefecture && chamaTrack && (
          <PrefecturePopup
            selectedPrefecture={selectedPrefecture}
            chamaTrack={chamaTrack}
            japanData={japanData}
            markerRefs={markerRefs}
            popupRef={popupRef}
          />
        )}
      </MapContainer>

      <MapStyles />
    </div>
  );
};

export default JapanMap;
