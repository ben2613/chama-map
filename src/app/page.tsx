'use client'
import dynamic from 'next/dynamic'
import React, { useState } from 'react'
import SplashScreen from './components/SplashScreen'
import { AnimatePresence } from 'framer-motion'
import FloatingArrowButton from './components/FloatingArrowButton'
import InfoPanel from './components/InfoPanel'

// Dynamically import the map to avoid SSR issues
const JapanMap = dynamic(() => import('./components/JapanMap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading map...</div>
})

export default function Home() {
  const [infoOpen, setInfoOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  React.useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500)
    return () => clearTimeout(timer)
  }, [])
  return (
    <div className="min-h-screen min-w-screen w-screen h-screen fixed top-0 left-0 bg-gradient-to-br from-blue-50 to-purple-50">
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>
      {!showSplash && <JapanMap className="w-full h-full" />}
      {/* Floating Arrow Button */}
      {!showSplash && (
        <FloatingArrowButton open={infoOpen} onClick={() => setInfoOpen(v => !v)} />
      )}
      {/* Info Panel */}
      {!showSplash && (
        <InfoPanel open={infoOpen} />
      )}
    </div>
  )
}
