import React, { useRef } from 'react';
import type { TrackMarkerHandle } from '../components/map/TrackMarker';

export const useMapRefs = () => {
  const markerRefs = useRef<Record<string, React.RefObject<TrackMarkerHandle | null>[]>>({});
  const popupRef = useRef<L.Popup | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const isPopupOpening = useRef<boolean>(false);

  const registerMarkerRef = (prefName: string, idx: number) => {
    if (!markerRefs.current[prefName]) markerRefs.current[prefName] = [];
    if (!markerRefs.current[prefName][idx]) {
      markerRefs.current[prefName][idx] = React.createRef<TrackMarkerHandle>();
    }
    return markerRefs.current[prefName][idx];
  };

  return {
    markerRefs,
    popupRef,
    mapRef,
    isPopupOpening,
    registerMarkerRef
  };
};
