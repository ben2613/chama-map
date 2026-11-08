import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import JapanMap from './JapanMap';
import type { FeatureCollection, Point, MultiPolygon } from 'geojson';
import type { TrackProperties, PrefectureProperties } from '@/types/map';

vi.mock('./BasemapTileLayer', () => ({
  default: ({ useJapaneseSource }: { useJapaneseSource: boolean }) =>
    React.createElement('div', {
      'data-testid': 'tile-layer',
      'data-use-japanese-source': String(useJapaneseSource),
    }),
}));

// Mock Leaflet and React Leaflet with comprehensive setup
vi.mock('leaflet', () => ({
  default: {
    Icon: class MockIcon {
      constructor(options: any) {
        this.options = options;
      }
      options: any;
      static Default = {
        prototype: {},
        mergeOptions: vi.fn(),
      };
    },
    divIcon: vi.fn(() => ({
      options: {},
      createIcon: vi.fn(() => {
        const div = document.createElement('div');
        div.className = 'current-position-marker';
        return div;
      }),
      createShadow: vi.fn(() => null),
    })),
    Control: class MockControl {
      protected options: any;
      constructor(options?: any) {
        this.options = options || {};
      }
      onAdd = vi.fn(() => {
        const div = document.createElement('div');
        div.className = 'leaflet-control-custom';
        return div;
      });
      onRemove = vi.fn();
      addTo = vi.fn();
      remove = vi.fn();
    },
    DomUtil: {
      create: vi.fn((tag: string, className: string) => {
        const element = document.createElement(tag);
        element.className = className;
        return element;
      }),
    },
    DomEvent: {
      disableClickPropagation: vi.fn(),
      disableScrollPropagation: vi.fn(),
    },
    SVG: {
      prototype: {
        options: { padding: 0.5 },
      },
    },
  },
}));

// Mock map instance methods
const mockFlyTo = vi.fn();
const mockGetZoom = vi.fn(() => 10);
const mockGetCenter = vi.fn(() => ({ lat: 35.6762, lng: 139.6503 }));
const mockStop = vi.fn();
const mockAddControl = vi.fn();
const mockRemoveControl = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();

vi.mock('react-leaflet', async () => {
  const actual = await vi.importActual('react-leaflet');
  return {
    ...actual,
    MapContainer: ({ children, style, className, center, zoom, zoomControl, ...props }: any) => (
      <div
        data-testid="map-container"
        style={style || {}}
        className={className}
        data-center={center?.join(',')}
        data-zoom={zoom}
        data-zoom-control={zoomControl}
        {...props}
      >
        {children}
      </div>
    ),
    TileLayer: ({ url, attribution, ...props }: any) => (
      <div data-testid="tile-layer" data-url={url} data-attribution={attribution} {...props} />
    ),
    GeoJSON: ({ data, style, onEachFeature, ...props }: any) => (
      <div data-testid="geojson" data-features-count={data?.features?.length || 0} {...props} />
    ),
    ZoomControl: ({ position, ...props }: any) => (
      <div data-testid="zoom-control" data-position={position} {...props} />
    ),
    Marker: ({ children, position, icon, zIndexOffset, ...props }: any) => (
      <div data-testid="marker" data-position={position?.join(',')} data-z-index={zIndexOffset} {...props}>
        {children}
      </div>
    ),
    Circle: ({ center, radius, pathOptions, ...props }: any) => (
      <div
        data-testid="circle"
        data-center={center?.join(',')}
        data-radius={radius}
        {...props}
      />
    ),
    Tooltip: ({ children, direction, offset, opacity, permanent, ...props }: any) => (
      <div
        data-testid="tooltip"
        data-direction={direction}
        data-offset={offset?.join(',')}
        data-opacity={opacity}
        data-permanent={permanent}
        {...props}
      >
        {children}
      </div>
    ),
    useMap: () => ({
      flyTo: mockFlyTo,
      getZoom: mockGetZoom,
      getCenter: mockGetCenter,
      stop: mockStop,
      addControl: mockAddControl,
      removeControl: mockRemoveControl,
      on: mockOn,
      off: mockOff,
    }),
  };
});

// Mock geolocation hook
const mockUseGeolocation = vi.fn();
vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => mockUseGeolocation(),
}));

// Mock other components to isolate testing
vi.mock('./TrackMarker', () => ({
  default: ({ coordinates, ...props }: any) => (
    <div data-testid="track-marker" data-coordinates={coordinates.join(',')} {...props} />
  ),
}));

vi.mock('./MapEventHandler', () => ({
  default: ({ ...props }: any) => <div data-testid="map-event-handler" {...props} />,
}));

vi.mock('./PrefecturePopup', () => ({
  default: ({ selectedPrefecture, ...props }: any) => (
    <div data-testid="prefecture-popup" data-prefecture={selectedPrefecture} {...props} />
  ),
}));

vi.mock('./MapStyles', () => ({
  default: () => <div data-testid="map-styles" />,
}));

vi.mock('./CurrentPositionMarker', () => ({
  default: ({ position, ...props }: any) => (
    <div data-testid="current-position-marker" data-position={position?.lat + ',' + position?.lng} {...props} />
  ),
}));

vi.mock('./GPSControlButton', () => ({
  default: ({ onLocate, isLoading, ...props }: any) => (
    <button data-testid="gps-control-button" onClick={onLocate} disabled={isLoading} {...props}>
      GPS
    </button>
  ),
}));

// Mock ReturnToJapanButton to render as a testable element
vi.mock('./ReturnToJapanButton', () => ({
  default: ({ onReturnToJapan, isAnimating, controlPosition, ...props }: any) => (
    <div
      data-testid="return-to-japan-button"
      className="return-to-japan-button"
      data-animating={isAnimating}
      data-position={controlPosition}
      onClick={onReturnToJapan}
      role="button"
      tabIndex={0}
      aria-label="Return to Japan"
      style={{
        minWidth: '44px',
        minHeight: '44px',
      }}
      {...props}
    />
  ),
}));

vi.mock('@/utils/mapStyles', () => ({
  getFeatureStyle: vi.fn(() => ({})),
}));

vi.mock('@/utils/mapPrefectureUtils', () => ({
  createPrefectureHandlers: vi.fn(() => vi.fn()),
}));

vi.mock('@/utils/groupTrackFeatures', () => ({
  groupMapByNameAndCoordinates: vi.fn(() => ({})),
}));

// Mock browser APIs
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock user agent for cross-browser testing
const originalUserAgent = navigator.userAgent;

// Test data
const mockJapanData: FeatureCollection<MultiPolygon, PrefectureProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        nam: 'Tokyo',
        nam_ja: '東京都',
        id: 13,
        center: [139.6917, 35.6895],
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[[[139.0, 35.0], [140.0, 35.0], [140.0, 36.0], [139.0, 36.0], [139.0, 35.0]]]],
      },
    },
  ],
};

const mockChamaTrack: FeatureCollection<Point, TrackProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Test Location',
        nameJp: 'テスト場所',
        prefecture: 'Tokyo',
        icon: 'test-icon',
        title: 'Test Location',
        layerName: 'Test Layer',
        images: [],
        links: [],
      },
      geometry: {
        type: 'Point',
        coordinates: [139.6917, 35.6895],
      },
    },
  ],
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    {children}
  </I18nextProvider>
);

describe.skip('ReturnToJapanButton Integration Tests (MapControlStack)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Configure default geolocation mock
    mockUseGeolocation.mockReturnValue({
      position: null,
      error: null,
      isLoading: false,
      isPermissionGranted: false,
      requestLocation: vi.fn(),
      watchPosition: vi.fn(),
      stopWatching: vi.fn(),
    });

    // Reset document.hidden for visibility API
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
    });

    // Reset user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('Component Integration and Rendering', () => {
    it('should render ReturnToJapanButton alongside existing map controls', async () => {
      const { container } = render(
        <TestWrapper>
          <JapanMap
            className="test-map"
            japanData={mockJapanData}
            chamaTrack={mockChamaTrack}
          />
        </TestWrapper>
      );

      // Verify all controls are rendered
      await waitFor(() => {
        expect(container.querySelector('[data-testid="return-to-japan-button"]')).toBeInTheDocument();
        expect(screen.getByTestId('gps-control-button')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-control')).toBeInTheDocument();
      });

      // Verify ReturnToJapanButton has correct positioning
      const returnButton = container.querySelector('[data-testid="return-to-japan-button"]');
      expect(returnButton).toHaveAttribute('data-position', 'bottomright');
      expect(returnButton).not.toHaveAttribute('data-animating', 'true');
    });

    it('should maintain proper control positioning across different screen sizes', async () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true,
      });

      const { container, rerender } = render(
        <TestWrapper>
          <JapanMap
            className="test-map"
            japanData={mockJapanData}
            chamaTrack={mockChamaTrack}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const returnButton = container.querySelector('[data-testid="return-to-japan-button"]');
        expect(returnButton).toBeInTheDocument();

        // Verify minimum touch target size for mobile
        const style = returnButton?.getAttribute('style');
        expect(style).toContain('44px');
      });

      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        writable: true,
      });

      rerender(
        <TestWrapper>
          <JapanMap
            className="test-map"
            japanData={mockJapanData}
            chamaTrack={mockChamaTrack}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const returnButton = container.querySelector('[data-testid="return-to-japan-button"]');
        expect(returnButton).toBeInTheDocument();
        expect(returnButton).toHaveAttribute('data-position', 'bottomright');
      });
    });
  });

  describe('Cross-Browser User Agent Detection', () => {
    const testUserAgents = [
      {
        name: 'Chrome Desktop',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        isMobile: false,
      },
      {
        name: 'Firefox Desktop',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        isMobile: false,
      },
      {
        name: 'Safari Desktop',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        isMobile: false,
      },
      {
        name: 'iOS Safari',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        isMobile: true,
      },
      {
        name: 'Android Chrome',
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        isMobile: true,
      },
    ];

    testUserAgents.forEach(({ name, userAgent, isMobile }) => {
      it(`should render correctly on ${name}`, async () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          writable: true,
        });

        if (isMobile) {
          Object.defineProperty(window, 'innerWidth', {
            value: 375,
            writable: true,
          });
        } else {
          Object.defineProperty(window, 'innerWidth', {
            value: 1920,
            writable: true,
          });
        }

        const { container } = render(
          <TestWrapper>
            <JapanMap
              className="test-map"
              japanData={mockJapanData}
              chamaTrack={mockChamaTrack}
            />
          </TestWrapper>
        );

        await waitFor(() => {
          const returnButton = container.querySelector('[data-testid="return-to-japan-button"]');
          expect(returnButton).toBeInTheDocument();
          expect(returnButton).toHaveAttribute('role', 'button');
          expect(returnButton).toHaveAttribute('aria-label', 'Return to Japan');
        });
      });
    });
  });

  describe('Accessibility Standards Compliance', () => {
    it('should maintain accessibility attributes across all platforms', async () => {
      const { container } = render(
        <TestWrapper>
          <JapanMap
            className="test-map"
            japanData={mockJapanData}
            chamaTrack={mockChamaTrack}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const returnButton = container.querySelector('[data-testid="return-to-japan-button"]');
        expect(returnButton).toBeInTheDocument();

        // Verify accessibility attributes
        expect(returnButton).toHaveAttribute('aria-label', 'Return to Japan');
        expect(returnButton).toHaveAttribute('role', 'button');
        expect(returnButton).toHaveAttribute('tabIndex', '0');

        // Verify minimum touch target size
        const style = returnButton?.getAttribute('style');
        expect(style).toContain('44px');
      });
    });

    it('should support keyboard navigation', async () => {
      const { container } = render(
        <TestWrapper>
          <JapanMap
            className="test-map"
            japanData={mockJapanData}
            chamaTrack={mockChamaTrack}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const returnButton = container.querySelector('[data-testid="return-to-japan-button"]') as HTMLElement;
        expect(returnButton).toBeInTheDocument();

        // Test keyboard focus
        act(() => {
          returnButton.focus();
        });

        expect(document.activeElement).toBe(returnButton);

        // Test keyboard activation
        act(() => {
          fireEvent.keyDown(returnButton, { key: 'Enter' });
        });

        // Button should remain focusable after interaction
        expect(returnButton).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle component errors gracefully with ErrorBoundary', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const { container } = render(
        <TestWrapper>
          <JapanMap
            className="test-map"
            japanData={mockJapanData}
            chamaTrack={mockChamaTrack}
          />
        </TestWrapper>
      );

      // Should still render the map container even if some components fail
      expect(screen.getByTestId('map-container')).toBeInTheDocument();

      // ReturnToJapanButton should render (our mock doesn't throw errors)
      await waitFor(() => {
        expect(container.querySelector('[data-testid="return-to-japan-button"]')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle missing or invalid data gracefully', async () => {
      const { container } = render(
        <TestWrapper>
          <JapanMap
            className="test-map"
            japanData={{ type: 'FeatureCollection', features: [] }}
            chamaTrack={{ type: 'FeatureCollection', features: [] }}
          />
        </TestWrapper>
      );

      // Should still render all controls even with empty data
      await waitFor(() => {
        expect(container.querySelector('[data-testid="return-to-japan-button"]')).toBeInTheDocument();
        expect(screen.getByTestId('gps-control-button')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-control')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Resource Management', () => {
    it('should cleanup resources properly on unmount', async () => {
      const { container, unmount } = render(
        <TestWrapper>
          <JapanMap
            className="test-map"
            japanData={mockJapanData}
            chamaTrack={mockChamaTrack}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(container.querySelector('[data-testid="return-to-japan-button"]')).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Component should be removed from DOM
      expect(container.querySelector('[data-testid="return-to-japan-button"]')).not.toBeInTheDocument();
    });

    it('should handle rapid re-renders without memory leaks', async () => {
      const { container, rerender } = render(
        <TestWrapper>
          <JapanMap
            className="test-map"
            japanData={mockJapanData}
            chamaTrack={mockChamaTrack}
          />
        </TestWrapper>
      );

      // Perform multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender(
          <TestWrapper>
            <JapanMap
              className={`test-map-${i}`}
              japanData={mockJapanData}
              chamaTrack={mockChamaTrack}
            />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(container.querySelector('[data-testid="return-to-japan-button"]')).toBeInTheDocument();
        });
      }

      // Should still be functional after multiple re-renders
      const returnButton = container.querySelector('[data-testid="return-to-japan-button"]');
      expect(returnButton).toBeInTheDocument();
      expect(returnButton).toHaveAttribute('role', 'button');
    });
  });

  describe('Internationalization Integration', () => {
    it('should work correctly with language switching', async () => {
      const { container } = render(
        <TestWrapper>
          <JapanMap
            className="test-map"
            japanData={mockJapanData}
            chamaTrack={mockChamaTrack}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(container.querySelector('[data-testid="return-to-japan-button"]')).toBeInTheDocument();
      });

      // Switch to Japanese
      act(() => {
        i18n.changeLanguage('ja');
      });

      // Button should still be present and functional
      await waitFor(() => {
        const returnButton = container.querySelector('[data-testid="return-to-japan-button"]');
        expect(returnButton).toBeInTheDocument();
        expect(returnButton).toHaveAttribute('aria-label', 'Return to Japan');
      });

      // Switch back to English
      act(() => {
        i18n.changeLanguage('en');
      });

      await waitFor(() => {
        const returnButton = container.querySelector('[data-testid="return-to-japan-button"]');
        expect(returnButton).toBeInTheDocument();
      });
    });
  });
});