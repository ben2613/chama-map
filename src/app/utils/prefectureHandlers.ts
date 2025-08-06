import L from 'leaflet';
import type { Feature, Geometry, FeatureCollection, Point } from 'geojson';
import type { PrefectureProperties, FootageProperties } from '@/types/map';
import { getFeatureStyle, getHoverStyle } from './mapStyles';

export const createPrefectureHandlers = (
  setSelectedPrefecture: (name: string) => void,
  isPopupOpening: React.RefObject<boolean>,
  chamaFootage?: FeatureCollection<Point, FootageProperties>
) => {
  return (feature: Feature<Geometry, PrefectureProperties>, layer: L.Layer) => {
    const prefectureName = feature.properties.nam;

    layer.on({
      click: () => {
        console.log('prefecture clicked:', prefectureName);
        isPopupOpening.current = true;
        setSelectedPrefecture(prefectureName);
        console.log('selectedPrefecture set to:', prefectureName);
        // Reset flag after a short delay
        setTimeout(() => {
          isPopupOpening.current = false;
        }, 500);
      },
      mouseover: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path;
        layer.setStyle(getHoverStyle());
        layer.bringToFront();
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path;
        layer.setStyle(getFeatureStyle(feature, chamaFootage));
      }
    });
  };
};
