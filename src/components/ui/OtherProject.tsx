'use client';

import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { hideOtherProject } from '@/lib/slices/otherProjectSlice';
import { FaHeart, FaItchIo, FaYoutube } from 'react-icons/fa';

export default function OtherProject() {
  const { t } = useTranslation();
  const isVisible = useAppSelector((state) => state.otherProject.isVisible);
  const dispatch = useAppDispatch();

  const handleClose = () => {
    dispatch(hideOtherProject());
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[10002] flex items-center justify-center"
        >
          {/* Full-screen modal backdrop */}
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)]" onClick={handleBackdropClick} />

          {/* Modal content */}
          <div className="relative z-10 flex items-center justify-center p-8">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
              {/* Header */}
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200/50 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">{t('otherProject.title')}</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <div className="space-y-4">
                  <a
                    href={t('otherProject.link1.url')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200"
                  >
                    <h3 className="font-medium text-gray-800 mb-1">
                      <FaYoutube className="inline-block text-red-500 mr-1" /> {t('otherProject.link1.title')}
                    </h3>
                  </a>

                  <a
                    href={t('otherProject.link2.url')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200"
                  >
                    <h3 className="font-medium text-gray-800 mb-1">
                      <FaYoutube className="inline-block text-red-500 mr-1" /> {t('otherProject.link2.title')}
                    </h3>
                  </a>

                  <a
                    href={t('otherProject.link3.url')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200"
                  >
                    <h3 className="font-medium text-gray-800 mb-1">
                      <FaItchIo className="inline-block text-gray-500 mr-1" /> {t('otherProject.link3.title')}
                    </h3>
                  </a>

                  <a
                    href={t('otherProject.link4.url')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200"
                  >
                    <h3 className="font-medium text-gray-800 mb-1">
                      <FaHeart className="inline-block text-red-500 mr-1" /> {t('otherProject.link4.title')}
                    </h3>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
