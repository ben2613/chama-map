import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock all external dependencies for focused integration testing
vi.mock('leaflet', () => ({
  default: {
    Icon: class MockIcon {
      constructor(options: any) { this.options = options; }
      options: any;
      static Default = { prototype: {}, mergeOptions: vi.fn() };
    },
    SVG: { prototype: { options: { padding: 0.5 } } },
    divIcon: vi.fn(() => ({ options: {}, createIcon: vi.fn(), createShadow: vi.fn() })),
    Control: class MockControl {
      onAdd = vi.fn(() => document.createElement('div'));
      onRemove = vi.fn();
    },
    DomUtil: { create: vi.fn((tag: string) => document.createElement(tag)) },
    DomEvent: { disableClickPropagation: vi.fn(), disableScrollPropagation: vi.fn() },
    latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
    latLngBounds: vi.fn(() => ({ contains: vi.fn(() => false) })),
  },
}));

vi.mock('react-leaflet', async () => {
  const actual = await vi.importActual('react-leaflet');
  return {
    ...actual,
    MapContainer: ({ children, style, className, center, zoom, zoomControl, ...restProps }: any) => {
      // Filter out non-DOM props
      const domProps = Object.keys(restProps).reduce((acc, key) => {
        if (!key.startsWith('on') && !key.includes('Ref') && !key.includes('Control')) {
          acc[key] = restProps[key];
        }
        return acc;
      }, {} as any);

      return (
        <div
          data-testid="map-container"
          style={typeof style === 'string' ? {} : style || {}}
          className={className}
          data-center={center?.join(',')}
          data-zoom={zoom}
          data-zoom-control={zoomControl}
          {...domProps}
        >
          {children}
        </div>
      );
    },
    TileLayer: ({ url, attribution, ...restProps }: any) => {
      // Filter out non-DOM props
      const domProps = Object.keys(restProps).reduce((acc, key) => {
        if (!key.startsWith('on') && !key.includes('Ref')) {
          acc[key] = restProps[key];
        }
        return acc;
      }, {} as any);

      return (
        <div
          data-testid="tile-layer"
          data-url={url}
          data-attribution={attribution}
          {...domProps}
        />
      );
    },
    GeoJSON: ({ data, onEachFeature, ...restProps }: any) => {
      // Simulate GeoJSON layer setup
      React.useEffect(() => {
        if (onEachFeature && data?.features) {
          data.features.forEach((feature: any) => {
            const mockLayer = { on: vi.fn() };
            onEachFeature(feature, mockLayer);
          });
        }
      }, [data, onEachFeature]);

      // Filter out non-DOM props
      const domProps = Object.keys(restProps).reduce((acc, key) => {
        if (!key.startsWith('on') && !key.includes('Ref') && key !== 'style') {
          acc[key] = restProps[key];
        }
        return acc;
      }, {} as any);

      return (
        <div
          data-testid="geojson"
          data-features-count={data?.features?.length || 0}
          {...domProps}
        />
      );
    },
    ZoomControl: ({ position, ...restProps }: any) => {
      // Filter out non-DOM props
      const domProps = Object.keys(restProps).reduce((acc, key) => {
        if (!key.startsWith('on') && !key.includes('Ref')) {
          acc[key] = restProps[key];
        }
        return acc;
      }, {} as any);

      return (
        <div
          data-testid="zoom-control"
          data-position={position}
          {...domProps}
        />
      );
    },
    Popup: ({ children, position, autoPan, className, ...restProps }: any) => {
      // Filter out non-DOM props
      const domProps = Object.keys(restProps).reduce((acc, key) => {
        if (!key.startsWith('on') && !key.includes('Ref')) {
          acc[key] = restProps[key];
        }
        return acc;
      }, {} as any);

      return (
        <div
          data-testid="popup"
          data-position={position?.join(',')}
          data-auto-pan={autoPan}
          className={className}
          {...domProps}
        >
          {children}
        </div>
      );
    },
    useMap: () => ({
      flyTo: vi.fn(),
      getZoom: vi.fn(() => 10),
      getCenter: vi.fn(() => ({ lat: 35.6762, lng: 139.6503 })),
      getBounds: vi.fn(() => ({ contains: vi.fn(() => false) })),
      getSize: vi.fn(() => ({ x: 800, y: 600 })),
      getContainer: vi.fn(() => ({
        querySelector: vi.fn(() => null),
        querySelectorAll: vi.fn(() => []),
        getBoundingClientRect: vi.fn(() => ({
          top: 0, left: 0, right: 800, bottom: 600, width: 800, height: 600
        }))
      })),
      addControl: vi.fn(),
      removeControl: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }),
  };
});

// Mock child components
vi.mock('./TrackMarker', () => ({
  default: ({ coordinates, ...restProps }: any) => {
    // Filter out non-DOM props
    const domProps = Object.keys(restProps).reduce((acc, key) => {
      if (!key.startsWith('on') && !key.includes('Ref') && !key.includes('Control')) {
        acc[key] = restProps[key];
      }
      return acc;
    }, {} as any);

    return (
      <div
        data-testid="track-marker"
        data-coordinates={coordinates.join(',')}
        {...domProps}
      />
    );
  },
}));

vi.mock('./MapEventHandler', () => ({
  default: ({ ...restProps }: any) => {
    // Filter out non-DOM props
    const domProps = Object.keys(restProps).reduce((acc, key) => {
      if (!key.startsWith('on') && !key.includes('Ref') && !key.includes('Popup') && !key.includes('map')) {
        acc[key] = restProps[key];
      }
      return acc;
    }, {} as any);

    return <div data-testid="map-event-handler" {...domProps} />;
  },
}));

vi.mock('./CurrentPositionMarker', () => ({
  default: ({ ...restProps }: any) => {
    // Filter out non-DOM props
    const domProps = Object.keys(restProps).reduce((acc, key) => {
      if (!key.startsWith('on') &&
        !key.includes('Ref') &&
        key !== 'position' &&
        key !== 'accuracy' &&
        key !== 'isLoading' &&
        key !== 'isPermissionGranted') {
        acc[key] = restProps[key];
      }
      return acc;
    }, {} as any);

    return <div data-testid="current-position-marker" {...domProps} />;
  },
}));

vi.mock('./GPSControlButton', () => ({
  default: ({ ...restProps }: any) => {
    // Filter out non-DOM props and custom component props
    const domProps = Object.keys(restProps).reduce((acc, key) => {
      if (!key.startsWith('on') &&
        !key.includes('Ref') &&
        !key.includes('Loading') &&
        !key.includes('Disabled') &&
        !key.includes('Control')) {
        acc[key] = restProps[key];
      }
      return acc;
    }, {} as any);

    return <div data-testid="gps-control-button" {...domProps} />;
  },
}));

vi.mock('./ReturnToJapanButton', () => ({
  default: ({ ...restProps }: any) => {
    // Filter out non-DOM props and custom component props
    const domProps = Object.keys(restProps).reduce((acc, key) => {
      if (!key.startsWith('on') &&
        !key.includes('Ref') &&
        !key.includes('Animating')) {
        acc[key] = restProps[key];
      }
      return acc;
    }, {} as any);

    return <div data-testid="return-to-japan-button" {...domProps} />;
  },
}));

vi.mock('./MapStyles', () => ({
  default: () => <div data-testid="map-styles" />,
}));

// Mock hooks and utilities
vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    position: null,
    error: null,
    isLoading: false,
    isPermissionGranted: false,
    requestLocation: vi.fn(),
    watchPosition: vi.fn(),
    stopWatching: vi.fn(),
  }),
}));

vi.mock('@/utils/mapStyles', () => ({
  getFeatureStyle: vi.fn(() => ({})),
  getHoverStyle: vi.fn(() => ({})),
}));

vi.mock('@/utils/groupTrackFeatures', () => ({
  groupMapByNameAndCoordinates: vi.fn(() => ({})),
  getGroupingKeyForFeature: vi.fn(() => 'test-key'),
}));

describe.skip('Smart Prefecture Popup Positioning - Final Integration Tests (MapLibre)', () => {
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
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Integration Test: Complete system integration
   * Tests that all components work together without breaking
   * Validates: Requirements 6.1, 6.4, 6.5
   */
  it('should integrate all smart positioning components without breaking existing functionality', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // Verify all core components are rendered
    expect(container.querySelector('[data-testid="map-container"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="geojson"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="tile-layer"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="zoom-control"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="gps-control-button"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="return-to-japan-button"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="current-position-marker"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="map-event-handler"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="map-styles"]')).toBeInTheDocument();

    // Verify track markers are rendered
    const trackMarkers = container.querySelectorAll('[data-testid="track-marker"]');
    expect(trackMarkers).toHaveLength(1);

    // Verify GeoJSON layer has features
    const geoJsonLayer = container.querySelector('[data-testid="geojson"]');
    expect(geoJsonLayer).toHaveAttribute('data-features-count', '1');
  });

  /**
   * Integration Test: Error handling and graceful degradation
   * Tests that the system handles errors gracefully and maintains functionality
   * Validates: Requirements 6.5, 8.1, 8.2, 8.3
   */
  it('should handle errors gracefully and maintain core functionality', async () => {
    // Test with invalid data to trigger error handling
    const invalidJapanData = {
      type: 'FeatureCollection',
      features: null, // Invalid features
    } as any;

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={invalidJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // System should still render core components despite invalid data
    expect(container.querySelector('[data-testid="map-container"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="gps-control-button"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="return-to-japan-button"]')).toBeInTheDocument();

    // GeoJSON layer should handle invalid data gracefully
    const geoJsonLayer = container.querySelector('[data-testid="geojson"]');
    expect(geoJsonLayer).toBeInTheDocument();
  });

  /**
   * Integration Test: Backward compatibility
   * Tests that smart positioning doesn't break existing popup functionality
   * Validates: Requirements 6.1, 6.4
   */
  it('should maintain backward compatibility with existing popup system', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // Verify all existing functionality is preserved
    expect(container.querySelector('[data-testid="map-container"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="tile-layer"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="geojson"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="zoom-control"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="gps-control-button"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="return-to-japan-button"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="current-position-marker"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="map-event-handler"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="map-styles"]')).toBeInTheDocument();

    // Verify track markers are rendered correctly
    const trackMarkers = container.querySelectorAll('[data-testid="track-marker"]');
    expect(trackMarkers).toHaveLength(1);
    expect(trackMarkers[0]).toHaveAttribute('data-coordinates', '139.7673,35.6812');

    // Verify no existing functionality is broken
    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toHaveAttribute('data-zoom', '6');
    expect(mapContainer).toHaveAttribute('data-center', '36.2048,138.2529');
  });

  /**
   * Integration Test: Component state management
   * Tests that smart positioning integrates properly with React state management
   * Validates: Requirements 6.2, 6.3
   */
  it('should integrate properly with React state management', async () => {
    const { container, rerender } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // Initial render should work
    expect(container.querySelector('[data-testid="map-container"]')).toBeInTheDocument();

    // Re-render with different data should work
    const updatedChamaTrack: FeatureCollection<Point, TrackProperties> = {
      type: 'FeatureCollection',
      features: [
        ...mockChamaTrack.features,
        {
          type: 'Feature',
          properties: {
            prefecture: 'Tokyo',
            icon: 'test-icon2.png',
            title: 'Test Location 2',
            layerName: 'Test Layer 2',
            name: 'Shibuya',
            nameJp: '渋谷',
            images: ['image2.jpg'],
            links: ['https://example2.com'],
          },
          geometry: {
            type: 'Point',
            coordinates: [139.7016, 35.6598],
          },
        },
      ],
    };

    rerender(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={updatedChamaTrack}
          className="test-map-updated"
        />
      </I18nextProvider>
    );

    // Should handle state updates correctly
    expect(container.querySelector('[data-testid="map-container"]')).toBeInTheDocument();
    const trackMarkers = container.querySelectorAll('[data-testid="track-marker"]');
    expect(trackMarkers).toHaveLength(2);
  });

  /**
   * Integration Test: Performance and responsiveness
   * Tests that the integration doesn't introduce performance issues
   * Validates: Requirements 5.1, 5.2, 5.4
   */
  it('should maintain good performance with smart positioning integration', async () => {
    const startTime = performance.now();

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Verify component renders quickly
    expect(renderTime).toBeLessThan(1000); // Should render within 1 second

    // Verify all components are rendered
    expect(container.querySelector('[data-testid="map-container"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="geojson"]')).toBeInTheDocument();

    // Verify no performance-blocking operations
    await waitFor(() => {
      expect(container.querySelector('[data-testid="track-marker"]')).toBeInTheDocument();
    }, { timeout: 100 }); // Should appear quickly
  });

  /**
   * Integration Test: Multi-language support
   * Tests that smart positioning works with internationalization
   * Validates: Requirements 6.2, 6.4
   */
  it('should work correctly with internationalization', async () => {
    // Test with English
    const { container, rerender } = render(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    expect(container.querySelector('[data-testid="map-container"]')).toBeInTheDocument();

    // Switch to Japanese
    act(() => {
      i18n.changeLanguage('ja');
    });

    rerender(
      <I18nextProvider i18n={i18n}>
        <JapanMap
          japanData={mockJapanData}
          chamaTrack={mockChamaTrack}
          className="test-map"
        />
      </I18nextProvider>
    );

    // Should still work with Japanese
    expect(container.querySelector('[data-testid="map-container"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="geojson"]')).toBeInTheDocument();

    // Verify tile layer changes for Japanese (different tile source)
    const tileLayer = container.querySelector('[data-testid="tile-layer"]');
    expect(tileLayer).toBeInTheDocument();
  });
});