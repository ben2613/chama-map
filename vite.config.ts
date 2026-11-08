import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
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
      'react-map-gl',
      '@reduxjs/toolkit',
      'react-redux',
      'i18next',
      'react-i18next',
      'framer-motion',
    ],
  },
  // Environment variable handling - no need for define block since we're using import.meta.env
});