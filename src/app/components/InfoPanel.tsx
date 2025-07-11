import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
          className={`fixed top-45 left-2 z-[10000] max-w-lg opacity-100 group ${className || ''}`}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            className="overflow-hidden bg-white/95 rounded-xl shadow-xl border border-gray-200 px-6 py-4 transition-all duration-300 max-h-[600px] opacity-100"
            style={{ minWidth: 280 }}
          >
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">🗾 Japan Prefecture Map</h1>
              <p className="text-base text-gray-600">Interactive cartoon-style map of Japan&apos;s 47 prefectures</p>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">About This Map</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-base font-medium text-gray-700 mb-1">Features</h3>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Interactive prefecture boundaries</li>
                  <li>• Cartoon-style colorful overlay</li>
                  <li>• Hover effects and popups</li>
                  <li>• Click animations</li>
                  <li>• Haachama trip footage markers</li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-700 mb-1">Tech Stack</h3>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Next.js (Static Export)</li>
                  <li>• React Leaflet</li>
                  <li>• Tailwind CSS</li>
                  <li>• TypeScript</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InfoPanel;
