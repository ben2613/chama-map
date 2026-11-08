import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import JapanMap from './JapanMap';
import type { FeatureCollection, Point, MultiPolygon } from 'geojson';
import type { TrackProperties, PrefectureProperties } from '@/types/map';
import type { UserGeolocationPosition, GeolocationErrorType } from '@/types/geolocation';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

vi.mock('./BasemapTileLayer', () => ({
  default: ({ useJapaneseSource }: { useJapaneseSource: boolean }) =>
    React.createElement('div', {
      'data-testid': 'tile-layer',
      'data-use-japanese-source': String(useJapaneseSource),
    }),
}));

// Mock Leaflet and React Leaflet
const mockFlyTo = vi.fn();
const mockGetZoom = vi.fn(() => 10);
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
        div.className = 'leaflet-control-gps';
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('data-testid', 'gps-button');
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
  },
}));

// Mock react-leaflet components
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
      addControl: mockAddControl,
      removeControl: mockRemoveControl,
    }),
  };
});

// Mock geolocation hook
const mockUseGeolocation = vi.fn();
vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => mockUseGeolocation(),
}));

// Mock other dependencies
vi.mock('@/hooks/useMapRefs', () => ({
  useMapRefs: () => ({
    markerRefs: { current: {} },
    popupRef: { current: null },
    mapRef: { current: null },
    popupOpening: {
      markOpening: () => {},
      markClosed: () => {},
      isOpening: () => false,
    },
    registerMarkerRef: vi.fn(() => ({ current: null })),
  }),
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

// Mock TrackMarker to avoid Leaflet Icon issues
vi.mock('./TrackMarker', () => ({
  default: ({ coordinates, ...props }: any) => (
    <div data-testid="track-marker" data-coordinates={coordinates.join(',')} {...props} />
  ),
}));

// Mock other map components
vi.mock('./MapEventHandler', () => ({
  default: ({ ...props }: any) => <div data-testid="map-event-handler" {...props} />,
}));

vi.mock('./PrefecturePopup', () => ({
  default: ({ ...props }: any) => <div data-testid="prefecture-popup" {...props} />,
}));

vi.mock('./MapStyles', () => ({
  default: () => <div data-testid="map-styles" />,
}));

// Mock ReturnToJapanButton
vi.mock('./ReturnToJapanButton', () => ({
  default: ({ onReturnToJapan, isAnimating, controlPosition, ...props }: any) => (
    <div
      data-testid="return-to-japan-button"
      data-animating={isAnimating}
      data-position={controlPosition}
      onClick={onReturnToJapan}
      {...props}
    />
  ),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    {children}
  </I18nextProvider>
);

// Sample test data
const sampleJapanData: FeatureCollection<MultiPolygon, PrefectureProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[[[139.0, 35.0], [140.0, 35.0], [140.0, 36.0], [139.0, 36.0], [139.0, 35.0]]]],
      },
      properties: {
        nam: 'Tokyo',
        nam_ja: '東京都',
        id: 13,
        center: [139.6917, 35.6895],
      },
    },
  ],
};

const sampleChamaTrack: FeatureCollection<Point, TrackProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [139.6917, 35.6895],
      },
      properties: {
        name: 'Tokyo Station',
        nameJp: '東京駅',
        title: 'Tokyo Station',
        layerName: 'test-layer',
        prefecture: 'Tokyo',
        icon: 'default',
        images: [],
        links: [],
      },
    },
  ],
};

describe.skip('JapanMap Integration Tests (MapLibre — rewrite pending)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset geolocation mock to default state
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
  });

  /**
   * Integration Test: Component integration within JapanMap
   * Validates: Requirements 1.4, 4.3, 4.4, 4.5
   */
  it('should integrate geolocation components correctly within JapanMap', () => {
    const position: UserGeolocationPosition = {
      lat: 35.6762,
      lng: 139.6503,
      accuracy: 10,
      timestamp: Date.now(),
    };

    // Mock geolocation hook return value
    mockUseGeolocation.mockReturnValue({
      position,
      error: null,
      isLoading: false,
      isPermissionGranted: true,
      requestLocation: vi.fn(),
      watchPosition: vi.fn(),
      stopWatching: vi.fn(),
    });

    let container: HTMLElement;
    act(() => {
      const result = render(
        <TestWrapper>
          <JapanMap
            japanData={sampleJapanData}
            chamaTrack={sampleChamaTrack}
            className="test-map"
          />
        </TestWrapper>
      );
      container = result.container;
    });

    // Should render map container
    const mapContainer = container!.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toBeInTheDocument();

    // Should render zoom control
    const zoomControl = container!.querySelector('[data-testid="zoom-control"]');
    expect(zoomControl).toBeInTheDocument();

    // Should render GeoJSON layer
    const geoJsonLayer = container!.querySelector('[data-testid="geojson"]');
    expect(geoJsonLayer).toBeInTheDocument();

    // GPS control should be added to map
    expect(mockAddControl).toHaveBeenCalled();

    // Should render current position marker when permission granted and position available
    const markers = container!.querySelectorAll('[data-testid="marker"]');
    expect(markers.length).toBeGreaterThan(0);
  });

  /**
   * Integration Test: Error handling and permission flows
   * Validates: Requirements 1.4, 4.3, 4.4, 4.5
   */
  it('should handle geolocation errors and permission states correctly', () => {
    const error: GeolocationErrorType = { code: 'PERMISSION_DENIED', message: 'Permission denied' };

    // Mock geolocation hook with error state
    mockUseGeolocation.mockReturnValue({
      position: null,
      error,
      isLoading: false,
      isPermissionGranted: false,
      requestLocation: vi.fn(),
      watchPosition: vi.fn(),
      stopWatching: vi.fn(),
    });

    let container: HTMLElement;
    act(() => {
      const result = render(
        <TestWrapper>
          <JapanMap
            japanData={sampleJapanData}
            chamaTrack={sampleChamaTrack}
            className="test-map"
          />
        </TestWrapper>
      );
      container = result.container;
    });

    // Should render map container even with errors
    const mapContainer = container!.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toBeInTheDocument();

    // Should display error message
    const errorMessage = container!.querySelector('.bg-red-100');
    expect(errorMessage).toBeInTheDocument();

    // GPS control should still be added but may be disabled
    expect(mockAddControl).toHaveBeenCalled();
  });

  /**
   * Integration Test: GPS button interaction with map centering
   * Validates: Requirements 6.3, 6.4, 6.5
   */
  it('should handle GPS button clicks and map centering correctly', () => {
    const mockRequestLocation = vi.fn();
    const mockWatchPosition = vi.fn();
    const position: UserGeolocationPosition = {
      lat: 35.6762,
      lng: 139.6503,
      accuracy: 10,
      timestamp: Date.now(),
    };

    // Mock geolocation hook with valid position
    mockUseGeolocation.mockReturnValue({
      position,
      error: null,
      isLoading: false,
      isPermissionGranted: true,
      requestLocation: mockRequestLocation,
      watchPosition: mockWatchPosition,
      stopWatching: vi.fn(),
    });

    let container: HTMLElement;
    act(() => {
      const result = render(
        <TestWrapper>
          <JapanMap
            japanData={sampleJapanData}
            chamaTrack={sampleChamaTrack}
            className="test-map"
          />
        </TestWrapper>
      );
      container = result.container;
    });

    // Should render map and add GPS control
    expect(mockAddControl).toHaveBeenCalled();

    // Verify map renders correctly
    const mapContainer = container!.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toBeInTheDocument();

    // Should render current position marker
    const markers = container!.querySelectorAll('[data-testid="marker"]');
    expect(markers.length).toBeGreaterThan(0);
  });

  /**
   * Integration Test: Language switching and internationalization
   * Validates: Requirements 7.1, 7.2, 7.3, 7.5
   */
  it('should handle language switching correctly', () => {
    const position: UserGeolocationPosition = {
      lat: 35.6762,
      lng: 139.6503,
      accuracy: 10,
      timestamp: Date.now(),
    };

    // Mock geolocation hook
    mockUseGeolocation.mockReturnValue({
      position,
      error: null,
      isLoading: false,
      isPermissionGranted: true,
      requestLocation: vi.fn(),
      watchPosition: vi.fn(),
      stopWatching: vi.fn(),
    });

    act(() => {
      // Change language to Japanese
      i18n.changeLanguage('ja');
    });

    let container: HTMLElement;
    act(() => {
      const result = render(
        <TestWrapper>
          <JapanMap
            japanData={sampleJapanData}
            chamaTrack={sampleChamaTrack}
            className="test-map"
          />
        </TestWrapper>
      );
      container = result.container;
    });

    // Should render map with correct language context
    const mapContainer = container!.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toBeInTheDocument();

    // Verify i18n is using the correct language
    expect(i18n.language).toBe('ja');

    // Should use appropriate tile layer based on language
    const tileLayer = container!.querySelector('[data-testid="tile-layer"]');
    expect(tileLayer).toBeInTheDocument();
  });

  // Unit test for component cleanup
  it('should clean up geolocation resources on unmount', () => {
    const mockStopWatching = vi.fn();

    mockUseGeolocation.mockReturnValue({
      position: null,
      error: null,
      isLoading: false,
      isPermissionGranted: false,
      requestLocation: vi.fn(),
      watchPosition: vi.fn(),
      stopWatching: mockStopWatching,
    });

    const { unmount } = render(
      <TestWrapper>
        <JapanMap
          japanData={sampleJapanData}
          chamaTrack={sampleChamaTrack}
          className="test-map"
        />
      </TestWrapper>
    );

    // Unmount component
    act(() => {
      unmount();
    });

    // GPS control should be removed from map
    expect(mockRemoveControl).toHaveBeenCalled();
  });

  // Unit test for no geolocation support
  it('should handle browsers without geolocation support', () => {
    mockUseGeolocation.mockReturnValue({
      position: null,
      error: { code: 'POSITION_UNAVAILABLE', message: 'Geolocation not supported' },
      isLoading: false,
      isPermissionGranted: false,
      requestLocation: vi.fn(),
      watchPosition: vi.fn(),
      stopWatching: vi.fn(),
    });

    let container: HTMLElement;
    act(() => {
      const result = render(
        <TestWrapper>
          <JapanMap
            japanData={sampleJapanData}
            chamaTrack={sampleChamaTrack}
            className="test-map"
          />
        </TestWrapper>
      );
      container = result.container;
    });

    // Should still render map
    const mapContainer = container!.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toBeInTheDocument();

    // Should display error message
    const errorMessage = container!.querySelector('.bg-red-100');
    expect(errorMessage).toBeInTheDocument();
  });

  // Unit test for empty data handling
  it('should handle empty or missing data gracefully', () => {
    mockUseGeolocation.mockReturnValue({
      position: null,
      error: null,
      isLoading: false,
      isPermissionGranted: false,
      requestLocation: vi.fn(),
      watchPosition: vi.fn(),
      stopWatching: vi.fn(),
    });

    let container: HTMLElement;
    act(() => {
      const result = render(
        <TestWrapper>
          <JapanMap
            japanData={{ type: 'FeatureCollection', features: [] }}
            chamaTrack={{ type: 'FeatureCollection', features: [] }}
            className="test-map"
          />
        </TestWrapper>
      );
      container = result.container;
    });

    // Should render map even with empty data
    const mapContainer = container!.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toBeInTheDocument();

    // Should still add GPS control
    expect(mockAddControl).toHaveBeenCalled();
  });

  // Unit test for loading state
  it('should handle loading state correctly', () => {
    mockUseGeolocation.mockReturnValue({
      position: null,
      error: null,
      isLoading: true,
      isPermissionGranted: true,
      requestLocation: vi.fn(),
      watchPosition: vi.fn(),
      stopWatching: vi.fn(),
    });

    let container: HTMLElement;
    act(() => {
      const result = render(
        <TestWrapper>
          <JapanMap
            japanData={sampleJapanData}
            chamaTrack={sampleChamaTrack}
            className="test-map"
          />
        </TestWrapper>
      );
      container = result.container;
    });

    // Should render map during loading
    const mapContainer = container!.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toBeInTheDocument();

    // GPS control should be added
    expect(mockAddControl).toHaveBeenCalled();
  });

  /**
   * Integration Test: ReturnToJapanButton integration within JapanMap
   * Property 10: Non-interference with existing functionality
   * Validates: Requirements 1.3, 7.1, 7.4
   */
  it('should integrate ReturnToJapanButton correctly within JapanMap', () => {
    mockUseGeolocation.mockReturnValue({
      position: null,
      error: null,
      isLoading: false,
      isPermissionGranted: false,
      requestLocation: vi.fn(),
      watchPosition: vi.fn(),
      stopWatching: vi.fn(),
    });

    let container: HTMLElement;
    act(() => {
      const result = render(
        <TestWrapper>
          <JapanMap
            japanData={sampleJapanData}
            chamaTrack={sampleChamaTrack}
            className="test-map"
          />
        </TestWrapper>
      );
      container = result.container;
    });

    // Should render ReturnToJapanButton
    const returnButton = container!.querySelector('[data-testid="return-to-japan-button"]');
    expect(returnButton).toBeInTheDocument();

    // Should be positioned in bottomright with other controls
    expect(returnButton?.getAttribute('data-position')).toBe('bottomright');

    // Should not be animating initially
    expect(returnButton?.getAttribute('data-animating')).toBe('false');

    // Should render alongside existing controls without interference
    const zoomControl = container!.querySelector('[data-testid="zoom-control"]');
    expect(zoomControl).toBeInTheDocument();

    // GPS control should still be added
    expect(mockAddControl).toHaveBeenCalled();

    // Map container should still render correctly
    const mapContainer = container!.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toBeInTheDocument();
  });

  /**
   * Integration Test: ReturnToJapanButton positioning relative to existing controls
   * Validates: Requirements 1.3, 7.1, 7.4
   */
  it('should position ReturnToJapanButton correctly relative to existing controls', () => {
    mockUseGeolocation.mockReturnValue({
      position: null,
      error: null,
      isLoading: false,
      isPermissionGranted: true,
      requestLocation: vi.fn(),
      watchPosition: vi.fn(),
      stopWatching: vi.fn(),
    });

    let container: HTMLElement;
    act(() => {
      const result = render(
        <TestWrapper>
          <JapanMap
            japanData={sampleJapanData}
            chamaTrack={sampleChamaTrack}
            className="test-map"
          />
        </TestWrapper>
      );
      container = result.container;
    });

    // All controls should be positioned in bottomright
    const zoomControl = container!.querySelector('[data-testid="zoom-control"]');
    expect(zoomControl?.getAttribute('data-position')).toBe('bottomright');

    const returnButton = container!.querySelector('[data-testid="return-to-japan-button"]');
    expect(returnButton?.getAttribute('data-position')).toBe('bottomright');

    // Both controls should exist without conflicts
    expect(zoomControl).toBeInTheDocument();
    expect(returnButton).toBeInTheDocument();

    // GPS control should be added (via Leaflet control system)
    expect(mockAddControl).toHaveBeenCalled();
  });

  /**
   * Integration Test: ReturnToJapanButton animation state management
   * Validates: Requirements 1.3, 7.1, 7.4
   */
  it('should handle ReturnToJapanButton animation state correctly', () => {
    mockUseGeolocation.mockReturnValue({
      position: null,
      error: null,
      isLoading: false,
      isPermissionGranted: false,
      requestLocation: vi.fn(),
      watchPosition: vi.fn(),
      stopWatching: vi.fn(),
    });

    let container: HTMLElement;
    act(() => {
      const result = render(
        <TestWrapper>
          <JapanMap
            japanData={sampleJapanData}
            chamaTrack={sampleChamaTrack}
            className="test-map"
          />
        </TestWrapper>
      );
      container = result.container;
    });

    const returnButton = container!.querySelector('[data-testid="return-to-japan-button"]');
    expect(returnButton).toBeInTheDocument();

    // Initially should not be animating
    expect(returnButton?.getAttribute('data-animating')).toBe('false');

    // The ReturnToJapanButton component handles the animation logic internally
    // We can verify it's integrated correctly by checking it renders and has correct props
    expect(returnButton?.getAttribute('data-position')).toBe('bottomright');
  });

  /**
   * Property Test: Non-interference with existing functionality
   * Property 10: Non-interference with existing functionality
   * Validates: Requirements 1.3, 7.1, 7.4
   */
  it('should not interfere with existing map functionality when ReturnToJapanButton is present', () => {
    const mockRequestLocation = vi.fn();
    const mockWatchPosition = vi.fn();
    const position: UserGeolocationPosition = {
      lat: 35.6762,
      lng: 139.6503,
      accuracy: 10,
      timestamp: Date.now(),
    };

    mockUseGeolocation.mockReturnValue({
      position,
      error: null,
      isLoading: false,
      isPermissionGranted: true,
      requestLocation: mockRequestLocation,
      watchPosition: mockWatchPosition,
      stopWatching: vi.fn(),
    });

    let container: HTMLElement;
    act(() => {
      const result = render(
        <TestWrapper>
          <JapanMap
            japanData={sampleJapanData}
            chamaTrack={sampleChamaTrack}
            className="test-map"
          />
        </TestWrapper>
      );
      container = result.container;
    });

    // All existing functionality should still work

    // Map should render
    const mapContainer = container!.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toBeInTheDocument();

    // Zoom control should render
    const zoomControl = container!.querySelector('[data-testid="zoom-control"]');
    expect(zoomControl).toBeInTheDocument();

    // GeoJSON layer should render
    const geoJsonLayer = container!.querySelector('[data-testid="geojson"]');
    expect(geoJsonLayer).toBeInTheDocument();

    // GPS control should be added
    expect(mockAddControl).toHaveBeenCalled();

    // Track markers should render
    const trackMarkers = container!.querySelectorAll('[data-testid="track-marker"]');
    expect(trackMarkers.length).toBeGreaterThan(0);

    // Current position markers should render
    const markers = container!.querySelectorAll('[data-testid="marker"]');
    expect(markers.length).toBeGreaterThan(0);

    // ReturnToJapanButton should be present but not interfere
    const returnButton = container!.querySelector('[data-testid="return-to-japan-button"]');
    expect(returnButton).toBeInTheDocument();

    // All components should coexist without conflicts
    expect(mapContainer).toBeInTheDocument();
    expect(zoomControl).toBeInTheDocument();
    expect(returnButton).toBeInTheDocument();
    expect(geoJsonLayer).toBeInTheDocument();
  });
});