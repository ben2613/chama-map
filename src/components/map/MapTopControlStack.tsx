import { FaHouse, FaLocationCrosshairs } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import PrefectureOverlayToggle from '@/components/ui/PrefectureOverlayToggle';
import LanguageSelector from '@/components/ui/LanguageSelector';
import { useMapProjection } from '@/map/useMapProjection';
import type { UserGeolocationPosition } from '@/types/geolocation';
import type { Feature, Point } from 'geojson';
import type { TrackProperties } from '@/types/map';
import MapCompass from './MapCompass';
import OverseasLocationsControl from './OverseasLocationsControl';

const controlBtnClass = `
  w-11 h-11 shrink-0 p-0 bg-white border-2 border-gray-300 rounded-sm
  flex items-center justify-center leading-none
  hover:bg-gray-50 active:bg-gray-100
  transition-colors duration-150 cursor-pointer
`;

const iconClass = 'text-gray-700 text-base block';

interface MapTopControlStackProps {
  onLocate: () => void;
  gpsLoading: boolean;
  gpsDisabled: boolean;
  position?: UserGeolocationPosition | null;
  prefectureOverlayVisible: boolean;
  onPrefectureOverlayToggle: () => void;
  overseasGroups?: Feature<Point, TrackProperties>[][];
  onOverseasSelect?: (feature: Feature<Point, TrackProperties>) => void;
  onOverseasOpenChange?: (open: boolean) => void;
  onReturnToJapan: () => void;
  returnAnimating: boolean;
}

const MapTopControlStack = ({
  onLocate,
  gpsLoading,
  gpsDisabled,
  position,
  prefectureOverlayVisible,
  onPrefectureOverlayToggle,
  overseasGroups = [],
  onOverseasSelect,
  onOverseasOpenChange,
  onReturnToJapan,
  returnAnimating,
}: MapTopControlStackProps) => {
  const { t } = useTranslation();
  const map = useMapProjection();

  const handleGps = () => {
    if (!map) return;
    if (position) {
      map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 15), { duration: 1 });
    } else {
      onLocate();
    }
  };

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2 pointer-events-none chama-map-control map-secondary-control-stack">
      <div className="flex flex-col items-end gap-2 pointer-events-auto" data-control-position="topright">
        <MapCompass />
        <PrefectureOverlayToggle
          enabled={prefectureOverlayVisible}
          onToggle={onPrefectureOverlayToggle}
          className="!rounded-sm shadow-none"
        />
        <LanguageSelector compact className="shadow-none" />
        {onOverseasSelect && (
          <OverseasLocationsControl
            groups={overseasGroups}
            onSelect={onOverseasSelect}
            onOpenChange={onOverseasOpenChange}
          />
        )}
        <button
          type="button"
          className={`${controlBtnClass} return-to-japan-button flex-col gap-0.5 border-red-400 ${returnAnimating ? 'opacity-70' : ''}`}
          data-control-position="topright"
          disabled={returnAnimating}
          onClick={onReturnToJapan}
          title={t('returnToJapan.tooltip')}
          aria-label={t('returnToJapan.ariaLabel')}
        >
          <FaHouse className="text-[10px] text-gray-500" aria-hidden />
          <span className="text-sm font-bold leading-none text-red-500">JP</span>
        </button>
        <button
          type="button"
          className={`${controlBtnClass} ${gpsDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${gpsLoading ? 'animate-pulse' : ''}`}
          data-control-position="topright"
          disabled={gpsDisabled}
          onClick={gpsDisabled ? undefined : handleGps}
          title={t('geolocation.currentLocation')}
          aria-label="Center map on current location"
        >
          <FaLocationCrosshairs className={`${iconClass} ${gpsLoading ? 'animate-spin' : ''}`} aria-hidden />
        </button>
      </div>
    </div>
  );
};

export default MapTopControlStack;
