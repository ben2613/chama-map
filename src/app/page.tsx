'use client';
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import { AnimatePresence } from 'framer-motion';
import FloatingArrowButton from './components/FloatingArrowButton';
import InfoPanel from './components/InfoPanel';
import type { FeatureCollection, Geometry, MultiPolygon } from 'geojson';
import { FootageProperties, PrefectureProperties } from '@/types/map';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { Coord } from '@turf/helpers';

const JapanMap = dynamic(() => import('./components/JapanMap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading map...</div>
});

function getPrefectureForPoint(point: Coord, prefectures: FeatureCollection<MultiPolygon, PrefectureProperties>) {
  for (const feature of prefectures.features) {
    if (booleanPointInPolygon(point, feature)) {
      return feature.properties.nam;
    }
  }
  return null;
}

export default function Home() {
  const [infoOpen, setInfoOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [japanData, setJapanData] = useState<FeatureCollection<MultiPolygon, PrefectureProperties> | null>(null);
  const [chamaFootage, setChamaFootage] = useState<FeatureCollection<Geometry, FootageProperties> | null>(null);

  useEffect(() => {
    let splashTimeout: NodeJS.Timeout;
    Promise.all([
      fetch('data/japan-prefectures.geojson').then((res) => res.json()),
      fetch('data/chama-footage.geojson').then((res) => res.json())
    ]).then(([japan, footage]) => {
      setJapanData(japan);
      setChamaFootage(footage);
      // set prefecture properties of chama footage with getPrefectureForPoint
      for (const feature of footage.features) {
        feature.properties.prefecture = getPrefectureForPoint(feature.geometry.coordinates, japan);
      }
      splashTimeout = setTimeout(() => setShowSplash(false), 1500);
    });
    return () => clearTimeout(splashTimeout);
  }, []);

  return (
    <div className="min-h-screen min-w-screen w-screen h-screen fixed top-0 left-0 bg-gradient-to-br from-blue-50 to-purple-50">
      <AnimatePresence>{showSplash && <SplashScreen key="splash" />}</AnimatePresence>
      {!showSplash && japanData && chamaFootage && (
        <JapanMap className="w-full h-full" japanData={japanData} chamaFootage={chamaFootage} />
      )}
      {/* Floating Arrow Button */}
      {!showSplash && <FloatingArrowButton open={infoOpen} onClick={() => setInfoOpen((v) => !v)} />}
      {/* Info Panel */}
      {!showSplash && <InfoPanel open={infoOpen} />}
    </div>
  );
}
