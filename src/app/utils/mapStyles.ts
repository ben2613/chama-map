import type { Feature, Geometry, FeatureCollection, Point } from 'geojson';
import type { PrefectureProperties, FootageProperties } from '@/types/map';

// Map color constants
export const SOFT_YELLOW = '#FFE066';
export const SOFT_RED = '#FF6F61';

// Style function for cartoon-like appearance
export const getFeatureStyle = (
  feature?: Feature<Geometry, PrefectureProperties>,
  chamaFootage?: FeatureCollection<Point, FootageProperties>
) => {
  const prefectureName = feature?.properties?.nam;
  const hasFootage = chamaFootage?.features.some((f) => f.properties.prefecture === prefectureName);
  
  return {
    fillColor: hasFootage ? SOFT_RED : SOFT_YELLOW,
    weight: 3,
    opacity: 1,
    color: '#2C3E50',
    dashArray: '',
    fillOpacity: 0.8
  };
};

// Hover styles
export const getHoverStyle = () => ({
  weight: 5,
  color: '#FF6F61',
  fillOpacity: 0.9,
  dashArray: ''
});