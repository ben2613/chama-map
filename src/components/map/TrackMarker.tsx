import { Marker, Popup, Tooltip } from 'react-leaflet';
import L, { Marker as LeafletMarker } from 'leaflet';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import type { Feature, Point } from 'geojson';
import type { TrackProperties } from '@/types/map';
import { useTranslation } from 'react-i18next';

export interface TrackMarkerHandle {
  openPopup: () => void;
}

interface TrackMarkerProps {
  coordinates: [number, number]; // [lng, lat]
  icon: string;
  groupedKey?: string; // key used to look up grouped tracks
  groupedTracks?: Feature<Point, TrackProperties>[]; // tracks sharing same name and coordinates
}

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const TrackMarker = forwardRef<TrackMarkerHandle, TrackMarkerProps>(({ icon, coordinates, groupedTracks }, ref) => {
  const { i18n } = useTranslation();

  const markerIcon = icon
    ? new L.Icon({
        iconUrl: icon,
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -35],
        shadowSize: [28, 28]
      })
    : defaultIcon;

  const markerRef = useRef<LeafletMarker>(null);
  const [imgIndex, setImgIndex] = React.useState(0);
  const [groupIndex, setGroupIndex] = React.useState(0);

  const active = groupedTracks && groupedTracks.length > 0 ? groupedTracks[groupIndex] : undefined;
  const activeProps: TrackProperties | undefined = active?.properties as TrackProperties | undefined;
  const displayTitle = i18n.language === 'ja' ? activeProps?.nameJp : activeProps?.name;
  const displayDescription = i18n.language === 'ja' ? activeProps?.descriptionJp : activeProps?.description;
  const displayImages = activeProps?.images ?? [];
  const displayTweets = activeProps?.tweets ?? [];

  useImperativeHandle(ref, () => ({
    openPopup: () => {
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }
  }));

  // Handlers for image navigation
  const handlePrev = () => {
    setImgIndex((idx) => (idx > 0 ? idx - 1 : idx));
  };
  const handleNext = () => {
    setImgIndex((idx) => (displayImages && idx < displayImages.length - 1 ? idx + 1 : idx));
  };

  // Reset indices if input arrays change
  React.useEffect(() => {
    setGroupIndex(0);
  }, [groupedTracks]);
  React.useEffect(() => {
    setImgIndex(0);
  }, [groupIndex]);

  return (
    <Marker position={[coordinates[1], coordinates[0]]} icon={markerIcon} ref={markerRef}>
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
        {displayTitle}
      </Tooltip>
      <Popup>
        <div style={{ textAlign: 'center', minWidth: 200 }}>
          {/* Group navigation if multiple tracks share this marker */}
          {groupedTracks && groupedTracks.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <button onClick={() => setGroupIndex((i) => (i > 0 ? i - 1 : groupedTracks.length - 1))}>Prev</button>
              <span>
                {groupIndex + 1} / {groupedTracks.length}
              </span>
              <button onClick={() => setGroupIndex((i) => (i < groupedTracks.length - 1 ? i + 1 : 0))}>Next</button>
            </div>
          )}
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{displayTitle}</div>
          {displayDescription && <div style={{ marginBottom: 8 }}>{displayDescription}</div>}
          {displayImages && displayImages.length > 0 && (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}
            >
              {displayImages.length > 1 && (
                <button
                  style={{
                    position: 'absolute',
                    left: 0,
                    zIndex: 2,
                    background: 'rgba(255,255,255,0.7)',
                    border: 'none',
                    cursor: 'pointer',
                    height: '100%'
                  }}
                  onClick={handlePrev}
                  disabled={imgIndex === 0}
                  aria-label="Previous image"
                >
                  &#8592;
                </button>
              )}
              <img
                src={process.env.NEXT_PUBLIC_CORS_PROXY + displayImages[imgIndex]}
                alt={displayTitle}
                style={{ width: '100%', maxWidth: 250, borderRadius: 8, display: 'block' }}
              />
              {displayImages.length > 1 && (
                <button
                  style={{
                    position: 'absolute',
                    right: 0,
                    zIndex: 2,
                    background: 'rgba(255,255,255,0.7)',
                    border: 'none',
                    cursor: 'pointer',
                    height: '100%'
                  }}
                  onClick={handleNext}
                  disabled={imgIndex === displayImages.length - 1}
                  aria-label="Next image"
                >
                  &#8594;
                </button>
              )}
            </div>
          )}
          <div>
            {displayTweets.map((tweet, index) => (
              <a key={index} href={tweet} target="_blank" rel="noopener noreferrer">
                View Link {index + 1}
              </a>
            ))}
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

TrackMarker.displayName = 'TrackMarker';

export default TrackMarker;
