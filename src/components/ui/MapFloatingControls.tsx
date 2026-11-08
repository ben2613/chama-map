import LanguageSelector from './LanguageSelector';
import PrefectureOverlayToggle from './PrefectureOverlayToggle';

interface MapFloatingControlsProps {
  prefectureOverlayVisible: boolean;
  onPrefectureOverlayToggle: () => void;
}

export default function MapFloatingControls({
  prefectureOverlayVisible,
  onPrefectureOverlayToggle,
}: MapFloatingControlsProps) {
  return (
    <div className="fixed bottom-10 right-15 z-[10001] flex flex-col items-end gap-2">
      <PrefectureOverlayToggle enabled={prefectureOverlayVisible} onToggle={onPrefectureOverlayToggle} />
      <LanguageSelector />
    </div>
  );
}
