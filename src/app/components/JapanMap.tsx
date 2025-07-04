'use client'
import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { FeatureCollection, Feature, Geometry } from 'geojson'

// Fix for default markers in React Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Use only two comfortable colors: soft yellow and soft red
const PREFECTURE_COLORS = [
  '#FFE066', // Soft yellow
  '#F44336'  // Soft red
]

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
    const prefectureId = feature?.properties?.id || 0
    const featureIndex = prefectureId % PREFECTURE_COLORS.length
    
    return {
      fillColor: PREFECTURE_COLORS[featureIndex],
      weight: 3,
      opacity: 1,
      color: '#2C3E50', // Dark border for cartoon effect
      dashArray: '',
      fillOpacity: 0.8,
    }
  }

  // Interaction handlers
  const onEachFeature = (feature: Feature<Geometry, PrefectureProperties>, layer: L.Layer) => {
    const popupContent = `
      <div style="
        font-family: 'Comic Sans MS', cursive;
        font-size: 14px;
        font-weight: bold;
        color: #2C3E50;
        text-align: center;
        padding: 8px;
        line-height: 1.4;
      ">
        <div style="font-size: 16px; color: #E74C3C;">
          ${feature.properties.nam || 'Unknown Prefecture'}
        </div>
        <div style="font-size: 18px; margin-top: 4px;">
          ${feature.properties.nam_ja || ''}
        </div>
        <div style="font-size: 11px; color: #7F8C8D; margin-top: 4px;">
          Prefecture ID: ${feature.properties.id || 'N/A'}
        </div>
      </div>
    `
    
    layer.bindPopup(popupContent)
    
    // Hover effects for cartoon-style interaction
    layer.on({
      mouseover: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path
        layer.setStyle({
          weight: 5,
          color: '#FF6F61',
          fillOpacity: 0.9,
          dashArray: '',
        })
        layer.bringToFront()
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path
        layer.setStyle(getFeatureStyle(feature))
      },
      click: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path
        // Add click animation
        layer.setStyle({
          weight: 8,
          color: '#E74C3C',
          fillOpacity: 1,
        })
        setTimeout(() => {
          layer.setStyle(getFeatureStyle(feature))
        }, 300)
      }
    })
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-lg font-comic text-gray-600">Loading Japan Map...</div>
      </div>
    )
  }

  return (
    <div className={className}>
      <MapContainer
        center={[36.2048, 138.2529]} // Center of Japan
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-lg"
      >
        {/* Use a minimal tile layer for cartoon effect */}
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