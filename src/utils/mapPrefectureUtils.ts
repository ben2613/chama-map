import { PrefectureProperties, TrackProperties } from '@/types/map';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Point, Position } from 'geojson';
import L from 'leaflet';
import { getFeatureStyle, getHoverStyle } from './mapStyles';
import { setPrefectureHovered } from '@/lib/slices/prefectureHoverSlice';
import { AppDispatch } from '@/lib/store';
import { store } from '@/lib/store'; // We'll need to export the store instance

export function getPrefectureForPoint(
  point: Position,
  prefectures: FeatureCollection<MultiPolygon, PrefectureProperties>
) {
  for (const feature of prefectures.features) {
    if (booleanPointInPolygon(point, feature)) {
      return feature.properties.nam;
    }
  }
  // if no prefecture found, return the closest prefecture, with the prefecture center
  const closestPrefecture = getClosestPrefecture(point, prefectures);
  console.log('No prefecture found for point', point, ', fallback to', closestPrefecture);
  return closestPrefecture;
}

function getClosestPrefecture(point: Position, prefectures: FeatureCollection<MultiPolygon, PrefectureProperties>) {
  let closestPrefecture = '';
  let closestDistance = Infinity;
  for (const feature of prefectures.features) {
    const distance = getDistance(point, feature.properties.center);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPrefecture = feature.properties.nam;
    }
  }
  return closestPrefecture;
}

function getDistance(point: Position, center: Position) {
  return Math.sqrt((point[1] - center[0]) ** 2 + (point[0] - center[1]) ** 2);
}

export const createPrefectureHandlers = (
  setSelectedPrefecture: (name: string) => void,
  isPopupOpening: React.RefObject<boolean>,
  chamaTrack?: FeatureCollection<Point, TrackProperties>,
  dispatch?: AppDispatch
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
        if (dispatch) {
          console.log('Prefecture level: set prefecture hover:', prefectureName);
          dispatch(setPrefectureHovered(prefectureName));
        }
        layer.setStyle(getHoverStyle());
        layer.bringToFront();
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        setTimeout(() => {
          const layer = e.target as L.Path;
          // Get current state directly from store
          const currentState = store.getState();
          const markerOverPrefecture = currentState.prefectureHover.markerOverPrefecture;
          if (dispatch && markerOverPrefecture) {
            console.log('Prefecture level: has marker over:', markerOverPrefecture);
            const hasMarkerOver = markerOverPrefecture === prefectureName;
            if (!hasMarkerOver) {
              console.log('Prefecture level: reset prefecture hover:', prefectureName);
              dispatch(setPrefectureHovered(null));
              layer.setStyle(getFeatureStyle(feature, chamaTrack));
            } else {
              layer.setStyle(getHoverStyle());
            }
          } else {
            layer.setStyle(getFeatureStyle(feature, chamaTrack));
          }
        }, 50);
      }
    });
  };
};
