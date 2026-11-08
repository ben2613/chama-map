import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000, // Increase timeout to 10 seconds for property-based tests
    // Legacy Leaflet component tests — pending MapLibre harness (see docs/MAP_LIBRE_MIGRATION_PLAN.md)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/utils/mapPrefectureUtils.test.ts',
      'src/components/map/CurrentPositionMarker.test.tsx',
      'src/components/map/CurrentPositionMarker.e2e.test.tsx',
      'src/components/map/GPSControlButton.test.tsx',
      'src/components/map/GeolocationInternationalization.test.tsx',
      'src/components/map/ReturnToJapanButton.test.tsx',
      'src/components/map/ReturnToJapanButton.e2e.test.tsx',
      'src/components/map/ReturnToJapanButton.styling.test.tsx',
      'src/components/map/JapanMap.integration.test.tsx',
      'src/components/map/ReturnToJapanButton.integration.test.tsx',
      'src/components/map/SmartPrefecturePopupPositioning.integration.test.tsx',
      'src/components/map/SmartPrefecturePopupPositioning.final.integration.test.tsx',
      'src/components/map/PrefecturePopup.test.tsx',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});