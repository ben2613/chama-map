import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaTwitter } from 'react-icons/fa6';

interface InfoPanelProps {
  open: boolean;
  className?: string;
}

const panelVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 }
};

const InfoPanel: React.FC<InfoPanelProps> = ({ open, className }) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="info-panel"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={panelVariants}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className={`fixed top-20 left-5 z-[10000] max-w-lg opacity-100 group ${className || ''}`}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            className="overflow-hidden bg-white/95 rounded-xl shadow-xl border-2 border-[#87cefa] px-6 py-4 transition-all duration-300 max-h-[600px] opacity-100"
            style={{ minWidth: 280 }}
          >
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">🗾 {t('meta.title')}</h1>
              <p className="text-base text-gray-600">{t('infoPanel.description')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">{t('infoPanel.createdBy')}</h3>
              <div className="mt-2 text-xs text-gray-500">
                {t('infoPanel.comments')}
                <div>
                  <a href="https://x.com/intent/post?&text=%23AkaiJourney" target="_blank" rel="noopener noreferrer">
                    <FaTwitter className="inline-block text-blue-500" />
                    <span className="ml-1 mr-2 text-blue-500">#AkaiJourney</span>
                  </a>
                  <a href="https://github.com/ben2613/chama-map/issues" target="_blank" rel="noopener noreferrer">
                    <FaGithub className="inline-block text-gray-500" />
                    <span className="ml-1 text-gray-500">Github Issues</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InfoPanel;
