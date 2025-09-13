'use client';

import { useState, useEffect } from 'react';
import useCookie from 'react-use-cookie';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import LanguageSelector from './LanguageSelector';
import { Trans, useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { hideGuideline } from '@/lib/slices/guidelineSlice';

export default function Guideline() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tosAccepted, setTosAccepted] = useCookie('tosAccepted', 'false');
  const { t } = useTranslation();
  const isVisibleState = useAppSelector((state) => state.guideline.isVisible);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (tosAccepted === 'false') {
      setIsVisible(true);
    }

    setIsLoading(false);
  }, [tosAccepted]);

  const handleAccept = () => {
    // Set cookie to remember user's acceptance
    setTosAccepted('true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    // Redirect to Google
    window.location.href = 'https://www.google.com';
  };
  const isShow = isLoading || isVisible || isVisibleState;
  return (
    <AnimatePresence>
      {isShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[10002] flex items-center justify-center"
        >
          {/* Full-screen modal backdrop */}
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)]" />

          {/* Modal content */}
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200/50">
                <h2 className="text-2xl font-semibold text-gray-800 text-center">{t('guideline.title')}</h2>
              </div>

              <div className="px-6 flex items-center justify-center">
                <div className="text-gray-600 text-center max-h-[50vh] overflow-y-auto">
                  <p className="text-left">
                    {
                      <Trans i18nKey="guideline.body.p1">
                        Text
                        <a
                          className="underline"
                          href={t('guideline.wiki_seichi_junrei')}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Seichi-junrei
                        </a>
                        Text
                        <a
                          className="underline"
                          href="https://x.com/search?q=%23%E6%8E%A8%E3%81%97%E6%B4%BB%E3%81%AF%E3%81%82%E3%81%A8%E3%82%93%E6%97%A5%E8%A8%98&src=typed_query"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          #推し活はあとん日記
                        </a>
                        Text
                      </Trans>
                    }
                  </p>
                  <br />
                  <p className="text-left">{<Trans i18nKey="guideline.body.p2" />}</p>
                  <ul className="text-left list-disc list-inside">
                    <li>{t('guideline.body.li1')}</li>
                    <li>{t('guideline.body.li2')}</li>
                  </ul>
                </div>
              </div>

              {/* Footer with buttons */}
              <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-200/50 flex justify-center space-x-4">
                {isVisibleState ? (
                  <button className="block w-full text-gray-700" onClick={() => dispatch(hideGuideline())}>
                    {t('common.close')}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleDecline}
                      className="text-sm relative group px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-400 transition-colors duration-200 font-medium shadow-sm"
                    >
                      {t('guideline.decline')}
                    </button>

                    <button
                      onClick={handleAccept}
                      className="text-sm px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-colors duration-200 font-medium shadow-sm"
                    >
                      {t('guideline.accept')}
                    </button>
                    <LanguageSelector className="animate-pulse" />
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
