import { FaCube } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';

interface Mode3DToggleProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

export default function Mode3DToggle({ enabled, onToggle, className }: Mode3DToggleProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center justify-center w-11 h-11 rounded-sm bg-white border-2 ${
        enabled ? 'border-sky-600 text-sky-600' : 'border-gray-300 text-gray-500'
      } hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-150 cursor-pointer ${className ?? ''}`}
      title={enabled ? t('map.mode3dOff') : t('map.mode3dOn')}
      aria-pressed={enabled}
      aria-label={enabled ? t('map.mode3dOff') : t('map.mode3dOn')}
    >
      <FaCube className="text-base" aria-hidden />
    </button>
  );
}
