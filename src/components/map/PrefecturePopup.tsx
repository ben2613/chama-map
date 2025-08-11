'use client';
import React from 'react';
import { Popup } from 'react-leaflet';
import type { FeatureCollection, Point, MultiPolygon } from 'geojson';
import type { TrackMarkerHandle } from './TrackMarker';
import { TrackProperties, PrefectureProperties } from '@/types/map';
import type { Feature } from 'geojson';
import { getGroupingKeyForFeature } from '@/utils/groupTrackFeatures';
import { useTranslation } from 'react-i18next';

interface PrefecturePopupProps {
  selectedPrefecture: string;
  chamaTrack: FeatureCollection<Point, TrackProperties>;
  japanData: FeatureCollection<MultiPolygon, PrefectureProperties>;
  markerRefs: React.RefObject<Record<string, React.RefObject<TrackMarkerHandle | null>[]>>;
  popupRef: React.RefObject<L.Popup | null>;
  groupedMap?: Record<string, Feature<Point, TrackProperties>[]>;
}

const PrefecturePopup = ({
  selectedPrefecture,
  chamaTrack,
  japanData,
  markerRefs,
  popupRef,
  groupedMap
}: PrefecturePopupProps) => {
  const { t, i18n } = useTranslation();

  const tracks = chamaTrack.features.filter((f) => f.properties.prefecture === selectedPrefecture);

  // Find the center of the prefecture for popup placement
  const feature = japanData?.features.find((f) => f.properties!.nam === selectedPrefecture);
  let center: [number, number] = [36.2048, 138.2529];
  if (feature && feature.properties?.center) {
    center = feature.properties.center;
  }

  // Deduplicated groups for the selected prefecture when groupedMap is provided
  const groupedList: Feature<Point, TrackProperties>[][] | null = groupedMap
    ? Object.values(groupedMap).filter(
        (group) => group.length > 0 && group[0].properties.prefecture === selectedPrefecture
      )
    : null;

  return (
    <Popup
      position={center}
      autoPan={true}
      ref={(ref) => {
        if (ref) {
          popupRef.current = ref;
        }
      }}
    >
      <div style={{ minWidth: 200 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#E74C3C' }}>
          {i18n.language === 'ja' ? feature?.properties.nam_ja : feature?.properties.nam}
        </div>
        {(groupedList ? groupedList.length > 0 : tracks.length > 0) ? (
          <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
            {(groupedList ?? tracks.map((f) => [f] as Feature<Point, TrackProperties>[])).map((group, idx: number) => {
              const rep = group[0];
              const label = i18n.language === 'ja' ? rep.properties.nameJp : rep.properties.name;
              const groupCount = group.length;
              const key = getGroupingKeyForFeature(rep, 6);
              return (
                <li key={`${key}-${idx}`} style={{ marginBottom: 8 }}>
                  <a
                    href="#"
                    style={{ color: '#2980b9', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={(e) => {
                      e.preventDefault();
                      const originalIdx = chamaTrack.features.findIndex((f1) => f1 === rep);
                      const ref = markerRefs.current[selectedPrefecture]?.[originalIdx];
                      if (ref && ref.current) {
                        setTimeout(() => {
                          ref.current?.openPopup();
                        }, 100);
                      }
                    }}
                  >
                    {label}
                    {groupCount > 1 ? ` (${groupCount})` : ''}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <div style={{ color: '#7F8C8D' }}>{t('map.noTracks')}</div>
        )}
      </div>
    </Popup>
  );
};

export default PrefecturePopup;
