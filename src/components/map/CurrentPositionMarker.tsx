import React from 'react';
import type { FeatureCollection, Polygon } from 'geojson';
import { Marker, Source, Layer } from 'react-map-gl/maplibre';
import { useTranslation } from 'react-i18next';
import type { UserGeolocationPosition } from '@/types/geolocation';
import styles from './CurrentPositionMarker.module.css';

interface CurrentPositionMarkerProps {
  position: UserGeolocationPosition | null;
  accuracy?: number;
  isLoading: boolean;
  isPermissionGranted: boolean;
}

function circlePolygon(lat: number, lng: number, radiusMeters: number, steps = 64): Polygon {
  const coords: [number, number][] = [];
  const earth = 6371000;
  for (let i = 0; i <= steps; i += 1) {
    const bearing = (i / steps) * 2 * Math.PI;
    const dx = radiusMeters * Math.cos(bearing);
    const dy = radiusMeters * Math.sin(bearing);
    const dLat = dy / earth;
    const dLng = dx / (earth * Math.cos((lat * Math.PI) / 180));
    coords.push([lng + (dLng * 180) / Math.PI, lat + (dLat * 180) / Math.PI]);
  }
  return { type: 'Polygon', coordinates: [coords] };
}

const CurrentPositionMarker: React.FC<CurrentPositionMarkerProps> = ({
  position,
  accuracy,
  isLoading,
  isPermissionGranted,
}) => {
  const { t } = useTranslation();

  if (!isPermissionGranted || !position) {
    return null;
  }

  const shouldShowAccuracyCircle = accuracy && accuracy > 0;
  const shouldShowWarning = accuracy && accuracy > 1000;

  const accuracyGeoJson: FeatureCollection | null = shouldShowAccuracyCircle
    ? {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: circlePolygon(position.lat, position.lng, accuracy),
          },
        ],
      }
    : null;

  return (
    <>
      {accuracyGeoJson && (
        <Source id="geolocation-accuracy" type="geojson" data={accuracyGeoJson}>
          <Layer
            id="geolocation-accuracy-fill"
            type="fill"
            paint={{
              'fill-color': '#3b82f6',
              'fill-opacity': 0.1,
            }}
          />
          <Layer
            id="geolocation-accuracy-line"
            type="line"
            paint={{
              'line-color': '#3b82f6',
              'line-opacity': 0.5,
              'line-width': 2,
            }}
          />
        </Source>
      )}

      <Marker longitude={position.lng} latitude={position.lat} anchor="center">
        <div
          className={`${styles['current-position-marker']}${isLoading ? ' loading' : ''}`}
          title={t('geolocation.currentLocation')}
          style={{
            width: 16,
            height: 16,
            backgroundColor: '#3b82f6',
            border: '3px solid white',
            borderRadius: '50%',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
          }}
        />
        {shouldShowWarning && (
          <span className="text-xs text-amber-500 block text-center whitespace-nowrap">
            {t('geolocation.lowAccuracyWarning')}
          </span>
        )}
      </Marker>
    </>
  );
};

export default CurrentPositionMarker;
