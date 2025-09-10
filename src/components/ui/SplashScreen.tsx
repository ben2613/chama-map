import { motion } from 'framer-motion';
import Image from 'next/image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SplashScreen.module.css';

const SplashScreen: React.FC = () => {
  const { t } = useTranslation();
  const titleEN = t('meta.title', { lng: 'en' });
  const descriptionEN = t('meta.description', { lng: 'en' });
  const titleJP = t('meta.title', { lng: 'ja' });
  const descriptionJP = t('meta.description', { lng: 'ja' });
  return (
    <motion.div
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 to-purple-200"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.1, type: 'spring' }}
        className="flex flex-col items-center h-full justify-evenly py-40"
      >
        <div className="text-center">
          <h1 className="text-xl md:text-4xl font-bold text-gray-800 mb-2 drop-shadow-lg">{titleEN}</h1>
          <p className="text-lg text-gray-600 mb-4">{descriptionEN}</p>
        </div>
        <div className={styles.container}>
          <Image
            src={process.env.NEXT_PUBLIC_BASE_PATH + 'chamapoint.png'}
            className="rounded-full"
            alt="Chama"
            width={200}
            height={200}
          />
        </div>
        <div className="text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 drop-shadow-lg">{titleJP}</h1>
          <p className="text-lg text-gray-600 mb-4">{descriptionJP}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
