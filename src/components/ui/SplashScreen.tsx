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
      className="h-full fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-blue-500 relative overflow-hidden"
    >
      {/* Cartoon-like decorative elements */}
      <div className="block absolute inset-0 z-[-1]">
        {/* Simple circles */}
        <div className="absolute top-16 left-16 w-20 h-20 bg-yellow-300 rounded-full"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-orange-300 rounded-full"></div>
        <div className="absolute bottom-24 left-24 w-24 h-24 bg-pink-300 rounded-full"></div>
        <div className="absolute bottom-16 right-16 w-18 h-18 bg-green-300 rounded-full"></div>

        {/* Simple squares */}
        <div className="absolute top-1/2 left-8 w-12 h-12 bg-purple-300 rotate-12"></div>
        <div className="absolute top-1/4 right-8 w-14 h-14 bg-red-300 rotate-45"></div>

        {/* Simple triangles using CSS */}
        <div className="absolute bottom-1/3 left-12 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-cyan-300"></div>
        <div className="absolute top-1/3 right-12 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-l-transparent border-r-transparent border-b-yellow-400"></div>
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.1, type: 'spring' }}
        className="flex flex-col items-center h-full justify-center space-y-8 md:space-y-12 lg:space-y-16 py-12 md:py-16 lg:py-20"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">{titleEN}</h1>
          <p className="text-lg text-gray-200 mb-4">{descriptionEN}</p>
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
          <h1 className="text-4xl font-bold text-white mb-2">{titleJP}</h1>
          <p className="text-lg text-gray-200 mb-4">{descriptionJP}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
