import type { JapanViewConfig } from '@/types/geolocation';
import type { MapProjection } from '@/map/mapProjection';

// Japan default view configuration
export const JAPAN_DEFAULT_VIEW: JapanViewConfig = {
  center: [36.2048, 138.2529],
  zoom: 6,
  animationOptions: {
    duration: 1.5,
    easeLinearity: 0.25
  }
};

// Japan bounds for validation
export const JAPAN_BOUNDS = {
  north: 45.5,
  south: 30.0,
  east: 146.0,
  west: 129.0
};

// Performance optimization constants for mobile devices
export const PERFORMANCE_CONFIG = {
  // Use requestAnimationFrame for smooth animations
  USE_RAF: true,
  // Reduce animation complexity on mobile
  MOBILE_ANIMATION_DURATION: 1.0, // Shorter duration for mobile
  DESKTOP_ANIMATION_DURATION: 1.5, // Standard duration for desktop
  // Debounce rapid clicks
  CLICK_DEBOUNCE_MS: 300,
  // Animation frame throttling for mobile
  MOBILE_FPS_TARGET: 30, // Target 30fps on mobile for better performance
  DESKTOP_FPS_TARGET: 60, // Target 60fps on desktop
  // Memory management
  CLEANUP_DELAY_MS: 100, // Delay before cleanup to ensure smooth transitions
} as const;

// Animation configuration constants
export const ANIMATION_CONFIG = {
  DURATION_MIN: 1.0, // Minimum animation duration in seconds
  DURATION_MAX: 2.0, // Maximum animation duration in seconds
  EASE_LINEARITY: 0.25, // Smooth deceleration
  TIMEOUT_BUFFER: 500 // Buffer time in milliseconds for animation timeout
} as const;

// Utility to detect mobile devices for performance optimization
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768) ||
    ('ontouchstart' in window);
};

// Utility to get optimal animation duration based on device
export const getOptimalAnimationDuration = (): number => {
  return isMobileDevice()
    ? PERFORMANCE_CONFIG.MOBILE_ANIMATION_DURATION
    : PERFORMANCE_CONFIG.DESKTOP_ANIMATION_DURATION;
};

/** Wrap longitude to [-180, 180] so vector layers align with wrapped tile copies */
export const normalizeLongitude = (lng: number): number =>
  ((lng + 180) % 360 + 360) % 360 - 180;

// Utility function to check if the current map view is close to Japan's default view
export const isMapAtJapanView = (map: MapProjection, tolerance = 0.1): boolean => {
  const center = map.getCenter();
  const zoom = map.getZoom();

  const latDiff = Math.abs(center.lat - JAPAN_DEFAULT_VIEW.center[0]);
  const lngDiff = Math.abs(center.lng - JAPAN_DEFAULT_VIEW.center[1]);
  const zoomDiff = Math.abs(zoom - JAPAN_DEFAULT_VIEW.zoom);

  return latDiff <= tolerance && lngDiff <= tolerance && zoomDiff <= 1;
};