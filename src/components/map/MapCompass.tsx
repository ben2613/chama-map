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
    <div className="absolute top-3 right-3 z-10 pointer-events-auto maplibregl-ctrl chama-map-control">
      <button
        type="button"
        onClick={resetNorth}
        title={t('map.resetNorth')}
        aria-label={t('map.resetNorth')}
        className={`w-11 h-11 flex items-center justify-center rounded-sm bg-white border-2 transition-colors duration-150 ${
          offNorth ? 'border-red-500 text-red-500' : 'border-gray-300 text-gray-500'
        } hover:bg-gray-50 active:bg-gray-100`}
      >
        <NorthArrow bearing={bearing} />
      </button>
    </div>
  );
};

export default MapCompass;
