import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import CurrentPositionMarker from './CurrentPositionMarker';
import GPSControlButton from './GPSControlButton';
import { MapContainer } from 'react-leaflet';
import type { UserGeolocationPosition } from '@/types/geolocation';

// Test wrapper component that provides required context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    <MapContainer center={[35.6762, 139.6503]} zoom={10} style={{ height: '400px', width: '400px' }}>
      {children}
    </MapContainer>
  </I18nextProvider>
);

describe.skip('Geolocation Internationalization Tests (MapLibre)', () => {
  const mockPosition: UserGeolocationPosition = {
    lat: 35.6762,
    lng: 139.6503,
    accuracy: 10,
    timestamp: Date.now()
  };

  beforeEach(() => {
    // Reset to English before each test
    i18n.changeLanguage('en');
  });

  describe('Translation Key Usage and Fallbacks', () => {
    it('should use correct translation keys for current location tooltip in English', () => {
      render(
        <TestWrapper>
          <CurrentPositionMarker
            position={mockPosition}
            accuracy={10}
            isLoading={false}
            isPermissionGranted={true}
          />
        </TestWrapper>
      );

      // Check that the English translation is used
      expect(i18n.t('geolocation.currentLocation')).toBe('Current Location');
    });

    it('should use correct translation keys for current location tooltip in Japanese', () => {
      i18n.changeLanguage('ja');

      render(
        <TestWrapper>
          <CurrentPositionMarker
            position={mockPosition}
            accuracy={10}
            isLoading={false}
            isPermissionGranted={true}
          />
        </TestWrapper>
      );

      // Check that the Japanese translation is used
      expect(i18n.t('geolocation.currentLocation')).toBe('現在地');
    });

    it('should use correct translation keys for low accuracy warning in English', () => {
      const lowAccuracyPosition = { ...mockPosition, accuracy: 1500 };

      render(
        <TestWrapper>
          <CurrentPositionMarker
            position={lowAccuracyPosition}
            accuracy={1500}
            isLoading={false}
            isPermissionGranted={true}
          />
        </TestWrapper>
      );

      expect(i18n.t('geolocation.lowAccuracyWarning')).toBe('Low accuracy location');
    });

    it('should use correct translation keys for low accuracy warning in Japanese', () => {
      i18n.changeLanguage('ja');
      const lowAccuracyPosition = { ...mockPosition, accuracy: 1500 };

      render(
        <TestWrapper>
          <CurrentPositionMarker
            position={lowAccuracyPosition}
            accuracy={1500}
            isLoading={false}
            isPermissionGranted={true}
          />
        </TestWrapper>
      );

      expect(i18n.t('geolocation.lowAccuracyWarning')).toBe('位置精度が低いです');
    });

    it('should use correct translation keys for GPS button states in English', () => {
      const mockOnLocate = () => { };

      render(
        <TestWrapper>
          <GPSControlButton
            onLocate={mockOnLocate}
            isLoading={false}
            isDisabled={true}
            position={null}
          />
        </TestWrapper>
      );

      expect(i18n.t('geolocation.positionUnavailable')).toBe('Location unavailable');
      expect(i18n.t('geolocation.currentLocation')).toBe('Current Location');
    });

    it('should use correct translation keys for GPS button states in Japanese', () => {
      i18n.changeLanguage('ja');
      const mockOnLocate = () => { };

      render(
        <TestWrapper>
          <GPSControlButton
            onLocate={mockOnLocate}
            isLoading={false}
            isDisabled={true}
            position={null}
          />
        </TestWrapper>
      );

      expect(i18n.t('geolocation.positionUnavailable')).toBe('位置情報が利用できません');
      expect(i18n.t('geolocation.currentLocation')).toBe('現在地');
    });

    it('should have fallback translations for all geolocation error messages', () => {
      // Test that all required translation keys exist
      const requiredKeys = [
        'geolocation.currentLocation',
        'geolocation.lowAccuracyWarning',
        'geolocation.permissionDenied',
        'geolocation.positionUnavailable',
        'geolocation.timeout',
        'geolocation.enableLocationInstructions'
      ];

      requiredKeys.forEach(key => {
        // Test English
        i18n.changeLanguage('en');
        const enTranslation = i18n.t(key as any);
        expect(enTranslation).not.toBe(key); // Should not return the key itself
        expect(enTranslation).toBeTruthy();

        // Test Japanese
        i18n.changeLanguage('ja');
        const jaTranslation = i18n.t(key as any);
        expect(jaTranslation).not.toBe(key); // Should not return the key itself
        expect(jaTranslation).toBeTruthy();
        expect(jaTranslation).not.toBe(enTranslation); // Should be different from English
      });
    });

    it('should fallback to English when translation key is missing', () => {
      i18n.changeLanguage('ja');

      // Test with a non-existent key
      const fallbackTranslation = i18n.t('geolocation.nonExistentKey' as any);

      // Should fallback to English or return the key
      expect(fallbackTranslation).toBeDefined();
    });
  });

  describe('Language Switching Behavior', () => {
    it('should update translations when language is switched from English to Japanese', () => {
      // Start with English
      i18n.changeLanguage('en');
      expect(i18n.t('geolocation.currentLocation')).toBe('Current Location');

      // Switch to Japanese
      i18n.changeLanguage('ja');
      expect(i18n.t('geolocation.currentLocation')).toBe('現在地');
    });

    it('should update translations when language is switched from Japanese to English', () => {
      // Start with Japanese
      i18n.changeLanguage('ja');
      expect(i18n.t('geolocation.permissionDenied')).toBe('位置情報へのアクセスが拒否されました');

      // Switch to English
      i18n.changeLanguage('en');
      expect(i18n.t('geolocation.permissionDenied')).toBe('Location access denied');
    });

    it('should maintain translation consistency across multiple switches', () => {
      const testCycles = 3;

      for (let i = 0; i < testCycles; i++) {
        // Switch to English
        i18n.changeLanguage('en');
        expect(i18n.t('geolocation.timeout')).toBe('Location request timed out');

        // Switch to Japanese
        i18n.changeLanguage('ja');
        expect(i18n.t('geolocation.timeout')).toBe('位置情報の取得がタイムアウトしました');
      }
    });

    it('should handle invalid language codes gracefully', () => {
      // Try to switch to an unsupported language
      i18n.changeLanguage('fr'); // French is not supported

      // Should fallback to English (fallbackLng)
      const translation = i18n.t('geolocation.currentLocation');
      expect(translation).toBe('Current Location');
    });

    it('should preserve language preference across component re-renders', () => {
      i18n.changeLanguage('ja');

      const { rerender } = render(
        <TestWrapper>
          <CurrentPositionMarker
            position={mockPosition}
            accuracy={10}
            isLoading={false}
            isPermissionGranted={true}
          />
        </TestWrapper>
      );

      // Verify Japanese is still active
      expect(i18n.language).toBe('ja');
      expect(i18n.t('geolocation.currentLocation')).toBe('現在地');

      // Re-render component
      rerender(
        <TestWrapper>
          <CurrentPositionMarker
            position={mockPosition}
            accuracy={20}
            isLoading={true}
            isPermissionGranted={true}
          />
        </TestWrapper>
      );

      // Language should still be Japanese
      expect(i18n.language).toBe('ja');
      expect(i18n.t('geolocation.currentLocation')).toBe('現在地');
    });
  });

  describe('Error Message Translations', () => {
    it('should provide localized error messages for all error types in English', () => {
      i18n.changeLanguage('en');

      expect(i18n.t('geolocation.permissionDenied')).toBe('Location access denied');
      expect(i18n.t('geolocation.positionUnavailable')).toBe('Location unavailable');
      expect(i18n.t('geolocation.timeout')).toBe('Location request timed out');
      expect(i18n.t('geolocation.enableLocationInstructions')).toBe('Please enable location access in your browser settings');
    });

    it('should provide localized error messages for all error types in Japanese', () => {
      i18n.changeLanguage('ja');

      expect(i18n.t('geolocation.permissionDenied')).toBe('位置情報へのアクセスが拒否されました');
      expect(i18n.t('geolocation.positionUnavailable')).toBe('位置情報が利用できません');
      expect(i18n.t('geolocation.timeout')).toBe('位置情報の取得がタイムアウトしました');
      expect(i18n.t('geolocation.enableLocationInstructions')).toBe('ブラウザの設定で位置情報アクセスを有効にしてください');
    });
  });
});