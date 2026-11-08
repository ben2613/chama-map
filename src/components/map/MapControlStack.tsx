import type { ReactNode } from 'react';
import { FaHouse, FaLocationCrosshairs, FaMinus, FaPlus } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { useMapProjection } from '@/map/useMapProjection';
import type { UserGeolocationPosition } from '@/types/geolocation';
import PrefectureOverlayToggle from '@/components/ui/PrefectureOverlayToggle';
import LanguageSelector from '@/components/ui/LanguageSelector';

interface MapControlStackProps {
  onLocate: () => void;
  gpsLoading: boolean;
  gpsDisabled: boolean;
  position?: UserGeolocationPosition | null;
  onReturnToJapan: () => void;
  returnAnimating: boolean;
  prefectureOverlayVisible: boolean;
  onPrefectureOverlayToggle: () => void;
}

const MapControlStack = ({
  onLocate,
  gpsLoading,
  gpsDisabled,
  position,
  onReturnToJapan,
  returnAnimating,
  prefectureOverlayVisible,
  onPrefectureOverlayToggle,
}: MapControlStackProps) => {
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

  const controlBtnClass = `
    w-11 h-11 shrink-0 p-0 bg-white border-2 border-gray-300 rounded-sm
    flex items-center justify-center leading-none
    hover:bg-gray-50 active:bg-gray-100
    transition-colors duration-150 cursor-pointer
  `;

  const iconClass = 'text-gray-700 text-base block';

  return (
    <div className="absolute right-3 bottom-[calc(2.75rem+env(safe-area-inset-bottom,0px))] z-10 flex flex-col items-end gap-2 pointer-events-none chama-map-control map-control-stack">
      <div className="flex flex-col gap-2 pointer-events-auto" data-control-position="bottomright">
        <PrefectureOverlayToggle
          enabled={prefectureOverlayVisible}
          onToggle={onPrefectureOverlayToggle}
          className="!rounded-sm shadow-none"
        />
        <LanguageSelector compact className="shadow-none" />
        <ZoomButton className={controlBtnClass} label="Zoom in" onClick={() => map?.zoomIn()}>
          <FaPlus className={iconClass} aria-hidden />
        </ZoomButton>
        <ZoomButton className={controlBtnClass} label="Zoom out" onClick={() => map?.zoomOut()}>
          <FaMinus className={iconClass} aria-hidden />
        </ZoomButton>
        <button
          type="button"
          className={`${controlBtnClass} ${gpsDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${gpsLoading ? 'animate-pulse' : ''}`}
          data-control-position="bottomright"
          disabled={gpsDisabled}
          onClick={gpsDisabled ? undefined : handleGps}
          title={t('geolocation.currentLocation')}
          aria-label="Center map on current location"
        >
          <FaLocationCrosshairs className={`${iconClass} ${gpsLoading ? 'animate-spin' : ''}`} aria-hidden />
        </button>
        <button
          type="button"
          className={`${controlBtnClass} return-to-japan-button ${returnAnimating ? 'opacity-70' : ''}`}
          data-control-position="bottomright"
          disabled={returnAnimating}
          onClick={onReturnToJapan}
          title={t('returnToJapan.tooltip')}
          aria-label={t('returnToJapan.ariaLabel')}
        >
          <FaHouse className={iconClass} aria-hidden />
        </button>
      </div>
    </div>
  );
};

function ZoomButton({
  children,
  className,
  label,
  onClick,
}: {
  children: ReactNode;
  className: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={className} data-control-position="bottomright" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

export default MapControlStack;
