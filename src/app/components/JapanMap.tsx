'use client'
import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Cartoon-style color palette for prefectures
const PREFECTURE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#F4D03F',
  '#AED6F1', '#A9DFBF', '#F9E79F', '#D7BDE2', '#A3E4D7',
  '#FAD7A0', '#D5A6BD', '#A9CCE3', '#ABEBC6', '#F5B7B1',
  '#87CEEB', '#DEB887', '#F0E68C', '#DA70D6', '#40E0D0',
  '#FF69B4', '#00CED1', '#FFB6C1', '#20B2AA', '#FF1493',
  '#00BFFF', '#FF6347', '#7B68EE', '#00FA9A', '#FF4500',
  '#9370DB', '#32CD32', '#FF8C00', '#6A5ACD', '#00FF7F',
  '#FF69B4', '#1E90FF'
]

interface JapanMapProps {
  className?: string
}

interface PrefectureProperties {
  nam: string
  nam_ja: string
  id: number
  [key: string]: any
}

interface PrefectureFeature {
  type: 'Feature'
  properties: PrefectureProperties
  geometry: any
}

const JapanMap: React.FC<JapanMapProps> = ({ className }) => {
  const [japanData, setJapanData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
  const getFeatureStyle = (feature?: any) => {
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
  const onEachFeature = (feature: PrefectureFeature, layer: L.Layer) => {
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
      mouseover: (e) => {
        const layer = e.target
        layer.setStyle({
          weight: 5,
          color: '#FF6B6B',
          fillOpacity: 0.9,
          dashArray: '',
        })
        layer.bringToFront()
      },
      mouseout: (e) => {
        const layer = e.target
        layer.setStyle(getFeatureStyle(feature))
      },
      click: (e) => {
        const layer = e.target
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