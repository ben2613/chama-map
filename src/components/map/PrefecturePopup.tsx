'use client';
import React from 'react';
import { Popup } from 'react-leaflet';
import type { FeatureCollection, Point, MultiPolygon } from 'geojson';
import type { TrackMarkerHandle } from './TrackMarker';
import { TrackProperties, PrefectureProperties } from '@/types/map';
import { useAppTranslation } from '@/hooks/useTranslation';

interface PrefecturePopupProps {
  selectedPrefecture: string;
  chamaTrack: FeatureCollection<Point, TrackProperties>;
  japanData: FeatureCollection<MultiPolygon, PrefectureProperties>;
  markerRefs: React.RefObject<Record<string, React.RefObject<TrackMarkerHandle | null>[]>>;
  popupRef: React.RefObject<L.Popup | null>;
}

const PrefecturePopup = ({ selectedPrefecture, chamaTrack, japanData, markerRefs, popupRef }: PrefecturePopupProps) => {
  const { t } = useAppTranslation();

  const tracks = chamaTrack.features.filter((f) => f.properties.prefecture === selectedPrefecture);

  // Find the center of the prefecture for popup placement
  const feature = japanData?.features.find((f) => f.properties!.nam === selectedPrefecture);
  let center: [number, number] = [36.2048, 138.2529];
  if (feature && feature.properties?.center) {
    center = feature.properties.center;
  }

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
        <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#E74C3C' }}>{selectedPrefecture}</div>
        {tracks.length > 0 ? (
          <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
            {tracks.map((f, idx: number) => (
              <li key={idx} style={{ marginBottom: 8 }}>
                <a
                  href="#"
                  style={{ color: '#2980b9', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.preventDefault();
                    const originalIdx = chamaTrack.features.findIndex((f1) => f1 === f);
                    const ref = markerRefs.current[selectedPrefecture]?.[originalIdx];
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
          <div style={{ color: '#7F8C8D' }}>{t('map.noTracks')}</div>
        )}
      </div>
    </Popup>
  );
};

export default PrefecturePopup;
