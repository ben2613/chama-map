import { motion } from 'framer-motion';
import React from 'react';

const SplashScreen: React.FC = () => {
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
        <span className="text-5xl md:text-7xl mb-4 animate-bounce">🗾</span>
        <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-2 drop-shadow-lg">Haachama Radar</h1>
        <p className="text-lg text-gray-600 mb-4">A fan project for Haachama&apos;s Japan trips</p>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen; 