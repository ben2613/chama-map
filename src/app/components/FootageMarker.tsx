import { Marker, Popup, Tooltip } from 'react-leaflet';
import L, { Marker as LeafletMarker } from 'leaflet';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';

export interface FootageMarkerHandle {
  openPopup: () => void;
}

interface FootageMarkerProps {
  coordinates: [number, number]; // [lng, lat]
  title: string;
  images: string[];
  description: string;
  tweets: string[];
  icon: string;
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

const FootageMarker = forwardRef<FootageMarkerHandle, FootageMarkerProps>(
  ({ icon, coordinates, title, images, description, tweets }, ref) => {
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

    useImperativeHandle(ref, () => ({
      openPopup: () => {
        if (markerRef.current) {
          markerRef.current.openPopup();
        }
      }
    }));

    // Handlers for mouseover on left/right buttons
    const handlePrev = () => {
      setImgIndex((idx) => (idx > 0 ? idx - 1 : idx));
    };
    const handleNext = () => {
      setImgIndex((idx) => (images && idx < images.length - 1 ? idx + 1 : idx));
    };

    // Reset imgIndex if images array changes
    React.useEffect(() => {
      setImgIndex(0);
    }, [images]);

    return (
      <Marker position={[coordinates[1], coordinates[0]]} icon={markerIcon} ref={markerRef}>
        <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
          {title}
        </Tooltip>
        <Popup>
          <div style={{ textAlign: 'center', minWidth: 200 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{title}</div>
            {description && <div style={{ marginBottom: 8 }}>{description}</div>}
            {images && images.length > 0 && (
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8
                }}
              >
                {images.length > 1 && (
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
                  src={process.env.NEXT_PUBLIC_CORS_PROXY + images[imgIndex]}
                  alt={title}
                  style={{ width: '100%', maxWidth: 250, borderRadius: 8, display: 'block' }}
                />
                {images.length > 1 && (
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
                    disabled={imgIndex === images.length - 1}
                    aria-label="Next image"
                  >
                    &#8594;
                  </button>
                )}
              </div>
            )}
            <div>
              {tweets.map((tweet, index) => (
                <a key={index} href={tweet} target="_blank" rel="noopener noreferrer">
                  View Tweet {index + 1}
                </a>
              ))}
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }
);

FootageMarker.displayName = 'FootageMarker';

export default FootageMarker;
