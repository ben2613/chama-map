'use client';
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import { AnimatePresence } from 'framer-motion';
import FloatingArrowButton from './components/FloatingArrowButton';
import InfoPanel from './components/InfoPanel';
import type { FeatureCollection, MultiPolygon, Point } from 'geojson';
import { TrackProperties, PrefectureProperties } from '@/types/map';
import { getPrefectureForPoint } from './shared/function';
import { getChamaTrack, getJapanPrefectures } from './shared/api';

const JapanMap = dynamic(() => import('./components/JapanMap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading map...</div>
});

export default function Home() {
  const [infoOpen, setInfoOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [japanData, setJapanData] = useState<FeatureCollection<MultiPolygon, PrefectureProperties> | null>(null);
  const [chamaTrack, setChamaTrack] = useState<FeatureCollection<Point, TrackProperties> | null>(null);

  useEffect(() => {
    let splashTimeout: NodeJS.Timeout;
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
    <div className="min-h-screen min-w-screen w-screen h-screen fixed top-0 left-0 bg-gradient-to-br from-blue-50 to-purple-50">
      <AnimatePresence>{showSplash && <SplashScreen key="splash" />}</AnimatePresence>
      {!showSplash && japanData && chamaTrack && (
        <JapanMap className="w-full h-full" japanData={japanData} chamaTrack={chamaTrack} />
      )}
      {/* Floating Arrow Button */}
      {!showSplash && <FloatingArrowButton open={infoOpen} onClick={() => setInfoOpen((v) => !v)} />}
      {/* Info Panel */}
      {!showSplash && <InfoPanel open={infoOpen} />}
    </div>
  );
}
