import { Marker, Popup, Tooltip } from 'react-leaflet';
import L, { Marker as LeafletMarker } from 'leaflet';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';

export interface FootageMarkerHandle {
  openPopup: () => void;
}

interface FootageMarkerProps {
  coordinates: [number, number]; // [lng, lat]
  title: string;
  image: string;
  description: string;
  tweets: string[];
}

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const FootageMarker = forwardRef<FootageMarkerHandle, FootageMarkerProps>(
  ({ coordinates, title, image, description, tweets }, ref) => {
    const markerRef = useRef<LeafletMarker>(null);

    useImperativeHandle(ref, () => ({
      openPopup: () => {
        if (markerRef.current) {
          markerRef.current.openPopup();
        }
      }
    }));

    return (
      <Marker position={[coordinates[1], coordinates[0]]} icon={icon} ref={markerRef}>
        <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
          {title}
        </Tooltip>
        <Popup>
          <div style={{ textAlign: 'center', minWidth: 200 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{title}</div>
            {description && <div style={{ marginBottom: 8 }}>{description}</div>}
            <img src={image} alt={title} style={{ width: '100%', maxWidth: 250, borderRadius: 8, marginBottom: 8 }} />
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
