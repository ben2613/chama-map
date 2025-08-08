'use client';
import { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';
import type { PopupEvent } from 'leaflet';

interface MapEventHandlerProps {
  onPopupClose: () => void;
  isPopupOpening: React.RefObject<boolean>;
  mapRef: React.RefObject<L.Map | null>;
}

const MapEventHandler = ({ onPopupClose, isPopupOpening, mapRef }: MapEventHandlerProps) => {
  const map = useMapEvents({
    popupclose: (e: PopupEvent) => {
      console.log('popup closed via map event', e);
      console.log('isPopupOpening:', isPopupOpening.current);
      // Only close if it's not during popup opening
      if (!isPopupOpening.current) {
        console.log('closing prefecture popup');
        onPopupClose();
      } else {
        console.log('ignoring popup close during opening');
      }
    }
  });

  // Store map reference
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  return null;
};

export default MapEventHandler;
