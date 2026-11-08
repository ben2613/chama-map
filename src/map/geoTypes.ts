/** Geographic types shared by ViewportCalculator and map UI (Leaflet-free). */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PixelBounds {
  min: Point;
  max: Point;
}

export const latLng = (lat: number, lng: number): LatLng => ({ lat, lng });

export const point = (x: number, y: number): Point => ({ x, y });

export const pixelBounds = (min: Point, max: Point): PixelBounds => ({ min, max });
