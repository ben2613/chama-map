import { PrefectureProperties, TrackProperties } from '@/types/map';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Point, Position } from 'geojson';
import L from 'leaflet';
import { getFeatureStyle, getHoverStyle } from './mapStyles';
import { addMarkerOverPrefecture, removeMarkerOverPrefecture } from '@/lib/slices/prefectureHoverSlice';
import { AppDispatch } from '@/lib/store';

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
  dispatch?: AppDispatch,
  markersOverPrefecture?: Set<string>
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
          console.log('Prefecture level: adding marker over prefecture:', prefectureName);
          dispatch(addMarkerOverPrefecture(prefectureName));
        }
        layer.setStyle(getHoverStyle());
        layer.bringToFront();
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path;
        if (dispatch && markersOverPrefecture) {
          const hasMarkersOver = markersOverPrefecture.has(prefectureName);
          if (!hasMarkersOver) {
            console.log('Prefecture level: removing marker over prefecture:', prefectureName);
            dispatch(removeMarkerOverPrefecture(prefectureName));
            layer.setStyle(getFeatureStyle(feature, chamaTrack));
          }
        } else {
          layer.setStyle(getFeatureStyle(feature, chamaTrack));
        }
      }
    });
  };
};
