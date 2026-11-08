import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrefectureHandlers, getPrefectureForPoint } from './mapPrefectureUtils';
import { ViewportCalculator } from './ViewportCalculator';
import L from 'leaflet';
import type { Feature, FeatureCollection, MultiPolygon } from 'geojson';
import type { PrefectureProperties, PopupOpeningControl } from '@/types/map';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

// Mock ViewportCalculator
vi.mock('./ViewportCalculator', () => ({
  ViewportCalculator: {
    validateClickPosition: vi.fn(),
    determineSmartPosition: vi.fn(),
    createFallbackBounds: vi.fn(),
  },
}));

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    LatLngBounds: vi.fn(),
  },
}));

// Mock Turf.js
vi.mock('@turf/boolean-point-in-polygon', () => ({
  default: vi.fn(),
}));

function createMockPopupOpening() {
  let opening = false;
  const control: PopupOpeningControl = {
    markOpening: () => {
      opening = true;
    },
    markClosed: () => {
      opening = false;
    },
    isOpening: () => opening,
  };
  return { control, getOpening: () => opening };
}

describe.skip('mapPrefectureUtils (Leaflet handler tests — pending MapLibre port)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPrefectureHandlers', () => {
    it('should create handlers that capture click positions and implement smart positioning', () => {
      // Mock dependencies
      const mockSetSelectedPrefecture = vi.fn();
      const { control: mockPopupOpening, getOpening } = createMockPopupOpening();
      const mockMap = {
        getBounds: vi.fn().mockReturnValue(new L.LatLngBounds([35, 139], [36, 140])),
      };

      // Mock ViewportCalculator methods
      const mockValidateClickPosition = vi.mocked(ViewportCalculator.validateClickPosition);
      const mockDetermineSmartPosition = vi.mocked(ViewportCalculator.determineSmartPosition);
      const mockCreateFallbackBounds = vi.mocked(ViewportCalculator.createFallbackBounds);

      mockValidateClickPosition.mockReturnValue(true);
      mockDetermineSmartPosition.mockReturnValue({
        prefectureCenter: [35.5, 139.5],
        clickPosition: [35.6, 139.6],
        useClickPosition: true,
        viewportBounds: mockMap.getBounds(),
      });
      mockCreateFallbackBounds.mockReturnValue(mockMap.getBounds());

      // Mock boolean-point-in-polygon to return true
      const mockBooleanPointInPolygon = vi.mocked(booleanPointInPolygon);
      mockBooleanPointInPolygon.mockReturnValue(true);

      // Create test feature
      const testFeature: Feature<MultiPolygon, PrefectureProperties> = {
        type: 'Feature',
        properties: {
          nam: 'Tokyo',
          nam_ja: '東京都',
          id: 1,
          center: [35.5, 139.5],
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[[[139, 35], [140, 35], [140, 36], [139, 36], [139, 35]]]],
        },
      };

      // Create mock layer
      const mockLayer = {
        on: vi.fn(),
      };

      // Create handlers
      const handlers = createPrefectureHandlers(
        mockSetSelectedPrefecture,
        mockPopupOpening,
        undefined
      );

      // Execute handler
      handlers(testFeature, mockLayer as unknown as L.Layer);

      // Verify layer.on was called with correct events
      expect(mockLayer.on).toHaveBeenCalledWith({
        click: expect.any(Function),
        mouseover: expect.any(Function),
        mouseout: expect.any(Function),
      });

      // Get the click handler
      const eventHandlers = mockLayer.on.mock.calls[0][0];
      const clickHandler = eventHandlers.click;

      // Mock click event
      const mockClickEvent = {
        latlng: { lat: 35.6, lng: 139.6 },
        target: { _map: mockMap },
      };

      // Execute click handler
      clickHandler(mockClickEvent);

      // Verify click position validation was called
      expect(mockValidateClickPosition).toHaveBeenCalledWith(
        [35.6, 139.6],
        [35.5, 139.5]
      );

      // Verify smart positioning was called with valid click position
      expect(mockDetermineSmartPosition).toHaveBeenCalledWith(
        [35.5, 139.5],
        [35.6, 139.6],
        mockMap.getBounds(),
        mockMap
      );

      // Verify setSelectedPrefecture was called with position config
      expect(mockSetSelectedPrefecture).toHaveBeenCalledWith(
        'Tokyo',
        expect.objectContaining({
          prefectureCenter: [35.5, 139.5],
          clickPosition: [35.6, 139.6],
          useClickPosition: true,
        })
      );

      // Verify popup opening flag was set
      expect(getOpening()).toBe(true);
    });

    it('should fall back to prefecture center when click position is invalid', () => {
      // Mock dependencies
      const mockSetSelectedPrefecture = vi.fn();
      const { control: mockPopupOpening, getOpening } = createMockPopupOpening();
      const mockMap = {
        getBounds: vi.fn().mockReturnValue(new L.LatLngBounds([35, 139], [36, 140])),
      };

      // Mock ViewportCalculator methods - invalid click position
      const mockValidateClickPosition = vi.mocked(ViewportCalculator.validateClickPosition);
      const mockDetermineSmartPosition = vi.mocked(ViewportCalculator.determineSmartPosition);
      const mockCreateFallbackBounds = vi.mocked(ViewportCalculator.createFallbackBounds);

      mockValidateClickPosition.mockReturnValue(false); // Invalid click position
      mockDetermineSmartPosition.mockReturnValue({
        prefectureCenter: [35.6762, 139.6503], // Use fallback coordinates
        clickPosition: [35.6762, 139.6503], // Should use prefecture center
        useClickPosition: false,
        viewportBounds: mockMap.getBounds(),
      });
      mockCreateFallbackBounds.mockReturnValue(mockMap.getBounds());

      // Mock boolean-point-in-polygon to return false (outside prefecture)
      const mockBooleanPointInPolygon = vi.mocked(booleanPointInPolygon);
      mockBooleanPointInPolygon.mockReturnValue(false);

      // Create test feature
      const testFeature: Feature<MultiPolygon, PrefectureProperties> = {
        type: 'Feature',
        properties: {
          nam: 'Tokyo',
          nam_ja: '東京都',
          id: 1,
          center: [35.5, 139.5],
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[[[139, 35], [140, 35], [140, 36], [139, 36], [139, 35]]]],
        },
      };

      // Create mock layer
      const mockLayer = {
        on: vi.fn(),
      };

      // Create handlers
      const handlers = createPrefectureHandlers(
        mockSetSelectedPrefecture,
        mockPopupOpening,
        undefined
      );

      // Execute handler
      handlers(testFeature, mockLayer as unknown as L.Layer);

      // Get the click handler
      const eventHandlers = mockLayer.on.mock.calls[0][0];
      const clickHandler = eventHandlers.click;

      // Mock click event with invalid position
      const mockClickEvent = {
        latlng: { lat: 40.0, lng: 140.0 }, // Far from prefecture center
        target: { _map: mockMap },
      };

      // Execute click handler
      clickHandler(mockClickEvent);

      // Verify smart positioning was called with prefecture center as fallback
      expect(mockDetermineSmartPosition).toHaveBeenCalledWith(
        [35.6762, 139.6503], // Tokyo fallback coordinates
        [35.6762, 139.6503], // Should use prefecture center as fallback
        mockMap.getBounds(),
        mockMap
      );
    });
  });

  describe('getPrefectureForPoint', () => {
    it('should return prefecture name when point is within prefecture boundaries', () => {
      // Mock boolean-point-in-polygon to return true
      const mockBooleanPointInPolygon = vi.mocked(booleanPointInPolygon);
      mockBooleanPointInPolygon.mockReturnValue(true);

      const mockPrefectures: FeatureCollection<MultiPolygon, PrefectureProperties> = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              nam: 'Tokyo',
              nam_ja: '東京都',
              id: 1,
              center: [35.5, 139.5],
            },
            geometry: {
              type: 'MultiPolygon',
              coordinates: [[[[139, 35], [140, 35], [140, 36], [139, 36], [139, 35]]]],
            },
          },
        ],
      };

      const result = getPrefectureForPoint([139.5, 35.5], mockPrefectures);
      expect(result).toBe('Tokyo');
    });
  });
});