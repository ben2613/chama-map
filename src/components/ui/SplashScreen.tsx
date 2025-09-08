import { motion } from 'framer-motion';
import Image from 'next/image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SplashScreen.module.css';

const SplashScreen: React.FC = () => {
  const { t } = useTranslation();
  const title = t('meta.title');
  const description = t('meta.description');
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
        className="flex flex-col items-center"
      >
        <div className={styles.container}>
          <Image
            src={process.env.NEXT_PUBLIC_BASE_PATH + 'chamapoint.png'}
            className="rounded-full"
            alt="Chama"
            width={100}
            height={100}
          />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-2 drop-shadow-lg">{title}</h1>
        <p className="text-lg text-gray-600 mb-4">{description}</p>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
