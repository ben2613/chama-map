import type { LngLatBounds } from 'maplibre-gl';
import { latLng, type LatLng } from './geoTypes';

export class GeoBounds {
  private readonly south: number;
  private readonly west: number;
  private readonly north: number;
  private readonly east: number;

  constructor(southWest: LatLng | [number, number], northEast: LatLng | [number, number]) {
    const sw = Array.isArray(southWest) ? latLng(southWest[0], southWest[1]) : southWest;
    const ne = Array.isArray(northEast) ? latLng(northEast[0], northEast[1]) : northEast;
    this.south = Math.min(sw.lat, ne.lat);
    this.north = Math.max(sw.lat, ne.lat);
    this.west = Math.min(sw.lng, ne.lng);
    this.east = Math.max(sw.lng, ne.lng);
  }

  static fromMapLibre(bounds: LngLatBounds): GeoBounds {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    return new GeoBounds(
      { lat: sw.lat, lng: sw.lng },
      { lat: ne.lat, lng: ne.lng }
    );
  }

  contains(coord: LatLng | [number, number]): boolean {
    const { lat, lng } = Array.isArray(coord) ? latLng(coord[0], coord[1]) : coord;
    return lat >= this.south && lat <= this.north && lng >= this.west && lng <= this.east;
  }

  intersects(other: GeoBounds): boolean {
    return !(
      other.east < this.west ||
      other.west > this.east ||
      other.north < this.south ||
      other.south > this.north
    );
  }

  getNorth(): number {
    return this.north;
  }

  getSouth(): number {
    return this.south;
  }

  getEast(): number {
    return this.east;
  }

  getWest(): number {
    return this.west;
  }

  getCenter(): LatLng {
    return latLng((this.south + this.north) / 2, (this.west + this.east) / 2);
  }
}

/** Leaflet-style helper: `latLngBounds([lat, lng], [lat, lng])`. */
export function geoBounds(
  southWest: LatLng | [number, number],
  northEast: LatLng | [number, number]
): GeoBounds {
  return new GeoBounds(southWest, northEast);
}
