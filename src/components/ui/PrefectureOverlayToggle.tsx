import { motion } from 'framer-motion';
import { FaMap } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';

interface PrefectureOverlayToggleProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

export default function PrefectureOverlayToggle({ enabled, onToggle, className }: PrefectureOverlayToggleProps) {
  const { t } = useTranslation();

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      className={`flex items-center justify-center w-11 h-11 rounded-full bg-white border-2 ${
        enabled ? 'border-red-500 text-red-500' : 'border-gray-300 text-gray-400'
      } hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${className ?? ''}`}
      title={enabled ? t('map.prefectureOverlayHide') : t('map.prefectureOverlayShow')}
      aria-pressed={enabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <FaMap className="text-lg" aria-hidden />
    </motion.button>
  );
}
