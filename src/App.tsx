import React, { useState, useEffect, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { FeatureCollection, MultiPolygon, Point } from 'geojson';

// Components
import SplashScreen from '@/components/ui/SplashScreen';
import FloatingArrowButton from '@/components/ui/FloatingArrowButton';
import InfoPanel from '@/components/ui/InfoPanel';
import MapFloatingControls from '@/components/ui/MapFloatingControls';
import Guideline from '@/components/ui/Guideline';
import OtherProject from '@/components/ui/OtherProject';
import DynamicMetadata from '@/components/ui/DynamicMetadata';

// Providers
import StoreProvider from '@/components/providers/StoreProvider';
import TranslationProvider from '@/components/providers/TranslationProvider';

// Types and utilities
import { TrackProperties, PrefectureProperties } from '@/types/map';
import { getPrefectureForPoint } from '@/utils/mapPrefectureUtils';
import { getChamaTrack, getJapanPrefectures } from '@/services/api';

// Lazy load the map component
const JapanMap = React.lazy(() => import('@/components/map/JapanMap'));

// Hook to handle dynamic viewport height for mobile browsers
function useViewportHeight() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial value
    setVH();

    // Update on resize and orientation change
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
      // Delay to account for browser UI animation
      setTimeout(setVH, 100);
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
}

function AppContent() {
  const [infoOpen, setInfoOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [japanData, setJapanData] = useState<FeatureCollection<MultiPolygon, PrefectureProperties> | null>(null);
  const [chamaTrack, setChamaTrack] = useState<FeatureCollection<Point, TrackProperties> | null>(null);
  const [prefectureOverlayVisible, setPrefectureOverlayVisible] = useState(true);

  // Handle dynamic viewport height for mobile browsers
  useViewportHeight();

  useEffect(() => {
    let splashTimeout: ReturnType<typeof setTimeout>;
    Promise.all([getJapanPrefectures(), getChamaTrack()]).then(([japan, track]) => {
      setJapanData(japan);
      setChamaTrack(track);
      // set prefecture properties of chama track with getPrefectureForPoint
      for (const feature of track.features) {
        feature.properties.prefecture = getPrefectureForPoint(feature.geometry.coordinates, japan);
      }
      splashTimeout = setTimeout(() => setShowSplash(false), 1500);
    });
    return () => clearTimeout(splashTimeout);
  }, []);

  return (
    <div className="app-container bg-gradient-to-br from-blue-50 to-purple-50">
      <DynamicMetadata />
      <AnimatePresence>{showSplash && <SplashScreen key="splash" />}</AnimatePresence>
      {!showSplash && japanData && chamaTrack && (
        <Suspense fallback={<div className="flex items-center justify-center h-96">Loading map...</div>}>
          <JapanMap
            className="w-full h-full"
            japanData={japanData}
            chamaTrack={chamaTrack}
            showPrefectureOverlay={prefectureOverlayVisible}
          />
        </Suspense>
      )}
      {/* Floating Arrow Button */}
      {!showSplash && <FloatingArrowButton open={infoOpen} onClick={() => setInfoOpen((v) => !v)} />}
      {/* Info Panel */}
      {!showSplash && <InfoPanel open={infoOpen} />}
      {/* Language Selector */}
      {!showSplash && (
        <MapFloatingControls
          prefectureOverlayVisible={prefectureOverlayVisible}
          onPrefectureOverlayToggle={() => setPrefectureOverlayVisible((v) => !v)}
        />
      )}
      {/* Terms of Service Modal */}
      {!showSplash && <Guideline />}
      {/* Other Project Modal */}
      {!showSplash && <OtherProject />}
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <TranslationProvider>
        <AppContent />
      </TranslationProvider>
    </StoreProvider>
  );
}

export default App;