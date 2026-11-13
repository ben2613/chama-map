import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

const base = process.env.VITE_BASE_PATH || '/';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: [
        'favicon.ico',
        'apple-icon.png',
        'chamapoint.png',
        'web-app-manifest-192x192.png',
        'web-app-manifest-512x512.png',
      ],
      manifest: {
        name: "Haachama's Journey",
        short_name: "Haachama's Journey",
        description: 'Track the Chama!',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: `${base}web-app-manifest-192x192.png`.replace(/\/+/g, '/'),
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: `${base}web-app-manifest-512x512.png`.replace(/\/+/g, '/'),
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,mjs,webmanifest}',
          'data/**/*.{json,geojson,png}',
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/\/data\//, /\.(?:json|geojson|png|jpg|jpeg|webp|ico)$/i],
        // No runtimeCaching — map tiles and popup images use the browser HTTP cache only.
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base,
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [
            { name: 'vendor', test: /node_modules[\\/](react|react-dom)[\\/]/, priority: 30 },
            { name: 'maplibre', test: /node_modules[\\/](maplibre-gl|react-map-gl)[\\/]/, priority: 25 },
            { name: 'redux', test: /node_modules[\\/](@reduxjs\/toolkit|react-redux)[\\/]/, priority: 20 },
            {
              name: 'i18n',
              test: /node_modules[\\/](i18next|react-i18next|i18next-browser-languagedetector)[\\/]/,
              priority: 20,
            },
            { name: 'motion', test: /node_modules[\\/]framer-motion[\\/]/, priority: 15 },
            {
              name: 'utils',
              test: /node_modules[\\/](@turf\/boolean-point-in-polygon|fflate|@xmldom\/xmldom|striptags)[\\/]/,
              priority: 15,
            },
          ],
        },
      },
    },
    // Optimize for production
    minify: 'terser',
    target: 'es2020',
  },
  server: {
    port: 3000,
    open: true,
    host: true, // Allow external connections
  },
  preview: {
    port: 3000,
    host: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'maplibre-gl',
      'react-map-gl/maplibre',
      '@reduxjs/toolkit',
      'react-redux',
      'i18next',
      'react-i18next',
      'framer-motion',
    ],
  },
  // Environment variable handling - no need for define block since we're using import.meta.env
});
