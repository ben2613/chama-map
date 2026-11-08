import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PrefecturePopup from './PrefecturePopup';
import { SmartPositionConfig } from '@/types/map';
import type { FeatureCollection, Point, MultiPolygon } from 'geojson';
import { TrackProperties, PrefectureProperties } from '@/types/map';
import L from 'leaflet';

// Mock react-leaflet
const mockUseMap = vi.fn();
vi.mock('react-leaflet', async () => {
  const actual = await vi.importActual('react-leaflet');
  return {
    ...actual,
    Popup: ({ children, position, ...props }: any) => (
      <div data-testid="popup" data-position={position?.join(',')} {...props}>
        {children}
      </div>
    ),
    useMap: () => mockUseMap(),
  };
});

// Mock ViewportCalculator
vi.mock('@/utils/ViewportCalculator', () => ({
  ViewportCalculator: {
    validateClickPosition: vi.fn(() => true),
    adjustPositionForVisibility: vi.fn((pos) => pos),
    adjustPositionForVisibilityAndControls: vi.fn((pos) => pos),
    checkControlCollision: vi.fn(() => false),
    getControlBounds: vi.fn(() => []),
  },
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock groupTrackFeatures
vi.mock('@/utils/groupTrackFeatures', () => ({
  getGroupingKeyForFeature: vi.fn(() => 'test-key'),
}));

describe.skip('PrefecturePopup (requires MapLibre test harness)', () => {
  const mockMap = {
    latLngToContainerPoint: vi.fn(() => ({ x: 200, y: 300 })),
    containerPointToLatLng: vi.fn(() => ({ lat: 35.7, lng: 139.7 })),
    getBounds: vi.fn(),
  } as unknown as L.Map;

  const mockPositionConfig: SmartPositionConfig = {
    prefectureCenter: [35.6762, 139.6503],
    clickPosition: [35.7, 139.7],
    useClickPosition: true,
    viewportBounds: {} as L.LatLngBounds,
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
          name: 'Test Location',
          nameJp: 'テスト場所',
          images: [],
          links: [],
        },
        geometry: {
          type: 'Point',
          coordinates: [139.6503, 35.6762],
        },
      },
    ],
  };

  const mockJapanData: FeatureCollection<MultiPolygon, PrefectureProperties> = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          nam: 'Tokyo',
          nam_ja: '東京都',
          id: 1,
          center: [35.6762, 139.6503],
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[[[139.0, 35.0], [140.0, 35.0], [140.0, 36.0], [139.0, 36.0], [139.0, 35.0]]]],
        },
      },
    ],
  };

  const mockMarkerRefs = { current: {} };
  const mockPopupRef = { current: null };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMap.mockReturnValue(mockMap);
  });

  it('should render popup with correct position when using click position', () => {
    render(
      <PrefecturePopup
        selectedPrefecture="Tokyo"
        positionConfig={mockPositionConfig}
        chamaTrack={mockChamaTrack}
        japanData={mockJapanData}
        markerRefs={mockMarkerRefs}
        popupRef={mockPopupRef}
      />
    );

    const popup = screen.getByTestId('popup');
    expect(popup).toBeInTheDocument();

    // Should initially use click position
    expect(popup).toHaveAttribute('data-position', '35.7,139.7');
  });

  it('should render popup with prefecture center when not using click position', () => {
    const centerPositionConfig: SmartPositionConfig = {
      ...mockPositionConfig,
      useClickPosition: false,
    };

    render(
      <PrefecturePopup
        selectedPrefecture="Tokyo"
        positionConfig={centerPositionConfig}
        chamaTrack={mockChamaTrack}
        japanData={mockJapanData}
        markerRefs={mockMarkerRefs}
        popupRef={mockPopupRef}
      />
    );

    const popup = screen.getByTestId('popup');
    expect(popup).toBeInTheDocument();

    // Should use prefecture center
    expect(popup).toHaveAttribute('data-position', '35.6762,139.6503');
  });

  it('should display prefecture name correctly', () => {
    render(
      <PrefecturePopup
        selectedPrefecture="Tokyo"
        positionConfig={mockPositionConfig}
        chamaTrack={mockChamaTrack}
        japanData={mockJapanData}
        markerRefs={mockMarkerRefs}
        popupRef={mockPopupRef}
      />
    );

    expect(screen.getByText('Tokyo')).toBeInTheDocument();
  });

  it('should display track locations', () => {
    render(
      <PrefecturePopup
        selectedPrefecture="Tokyo"
        positionConfig={mockPositionConfig}
        chamaTrack={mockChamaTrack}
        japanData={mockJapanData}
        markerRefs={mockMarkerRefs}
        popupRef={mockPopupRef}
      />
    );

    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });

  it('should show no tracks message when no tracks available', () => {
    const emptyChamaTrack: FeatureCollection<Point, TrackProperties> = {
      type: 'FeatureCollection',
      features: [],
    };

    render(
      <PrefecturePopup
        selectedPrefecture="Tokyo"
        positionConfig={mockPositionConfig}
        chamaTrack={emptyChamaTrack}
        japanData={mockJapanData}
        markerRefs={mockMarkerRefs}
        popupRef={mockPopupRef}
      />
    );

    expect(screen.getByText('map.noTracks')).toBeInTheDocument();
  });
});