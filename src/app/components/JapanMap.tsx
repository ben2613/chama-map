'use client'
import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { FeatureCollection, Feature, Geometry, Position } from 'geojson'
import FootageMarker from './FootageMarker'
import chamaFootage from '../../../public/data/chama-footage.json'
import type { FootageMarkerHandle } from './FootageMarker';

// Fix for default markers in React Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Use only two comfortable colors: soft yellow and soft red
const SOFT_YELLOW = '#FFE066'
const SOFT_RED = '#FF6F61'

interface JapanMapProps {
  className?: string
}

interface PrefectureProperties {
  nam: string
  nam_ja: string
  id: number
  // Add more specific properties here if needed
}

const JapanMap: React.FC<JapanMapProps> = ({ className }) => {
  const [japanData, setJapanData] = useState<FeatureCollection | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const markerRefs = useRef<Record<string, React.RefObject<FootageMarkerHandle | null>[]>>({});

  useEffect(() => {
    // Load Japan prefecture GeoJSON data
    const loadJapanData = async () => {
      try {
        const response = await fetch('/data/japan-prefectures.geojson')
        const data = await response.json()
        setJapanData(data)
        setLoading(false)
      } catch (error) {
        console.error('Error loading Japan data:', error)
        setLoading(false)
      }
    }

    loadJapanData()
  }, [])

  // Style function for cartoon-like appearance
  const getFeatureStyle = (feature?: Feature<Geometry, PrefectureProperties>) => {
    const prefectureName = feature?.properties?.nam
    const hasFootage = prefectureName && (chamaFootage as Record<string, unknown[]>)[prefectureName]?.length > 0
    return {
      fillColor: hasFootage ? SOFT_RED : SOFT_YELLOW,
      weight: 3,
      opacity: 1,
      color: '#2C3E50',
      dashArray: '',
      fillOpacity: 0.8,
    }
  }

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
      click: () => setSelectedPrefecture(prefectureName),
      mouseover: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path;
        layer.setStyle({
          weight: 5,
          color: '#FF6F61',
          fillOpacity: 0.9,
          dashArray: '',
        });
        layer.bringToFront();
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path;
        layer.setStyle(getFeatureStyle(feature));
      },
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-lg font-comic text-gray-600">Loading Japan Map...</div>
      </div>
    )
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      <MapContainer
        center={[36.2048, 138.2529]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-lg"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {japanData && (
          <GeoJSON
            data={japanData}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
          />
        )}
        {/* Render markers for all footage */}
        {Object.entries(chamaFootage as unknown as Record<string, Array<{coordinates: [number, number], title: string, image: string, tweet: string}>>).flatMap(([prefName, footageArr]) =>
          footageArr.map((footage, idx) => (
            <FootageMarker
              key={`${prefName}-${idx}`}
              ref={registerMarkerRef(prefName, idx)}
              coordinates={footage.coordinates}
              title={footage.title}
              image={footage.image}
              tweet={footage.tweet}
            />
          ))
        )}
        {/* React-based popup for prefecture */}
        {selectedPrefecture && (
          (() => {
            const footages = (chamaFootage as unknown as Record<string, Array<{coordinates: [number, number], title: string, image: string, tweet: string}>>)[selectedPrefecture] || [];
            // Find the center of the prefecture for popup placement
            const feature = japanData?.features.find(f => f.properties!.nam === selectedPrefecture);
            let center: [number, number] = [36.2048, 138.2529];
            if (feature) {
              const coords = feature.geometry.type === 'Polygon'
                ? feature.geometry.coordinates[0]
                : feature.geometry.type === 'MultiPolygon'
                  ? feature.geometry.coordinates[0][0]
                  : null;
              if (coords && coords.length > 0) {
                // Average the coordinates for a rough center
                const avg = coords.reduce((acc: Position, cur: Position) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]);
                center = [avg[1] / coords.length, avg[0] / coords.length];
              }
            }
            return (
              <Popup
                eventHandlers={{
                  popupclose: () => setSelectedPrefecture(null)
                }}
                position={center}
                autoPan={true}
              >
                <div style={{ minWidth: 200 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#E74C3C' }}>{selectedPrefecture}</div>
                  {footages.length > 0 ? (
                    <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                      {footages.map((f, idx) => (
                        <li key={idx} style={{ marginBottom: 8 }}>
                          <a
                            href="#"
                            style={{ color: '#2980b9', textDecoration: 'underline', cursor: 'pointer' }}
                            onClick={e => {
                              e.preventDefault();
                              const ref = markerRefs.current[selectedPrefecture]?.[idx];
                              if (ref && ref.current) {
                                ref.current.openPopup();
                              }
                            }}
                          >
                            {f.title}
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
          })()
        )}
      </MapContainer>
      
      <style jsx>{`
        .prefecture-border {
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
          transition: all 0.3s ease;
        }
        
        .prefecture-hover {
          filter: drop-shadow(4px 4px 8px rgba(0,0,0,0.2));
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
  )
}

export default JapanMap 