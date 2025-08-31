'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  useEffect(() => {
    const updateLanguage = () => {
      setCurrentLanguage(i18n.language);
    };

    if (i18n.isInitialized) {
      setIsReady(true);
      updateLanguage();
    } else {
      const handleInitialized = () => {
        setIsReady(true);
        updateLanguage();
      };
      i18n.on('initialized', handleInitialized);
      i18n.on('languageChanged', updateLanguage);
      
      return () => {
        i18n.off('initialized', handleInitialized);
        i18n.off('languageChanged', updateLanguage);
      };
    }
  }, [i18n]);

  // Don't render until i18n is ready
  if (!isReady) {
    return null;
  }

  // More robust language detection
  const isEnglish = currentLanguage.startsWith('en');

  const toggleLanguage = () => {
    const newLanguage = isEnglish ? 'ja' : 'en';
    i18n.changeLanguage(newLanguage);
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      className="fixed bottom-10 right-15 z-[10001] flex items-center justify-center px-3 py-2 rounded-full bg-white border-2 border-gray-300 hover:border-red-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      title={isEnglish ? 'Switch to Japanese' : 'Switch to English'}
      animate={{ rotate: isEnglish ? 0 : 180 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        scale: { type: 'spring', stiffness: 400, damping: 17 },
        rotate: { type: 'spring', duration: 0.5 }
      }}
    >
      <div className="flex items-center text-lg font-bold">
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
