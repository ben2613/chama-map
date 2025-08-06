'use client';
import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { PopupEvent } from 'leaflet';
import type { FeatureCollection, Feature, Geometry, Point, MultiPolygon } from 'geojson';
import FootageMarker from './FootageMarker';
import type { FootageMarkerHandle } from './FootageMarker';
import { FootageProperties, PrefectureProperties } from '@/types/map';

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
  chamaFootage: FeatureCollection<Point, FootageProperties>;
}

const SOFT_YELLOW = '#FFE066';
const SOFT_RED = '#FF6F61';

const JapanMap: React.FC<JapanMapProps> = ({ className, japanData, chamaFootage }) => {
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const markerRefs = useRef<Record<string, React.RefObject<FootageMarkerHandle | null>[]>>({});
  const popupRef = useRef<L.Popup | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const isPopupOpening = useRef<boolean>(false);

  // Style function for cartoon-like appearance
  const getFeatureStyle = (feature?: Feature<Geometry, PrefectureProperties>) => {
    const prefectureName = feature?.properties?.nam;
    const hasFootage = chamaFootage?.features.some((f) => f.properties.prefecture === prefectureName);
    return {
      fillColor: hasFootage ? SOFT_RED : SOFT_YELLOW,
      weight: 3,
      opacity: 1,
      color: '#2C3E50',
      dashArray: '',
      fillOpacity: 0.8
    };
  };

  // Helper to register marker refs
  const registerMarkerRef = (prefName: string, idx: number) => {
    if (!markerRefs.current[prefName]) markerRefs.current[prefName] = [];
    if (!markerRefs.current[prefName][idx]) markerRefs.current[prefName][idx] = React.createRef<FootageMarkerHandle>();
    return markerRefs.current[prefName][idx];
  };

  // Interaction handlers
  const onEachFeature = (feature: Feature<Geometry, PrefectureProperties>, layer: L.Layer) => {
    const prefectureName = feature.properties.nam;
    layer.on({
      click: () => {
        console.log('prefecture clicked:', prefectureName);
        isPopupOpening.current = true;
        setSelectedPrefecture(prefectureName);
        console.log('selectedPrefecture set to:', prefectureName);
        // Reset flag after a short delay
        setTimeout(() => {
          isPopupOpening.current = false;
        }, 500);
      },
      mouseover: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path;
        layer.setStyle({
          weight: 5,
          color: '#FF6F61',
          fillOpacity: 0.9,
          dashArray: ''
        });
        layer.bringToFront();
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path;
        layer.setStyle(getFeatureStyle(feature));
      }
    });
  };

  // Component to handle map events
  const MapEventHandler = () => {
    const map = useMapEvents({
      popupclose: (e: PopupEvent) => {
        console.log('popup closed via map event', e);
        console.log('isPopupOpening:', isPopupOpening.current);
        // Only close if it's not during popup opening
        if (!isPopupOpening.current) {
          console.log('closing prefecture popup');
          setSelectedPrefecture(null);
        } else {
          console.log('ignoring popup close during opening');
        }
      }
    });

    // Store map reference
    useEffect(() => {
      mapRef.current = map;
    }, [map]);

    return null;
  };

  return (
    <div className={className} style={{ position: 'relative' }}>
      <MapContainer
        center={[36.2048, 138.2529]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-lg"
      >
        <MapEventHandler />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {japanData && <GeoJSON data={japanData} style={getFeatureStyle} onEachFeature={onEachFeature} />}
        {/* Render markers for all footage */}
        {chamaFootage &&
          chamaFootage.features.map((feature, idx) => {
            // Only render markers for Point geometries
            if (feature.geometry.type !== 'Point') return null;
            const coords = (feature.geometry as Point).coordinates as [number, number];
            return (
              <FootageMarker
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
        {/* React-based popup for prefecture */}
        {selectedPrefecture &&
          chamaFootage &&
          (() => {
            console.log('rendering popup for:', selectedPrefecture);
            const footages = chamaFootage.features.filter((f) => f.properties.prefecture === selectedPrefecture);
            // Find the center of the prefecture for popup placement
            const feature = japanData?.features.find((f) => f.properties!.nam === selectedPrefecture);
            let center: [number, number] = [36.2048, 138.2529];
            if (feature && feature.properties?.center) {
              center = feature.properties.center;
            }
            console.log('popup center:', center);
            return (
              <Popup
                position={center}
                autoPan={true}
                ref={(ref) => {
                  if (ref) {
                    popupRef.current = ref;
                    console.log('popup ref set');
                  }
                }}
              >
                <div style={{ minWidth: 200 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#E74C3C' }}>{selectedPrefecture}</div>
                  {footages.length > 0 ? (
                    <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                      {footages.map((f, idx: number) => (
                        <li key={idx} style={{ marginBottom: 8 }}>
                          <a
                            href="#"
                            style={{ color: '#2980b9', textDecoration: 'underline', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.preventDefault();
                              const ref = markerRefs.current[selectedPrefecture]?.[idx];
                              if (ref && ref.current) {
                                setTimeout(() => {
                                  ref.current?.openPopup();
                                }, 100);
                              }
                            }}
                          >
                            {f.properties.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: '#7F8C8D' }}>No footages found for this prefecture.</div>
                  )}
                </div>
              </Popup>
            );
          })()}
      </MapContainer>

      <style jsx>{`
        .prefecture-border {
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
          transition: all 0.3s ease;
        }

        .prefecture-hover {
          filter: drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.2));
          transform: scale(1.02);
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
        }

        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
      `}</style>
    </div>
  );
};

export default JapanMap;
