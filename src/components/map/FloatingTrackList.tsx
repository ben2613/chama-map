'use client';
import React, { useState, useMemo } from 'react';
import { FaChevronDown, FaChevronRight, FaMapMarkerAlt } from 'react-icons/fa';
import type { Feature, Point } from 'geojson';
import type { TrackProperties } from '@/types/map';
import { useTranslation } from 'react-i18next';
import styles from './FloatingTrackList.module.css';

interface FloatingTrackListProps {
  chamaTrack: Feature<Point, TrackProperties>[];
  groupedTracks: Record<string, Feature<Point, TrackProperties>[]>;
  onTrackClick: (coordinates: [number, number], groupKey: string) => void;
}

interface LayerGroup {
  layerName: string;
  icon: string;
  tracks: Array<{
    key: string;
    name: string;
    nameJp: string;
    coordinates: [number, number];
    count: number;
  }>;
}

const FloatingTrackList: React.FC<FloatingTrackListProps> = ({
  chamaTrack,
  groupedTracks,
  onTrackClick
}) => {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const { i18n } = useTranslation();

  // Group tracks by layerName
  const layerGroups = useMemo(() => {
    const layerMap = new Map<string, LayerGroup>();

    Object.entries(groupedTracks).forEach(([groupKey, tracks]) => {
      if (tracks.length === 0) return;

      const firstTrack = tracks[0];
      const layerName = firstTrack.properties.layerName;
      const icon = firstTrack.properties.icon;

      if (!layerMap.has(layerName)) {
        layerMap.set(layerName, {
          layerName,
          icon,
          tracks: []
        });
      }

      const displayName = i18n.language.startsWith('ja')
        ? (firstTrack.properties.nameJp || firstTrack.properties.name || firstTrack.properties.title || '')
        : (firstTrack.properties.name || firstTrack.properties.nameJp || firstTrack.properties.title || '');

      layerMap.get(layerName)!.tracks.push({
        key: groupKey,
        name: displayName,
        nameJp: firstTrack.properties.nameJp || firstTrack.properties.name || firstTrack.properties.title || '',
        coordinates: firstTrack.geometry.coordinates,
        count: tracks.length
      });
    });

    return Array.from(layerMap.values()).sort((a, b) => a.layerName.localeCompare(b.layerName));
  }, [groupedTracks, i18n.language]);

  const toggleLayer = (layerName: string) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerName)) {
        newSet.delete(layerName);
      } else {
        newSet.add(layerName);
      }
      return newSet;
    });
  };

  const handleTrackClick = (coordinates: [number, number], groupKey: string) => {
    onTrackClick(coordinates, groupKey);
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 max-w-sm max-h-96 overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
      <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaMapMarkerAlt className="text-blue-500 animate-pulse" />
          Track Locations
          <span className="text-xs text-gray-500 font-normal">
            ({layerGroups.reduce((sum, layer) => sum + layer.tracks.length, 0)})
          </span>
        </h3>
      </div>

      <div className={`max-h-80 overflow-y-auto ${styles.scrollbarThin}`}>
        {layerGroups.map((layer) => (
          <div key={layer.layerName} className="border-b border-gray-100/50 last:border-b-0">
            <button
              onClick={() => toggleLayer(layer.layerName)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50/80 flex items-center gap-3 transition-all duration-200 group"
            >
              {layer.icon && (
                <img
                  src={layer.icon}
                  alt={layer.layerName}
                  className={`w-5 h-5 object-contain flex-shrink-0 ${styles.layerIcon}`}
                />
              )}
              <span className="text-sm font-medium text-gray-700 flex-1 truncate group-hover:text-gray-900">
                {layer.layerName}
              </span>
              <span className="text-xs text-gray-500 bg-gray-200/80 px-2 py-1 rounded-full flex-shrink-0">
                {layer.tracks.length}
              </span>
              <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                {expandedLayers.has(layer.layerName) ? (
                  <FaChevronDown className="w-3 h-3 text-gray-500" />
                ) : (
                  <FaChevronRight className="w-3 h-3 text-gray-500" />
                )}
              </div>
            </button>

            <div className={`overflow-hidden ${styles.layerContent} ${expandedLayers.has(layer.layerName)
                ? 'max-h-96 opacity-100'
                : 'max-h-0 opacity-0'
              }`}>
              <div className="bg-gray-50/30">
                {layer.tracks.map((track) => (
                  <button
                    key={track.key}
                    onClick={() => handleTrackClick(track.coordinates, track.key)}
                    className={`w-full px-6 py-2.5 text-left hover:bg-blue-50/80 flex items-center gap-3 transition-all duration-200 group border-l-2 border-transparent hover:border-blue-300 ${styles.trackItem}`}
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-blue-500 group-hover:scale-125 transition-all duration-200" />
                    <span className="text-sm text-gray-700 flex-1 truncate group-hover:text-gray-900">
                      {track.name}
                    </span>
                    {track.count > 1 && (
                      <span className="text-xs text-gray-500 bg-blue-100/80 px-2 py-1 rounded-full flex-shrink-0 group-hover:bg-blue-200">
                        {track.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FloatingTrackList;