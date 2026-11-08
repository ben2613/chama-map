import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function LanguageSelector({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { i18n, t } = useTranslation();
  const isEnglish = !i18n.language.startsWith('ja');
  const switchTarget = t(isEnglish ? 'language.japanese' : 'language.english');
  const switchHint = t('language.switchTo', { language: switchTarget });

  const toggleLanguage = () => {
    i18n.changeLanguage(isEnglish ? 'ja' : 'en');
  };

  if (compact) {
    return (
      <motion.button
        type="button"
        onClick={toggleLanguage}
        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-sm border-2 border-gray-300 bg-white leading-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${className ?? ''}`}
        title={switchHint}
        aria-label={switchHint}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-[9px] font-semibold text-gray-500" aria-hidden>
          A⇄あ
        </span>
        <span className="text-sm font-bold text-red-500">{isEnglish ? 'EN' : 'JA'}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={toggleLanguage}
      className={`flex items-center justify-center px-3 py-2 rounded-full bg-white border-2 border-gray-300 hover:border-red-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${className || ''
        }`}
      title={switchHint}
      aria-label={switchHint}
      animate={{ rotate: isEnglish ? 0 : 180 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        scale: { type: 'spring', stiffness: 400, damping: 17 },
        rotate: { type: 'spring', duration: 0.5 }
      }}
    >
      <div
        className="flex items-center text-lg font-bold"
      // animate={{ rotate: isEnglish ? 0 : 180 }}
      // transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <motion.span
          className={`${isEnglish ? 'text-red-500' : 'text-yellow-400'}`}
          animate={{
            scale: isEnglish ? 1.2 : 1,
            opacity: isEnglish ? 1 : 0.5,
            rotate: isEnglish ? 0 : 180
          }}
          transition={{ duration: 0.5 }}
        >
          A
        </motion.span>
        <span className="text-gray-400 mx-1">⇄</span>
        <motion.span
          className={`${!isEnglish ? 'text-red-500' : 'text-yellow-400'}`}
          animate={{
            scale: !isEnglish ? 1.2 : 1,
            opacity: !isEnglish ? 1 : 0.5,
            rotate: isEnglish ? 0 : 180
          }}
          transition={{ duration: 0.5 }}
        >
          あ
        </motion.span>
      </div>
    </motion.button>
  );
}
