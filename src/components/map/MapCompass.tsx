import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useTranslation } from 'react-i18next';
import { MAP_ID } from '@/map/useMapProjection';

/** Points toward geographic north; rotated like MapLibre’s compass: -bearing deg. */
function NorthArrow({ bearing }: { bearing: number }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden
      style={{ transform: `rotate(${-bearing}deg)` }}
    >
      <path d="M12 3 20 21 12 17 4 21Z" fill="currentColor" />
    </svg>
  );
}

const MapCompass = () => {
  const { t } = useTranslation();
  const maps = useMap();
  const map = (maps[MAP_ID] ?? maps.current)?.getMap();
  const [bearing, setBearing] = useState(0);
  const [isTilted, setIsTilted] = useState(false);

  useEffect(() => {
    if (!map) return;

    const sync = () => {
      setBearing(map.getBearing());
      setIsTilted(Math.abs(map.getPitch()) > 0.5);
    };

    sync();
    map.on('rotate', sync);
    map.on('move', sync);
    return () => {
      map.off('rotate', sync);
      map.off('move', sync);
    };
  }, [map]);

  const resetNorth = () => {
    if (!map) return;
    map.easeTo({ bearing: 0, pitch: 0, duration: 300 });
  };

  const offNorth = Math.abs(bearing) > 0.5 || isTilted;

  return (
    <button
      type="button"
      onClick={resetNorth}
      title={t('map.resetNorth')}
      aria-label={t('map.resetNorth')}
      data-control-position="topright"
      className={`w-11 h-11 shrink-0 p-0 flex items-center justify-center leading-none rounded-sm bg-white border-2 transition-colors duration-150 ${
        offNorth ? 'border-red-500 text-red-500' : 'border-gray-300 text-gray-500'
      } hover:bg-gray-50 active:bg-gray-100`}
    >
      <NorthArrow bearing={bearing} />
    </button>
  );
};

export default MapCompass;
