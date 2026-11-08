import type { Map as MapLibreMapInstance } from 'maplibre-gl';
import { GeoBounds } from './geoBounds';
import { latLng, pixelBounds, point, type LatLng, type PixelBounds, type Point } from './geoTypes';

export type MapLibreMap = MapLibreMapInstance;

/**
 * Subset of former Leaflet map APIs used by ViewportCalculator and map logic.
 */
export class MapProjection {
  constructor(private readonly map: MapLibreMap) {}

  static from(map: MapLibreMap | null | undefined): MapProjection | null {
    if (!map) return null;
    return new MapProjection(map);
  }

  getMap(): MapLibreMap {
    return this.map;
  }

  getCenter(): LatLng {
    const c = this.map.getCenter();
    return { lat: c.lat, lng: c.lng };
  }

  getZoom(): number {
    return this.map.getZoom();
  }

  getBounds(): GeoBounds {
    return GeoBounds.fromMapLibre(this.map.getBounds());
  }

  getSize(): Point {
    const container = this.map.getContainer();
    return point(container.clientWidth, container.clientHeight);
  }

  getPixelBounds(): PixelBounds {
    const size = this.getSize();
    return pixelBounds(point(0, 0), point(size.x, size.y));
  }

  latLngToContainerPoint(coord: LatLng | [number, number]): Point {
    const lat = Array.isArray(coord) ? coord[0] : coord.lat;
    const lng = Array.isArray(coord) ? coord[1] : coord.lng;
    const projected = this.map.project([lng, lat]);
    return point(projected.x, projected.y);
  }

  containerPointToLatLng(p: Point): LatLng {
    const ll = this.map.unproject([p.x, p.y]);
    return latLng(ll.lat, ll.lng);
  }

  getContainer(): HTMLElement {
    return this.map.getContainer();
  }

  on(type: string, listener: (...args: unknown[]) => void): void {
    this.map.on(type as never, listener as never);
  }

  off(type: string, listener: (...args: unknown[]) => void): void {
    this.map.off(type as never, listener as never);
  }

  flyTo(center: [number, number], zoom: number, options?: { duration?: number }): void {
    const durationMs = (options?.duration ?? 1) * 1000;
    this.map.flyTo({
      center: [center[1], center[0]],
      zoom,
      duration: durationMs,
      essential: true,
    });
  }

  setView(center: [number, number], zoom: number, options?: { animate?: boolean }): void {
    const centerLngLat: [number, number] = [center[1], center[0]];
    if (options?.animate === false) {
      this.map.jumpTo({ center: centerLngLat, zoom });
      return;
    }
    this.map.easeTo({ center: centerLngLat, zoom });
  }

  stop(): void {
    this.map.stop();
  }

  zoomIn(): void {
    this.map.zoomIn();
  }

  zoomOut(): void {
    this.map.zoomOut();
  }
}
