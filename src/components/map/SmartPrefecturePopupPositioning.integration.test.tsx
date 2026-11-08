import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import JapanMap from './JapanMap';
import type { FeatureCollection, Point, MultiPolygon } from 'geojson';
import type { TrackProperties, PrefectureProperties } from '@/types/map';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

vi.mock('./BasemapTileLayer', () => ({
  default: ({ useJapaneseSource }: { useJapaneseSource: boolean }) =>
    React.createElement('div', {
      'data-testid': 'tile-layer',
      'data-use-japanese-source': String(useJapaneseSource),
    }),
}));

// Mock Leaflet and React Leaflet with enhanced smart positioning support
const mockFlyTo = vi.fn();
const mockGetZoom = vi.fn(() => 10);
const mockGetCenter = vi.fn(() => ({ lat: 35.6762, lng: 139.6503 }));
const mockGetBounds = vi.fn(() => ({
  contains: vi.fn((point) => {
    // Smart logic: if point is prefecture center, return false (not in viewport)
    // if point is click position, return true (in viewport)
    if (point && point.lat === 35.6762 && point.lng === 139.6503) {
      return false; // Prefecture center not in viewport
    }
    return true; // Click positions are in viewport
  }),
  getNorth: vi.fn(() => 36),
  getSouth: vi.fn(() => 35),
  getEast: vi.fn(() => 140),
  getWest: vi.fn(() => 139)
}));
const mockGetSize = vi.fn(() => ({ x: 800, y: 600 }));
const mockGetContainer = vi.fn(() => ({
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  getBoundingClientRect: vi.fn(() => ({
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600
  }))
}));
const mockAddControl = vi.fn();
const mockRemoveControl = vi.fn();

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
    SVG: {
      prototype: {
        options: { padding: 0.5 },
      },
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
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('data-testid', 'control-button');
        div.appendChild(button);
        return div;
      });
      onRemove = vi.fn();
      addTo = vi.fn();
      remove = vi.fn();
      updateState = vi.fn();
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
    latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
    latLngBounds: vi.fn((corner1: any, corner2: any) => ({
      contains: vi.fn(() => false),
      getNorth: vi.fn(() => Math.max(corner1.lat, corner2.lat)),
      getSouth: vi.fn(() => Math.min(corner1.lat, corner2.lat)),
      getEast: vi.fn(() => Math.max(corner1.lng, corner2.lng)),
      getWest: vi.fn(() => Math.min(corner1.lng, corner2.lng)),
    })),
  },
}));

// Mock react-leaflet components with enhanced event handling
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
    GeoJSON: ({ data, style, onEachFeature, ...props }: any) => {
      // Simulate GeoJSON layer with click handling
      React.useEffect(() => {
        if (onEachFeature && data?.features) {
          data.features.forEach((feature: any) => {
            const mockLayer = {
              on: vi.fn((events: any) => {
                // Store event handlers for later simulation
                if (events.click) {
                  (mockLayer as any)._clickHandler = events.click;
                }
                if (events.mouseover) {
                  (mockLayer as any)._mouseoverHandler = events.mouseover;
                }
                if (events.mouseout) {
                  (mockLayer as any)._mouseoutHandler = events.mouseout;
                }
              }),
              setStyle: vi.fn(),
              bringToFront: vi.fn(),
            };
            onEachFeature(feature, mockLayer);

            // Store layer reference for testing
            if (!(window as any)._testLayers) {
              (window as any)._testLayers = [];
            }
            (window as any)._testLayers.push({
              feature,
              layer: mockLayer,
              prefectureName: feature.properties.nam
            });
          });
        }
      }, [data, onEachFeature]);

      return (
        <div
          data-testid="geojson"
          data-features-count={data?.features?.length || 0}
          {...props}
        />
      );
    },
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
    Popup: ({ children, position, autoPan, className, ...props }: any) => (
      <div
        data-testid="popup"
        data-position={position?.join(',')}
        data-auto-pan={autoPan}
        className={className}
        {...props}
      >
        {children}
      </div>
    ),
    useMap: () => ({
      flyTo: mockFlyTo,
      getZoom: mockGetZoom,
      getCenter: mockGetCenter,
      getBounds: mockGetBounds,
      getSize: mockGetSize,
      getContainer: mockGetContainer,
      addControl: mockAddControl,
      removeControl: mockRemoveControl,
      on: vi.fn(),
      off: vi.fn(),
    }),
  };
});

// Mock child components to isolate integration testing
vi.mock('./TrackMarker', () => ({
  default: ({ coordinates, ...props }: any) => (
    <div data-testid="track-marker" data-coordinates={coordinates.join(',')} {...props} />
  ),
}));

vi.mock('./MapEventHandler', () => ({
  default: ({ onPopupClose, ...props }: any) => (
    <div data-testid="map-event-handler" {...props} />
  ),
}));

vi.mock('./CurrentPositionMarker', () => ({
  default: ({ position, accuracy, ...props }: any) => (
    <div
      data-testid="current-position-marker"
      data-position={position ? `${position.lat},${position.lng}` : 'null'}
      data-accuracy={accuracy}
      {...props}
    />
  ),
}));

vi.mock('./GPSControlButton', () => ({
  default: ({ onLocate, isLoading, isDisabled, ...props }: any) => (
    <div
      data-testid="gps-control-button"
      data-loading={isLoading}
      data-disabled={isDisabled}
      onClick={onLocate}
      {...props}
    />
  ),
}));

vi.mock('./ReturnToJapanButton', () => ({
  default: ({ onReturnToJapan, isAnimating, ...props }: any) => (
    <div
      data-testid="return-to-japan-button"
      data-animating={isAnimating}
      onClick={onReturnToJapan}
      {...props}
    />
  ),
}));

vi.mock('./MapStyles', () => ({
  default: () => <div data-testid="map-styles" />,
}));

// Mock geolocation hook
const mockUseGeolocation = vi.fn();
vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => mockUseGeolocation(),
}));

// Mock utility functions
vi.mock('@/utils/mapStyles', () => ({
  getFeatureStyle: vi.fn(() => ({})),
  getHoverStyle: vi.fn(() => ({})),
}));

vi.mock('@/utils/groupTrackFeatures', () => ({
  groupMapByNameAndCoordinates: vi.fn(() => ({})),
  getGroupingKeyForFeature: vi.fn(() => 'test-key'),
}));

describe.skip('Smart Prefecture Popup Positioning Integration Tests (MapLibre)', () => {
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
          center: [35.6762, 139.6503],
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[[[139.0, 35.0], [140.0, 35.0], [140.0, 36.0], [139.0, 36.0], [139.0, 35.0]]]],
        },
      },
      {
        type: 'Feature',
        properties: {
          nam: 'Osaka',
          nam_ja: '大阪府',
          id: 27,
          center: [34.6937, 135.5023],
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[[[135.0, 34.0], [136.0, 34.0], [136.0, 35.0], [135.0, 35.0], [135.0, 34.0]]]],
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
          prefecture: 'Tokyo',
          icon: 'test-icon.png',
          title: 'Test Location',
          layerName: 'Test Layer',
          name: 'Tokyo Station',
          nameJp: '東京駅',
          images: ['image1.jpg'],
          links: ['https://example.com'],
        },
        geometry: {
          type: 'Point',
          coordinates: [139.7673, 35.6812],
        },
      },
      {
        type: 'Feature',
        properties: {
          prefecture: 'Osaka',
          icon: 'test-icon2.png',
          title: 'Test Location 2',
          layerName: 'Test Layer 2',
          name: 'Osaka Castle',
          nameJp: '大阪城',
          images: ['image2.jpg'],
          links: ['https://example2.com'],
        },
        geometry: {
          type: 'Point',
          coordinates: [135.5258, 34.6873],
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Clear test layers
    (window as any)._testLayers = [];

    // Configure geolocation mock
    mockUseGeolocation.mockReturnValue({
      position: null,
      error: null,
      isLoading: false,
      isPermissionGranted: false,
      requestLocation: vi.fn(),
      watchPosition: vi.fn(),
      stopWatching: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    (window as any)._testLayers = [];
  });

  /**
   * Integration Test: End-to-end smart positioning workflow
   * Tests the complete flow from prefecture click to popup positioning
   * Validates: Requirements 6.1, 6.4, 6.5
   */
  it('should handle complete smart positioning workflow from click to popup display', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // Verify map container is rendered
    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toBeInTheDocument();

    // Verify GeoJSON layer is rendered with features
    const geoJsonLayer = container.querySelector('[data-testid="geojson"]');
    expect(geoJsonLayer).toBeInTheDocument();
    expect(geoJsonLayer).toHaveAttribute('data-features-count', '2');

    // Wait for layers to be set up
    await waitFor(() => {
      expect((window as any)._testLayers).toHaveLength(2);
    });

    // Configure viewport bounds to simulate prefecture center not visible
    mockGetBounds.mockReturnValue({
      contains: vi.fn(() => false), // Prefecture center not in viewport
      getNorth: vi.fn(() => 36),
      getSouth: vi.fn(() => 35),
      getEast: vi.fn(() => 140),
      getWest: vi.fn(() => 139)
    });

    // Simulate clicking on Tokyo prefecture
    const tokyoLayer = (window as any)._testLayers.find(
      (layer: any) => layer.prefectureName === 'Tokyo'
    );
    expect(tokyoLayer).toBeDefined();

    // Simulate click event with coordinates
    const mockClickEvent = {
      latlng: { lat: 35.7, lng: 139.7 }, // Click position different from center
      target: {
        _map: {
          getBounds: mockGetBounds,
          getZoom: mockGetZoom,
          getSize: mockGetSize,
          getCenter: mockGetCenter,
          getContainer: mockGetContainer,
        }
      }
    };

    act(() => {
      tokyoLayer.layer._clickHandler(mockClickEvent);
    });

    // Wait for popup to appear
    await waitFor(() => {
      const popup = container.querySelector('[data-testid="popup"]');
      expect(popup).toBeInTheDocument();
    });

    // Verify popup is positioned at click location (not prefecture center)
    const popup = container.querySelector('[data-testid="popup"]');
    expect(popup).toHaveAttribute('data-position', '35.7,139.7');

    // Verify popup content shows Tokyo
    expect(popup).toHaveTextContent('Tokyo');
    // Note: Track content depends on the mock data provided
  });

  /**
   * Integration Test: Fallback to prefecture center when center is visible
   * Tests smart positioning logic when prefecture center is in viewport
   * Validates: Requirements 6.1, 6.4
   */
  it('should use prefecture center when center is visible in viewport', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // Wait for layers to be set up
    await waitFor(() => {
      expect((window as any)._testLayers).toHaveLength(2);
    });

    // Configure viewport bounds to simulate prefecture center IS visible
    mockGetBounds.mockReturnValue({
      contains: vi.fn((point) => {
        // When prefecture center is visible, return true for prefecture center
        if (point && point.lat === 34.6937 && point.lng === 135.5023) {
          return true; // Osaka prefecture center IS in viewport
        }
        return true; // All positions are in viewport for this test
      }),
      getNorth: vi.fn(() => 36),
      getSouth: vi.fn(() => 35),
      getEast: vi.fn(() => 140),
      getWest: vi.fn(() => 139)
    });

    // Simulate clicking on Osaka prefecture
    const osakaLayer = (window as any)._testLayers.find(
      (layer: any) => layer.prefectureName === 'Osaka'
    );
    expect(osakaLayer).toBeDefined();

    // Simulate click event with coordinates different from center
    const mockClickEvent = {
      latlng: { lat: 34.8, lng: 135.8 }, // Click position different from center
      target: {
        _map: {
          getBounds: mockGetBounds,
          getZoom: mockGetZoom,
          getSize: mockGetSize,
          getCenter: mockGetCenter,
          getContainer: mockGetContainer,
        }
      }
    };

    act(() => {
      osakaLayer.layer._clickHandler(mockClickEvent);
    });

    // Wait for popup to appear
    await waitFor(() => {
      const popup = container.querySelector('[data-testid="popup"]');
      expect(popup).toBeInTheDocument();
    });

    // Verify popup is positioned at prefecture center (not click location)
    const popup = container.querySelector('[data-testid="popup"]');
    expect(popup).toHaveAttribute('data-position', '34.6937,135.5023');

    // Verify popup content shows Osaka
    expect(popup).toHaveTextContent('Osaka');
    // Note: Track content depends on the mock data provided
  });

  /**
   * Integration Test: Error handling and fallback behavior
   * Tests system behavior when positioning calculations fail
   * Validates: Requirements 6.5, 8.1, 8.2, 8.3
   */
  it('should handle positioning errors gracefully with fallback behavior', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // Wait for layers to be set up
    await waitFor(() => {
      expect((window as any)._testLayers).toHaveLength(2);
    });

    // Configure mock to throw error during viewport calculation
    mockGetBounds.mockImplementation(() => {
      throw new Error('Viewport calculation failed');
    });

    // Simulate clicking on Tokyo prefecture
    const tokyoLayer = (window as any)._testLayers.find(
      (layer: any) => layer.prefectureName === 'Tokyo'
    );

    // Simulate click event
    const mockClickEvent = {
      latlng: { lat: 35.7, lng: 139.7 },
      target: {
        _map: {
          getBounds: mockGetBounds,
          getZoom: mockGetZoom,
          getSize: mockGetSize,
        }
      }
    };

    act(() => {
      tokyoLayer.layer._clickHandler(mockClickEvent);
    });

    // Wait for popup to appear (should still work with fallback)
    await waitFor(() => {
      const popup = container.querySelector('[data-testid="popup"]');
      expect(popup).toBeInTheDocument();
    });

    // Verify popup still works with smart positioning (using click position as fallback)
    const popup = container.querySelector('[data-testid="popup"]');
    expect(popup).toHaveAttribute('data-position', '35.7,139.7');

    // Verify popup content is still displayed correctly
    expect(popup).toHaveTextContent('Tokyo');
  });

  /**
   * Integration Test: Backward compatibility with existing popup system
   * Tests that smart positioning doesn't break existing functionality
   * Validates: Requirements 6.1, 6.4
   */
  it('should maintain backward compatibility with existing popup functionality', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // Verify all existing components are still rendered
    expect(container.querySelector('[data-testid="map-container"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="tile-layer"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="geojson"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="zoom-control"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="gps-control-button"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="return-to-japan-button"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="current-position-marker"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="map-event-handler"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="map-styles"]')).toBeInTheDocument();

    // Verify track markers are rendered
    const trackMarkers = container.querySelectorAll('[data-testid="track-marker"]');
    expect(trackMarkers).toHaveLength(2);

    // Verify existing functionality still works
    const gpsButton = container.querySelector('[data-testid="gps-control-button"]');
    expect(gpsButton).toBeInTheDocument();
    expect(gpsButton).toHaveAttribute('data-disabled', 'false');

    const returnButton = container.querySelector('[data-testid="return-to-japan-button"]');
    expect(returnButton).toBeInTheDocument();
    expect(returnButton).toHaveAttribute('data-animating', 'false');
  });

  /**
   * Integration Test: Performance requirements validation
   * Tests that smart positioning meets performance requirements
   * Validates: Requirements 5.1, 5.2, 5.4
   */
  it('should meet performance requirements for positioning calculations', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // Wait for layers to be set up
    await waitFor(() => {
      expect((window as any)._testLayers).toHaveLength(2);
    });

    const tokyoLayer = (window as any)._testLayers.find(
      (layer: any) => layer.prefectureName === 'Tokyo'
    );

    // Measure positioning calculation time
    const startTime = performance.now();

    const mockClickEvent = {
      latlng: { lat: 35.7, lng: 139.7 },
      target: {
        _map: {
          getBounds: mockGetBounds,
          getZoom: mockGetZoom,
          getSize: mockGetSize,
          getCenter: mockGetCenter,
          getContainer: mockGetContainer,
        }
      }
    };

    act(() => {
      tokyoLayer.layer._clickHandler(mockClickEvent);
    });

    const endTime = performance.now();
    const calculationTime = endTime - startTime;

    // Verify positioning calculation completes within 50ms (requirement 5.1)
    expect(calculationTime).toBeLessThan(50);

    // Wait for popup to appear and verify no noticeable delay
    await waitFor(() => {
      const popup = container.querySelector('[data-testid="popup"]');
      expect(popup).toBeInTheDocument();
    }, { timeout: 100 }); // Should appear quickly

    // Verify popup is positioned correctly
    const popup = container.querySelector('[data-testid="popup"]');
    expect(popup).toHaveAttribute('data-position', '35.7,139.7');
  });

  /**
   * Integration Test: Multiple rapid clicks handling
   * Tests system behavior with rapid user interactions
   * Validates: Requirements 7.4, 2.5
   */
  it('should handle multiple rapid clicks without conflicts', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // Wait for layers to be set up
    await waitFor(() => {
      expect((window as any)._testLayers).toHaveLength(2);
    });

    const tokyoLayer = (window as any)._testLayers.find(
      (layer: any) => layer.prefectureName === 'Tokyo'
    );

    // Simulate rapid clicks
    const clickEvents = [
      { latlng: { lat: 35.7, lng: 139.7 } },
      { latlng: { lat: 35.71, lng: 139.71 } },
      { latlng: { lat: 35.72, lng: 139.72 } },
    ];

    clickEvents.forEach((clickEvent, _index) => {
      const mockEvent = {
        ...clickEvent,
        target: {
          _map: {
            getBounds: mockGetBounds,
            getZoom: mockGetZoom,
            getSize: mockGetSize,
            getCenter: mockGetCenter,
            getContainer: mockGetContainer,
          }
        }
      };

      act(() => {
        tokyoLayer.layer._clickHandler(mockEvent);
      });
    });

    // Wait for final popup state
    await waitFor(() => {
      const popup = container.querySelector('[data-testid="popup"]');
      expect(popup).toBeInTheDocument();
    });

    // Verify system handled rapid clicks gracefully
    const popup = container.querySelector('[data-testid="popup"]');
    expect(popup).toBeInTheDocument();
    expect(popup).toHaveTextContent('Tokyo');

    // Verify position is one of the clicked positions (system should handle conflicts)
    const position = popup?.getAttribute('data-position');
    const validPositions = ['35.7,139.7', '35.71,139.71', '35.72,139.72'];
    expect(validPositions).toContain(position);
  });

  /**
   * Integration Test: Language switching with smart positioning
   * Tests internationalization compatibility with smart positioning
   * Validates: Requirements 6.2, 6.4
   */
  it('should maintain smart positioning functionality across language changes', async () => {
    const { container, rerender } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // Wait for layers to be set up
    await waitFor(() => {
      expect((window as any)._testLayers).toHaveLength(2);
    });

    // Switch to Japanese
    act(() => {
      i18n.changeLanguage('ja');
    });

    // Re-render with language change
    rerender(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // Simulate click after language change
    const tokyoLayer = (window as any)._testLayers.find(
      (layer: any) => layer.prefectureName === 'Tokyo'
    );

    const mockClickEvent = {
      latlng: { lat: 35.7, lng: 139.7 },
      target: {
        _map: {
          getBounds: mockGetBounds,
          getZoom: mockGetZoom,
          getSize: mockGetSize,
          getCenter: mockGetCenter,
          getContainer: mockGetContainer,
        }
      }
    };

    act(() => {
      tokyoLayer.layer._clickHandler(mockClickEvent);
    });

    // Wait for popup to appear
    await waitFor(() => {
      const popup = container.querySelector('[data-testid="popup"]');
      expect(popup).toBeInTheDocument();
    });

    // Verify smart positioning still works
    const popup = container.querySelector('[data-testid="popup"]');
    expect(popup).toHaveAttribute('data-position', '35.7,139.7');

    // Verify Japanese content is displayed
    expect(popup).toHaveTextContent('東京都');
    // Note: Track content depends on the mock data provided

    // Switch back to English
    act(() => {
      i18n.changeLanguage('en');
    });

    // Verify positioning continues to work
    expect(popup).toHaveAttribute('data-position', '35.7,139.7');
  });
});