import { PrefectureProperties, SmartPositionConfig, PopupOpeningControl } from '@/types/map';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Position } from 'geojson';
import type { MapProjection } from '@/map/mapProjection';
import type { GeoBounds } from '@/map/geoBounds';
import { ViewportCalculator } from './ViewportCalculator';
import { ClickPositionManager } from './ClickPositionManager';

export function getPrefectureForPoint(
  point: Position,
  prefectures: FeatureCollection<MultiPolygon, PrefectureProperties>
) {
  for (const feature of prefectures.features) {
    if (booleanPointInPolygon(point, feature)) {
      return feature.properties.nam;
    }
  }
  // if no prefecture found, return the closest prefecture, with the prefecture center
  const closestPrefecture = getClosestPrefecture(point, prefectures);
  console.log('No prefecture found for point', point, ', fallback to', closestPrefecture);
  return closestPrefecture;
}

/**
 * Enhanced prefecture detection for boundary clicks with tolerance
 * Handles ambiguous clicks near prefecture boundaries by finding the closest prefecture
 * within a reasonable tolerance distance
 */
export function getPrefectureForPointWithBoundaryTolerance(
  point: Position,
  prefectures: FeatureCollection<MultiPolygon, PrefectureProperties>,
  toleranceKm: number = 5
): { prefecture: string; isNearBoundary: boolean; confidence: number } {
  try {
    // First, try exact point-in-polygon check
    for (const feature of prefectures.features) {
      if (booleanPointInPolygon(point, feature)) {
        return {
          prefecture: feature.properties.nam,
          isNearBoundary: false,
          confidence: 1.0
        };
      }
    }

    // Point is not inside any prefecture - find closest prefecture with boundary analysis
    const toleranceDegrees = toleranceKm / 111; // Rough conversion: 1 degree ≈ 111km
    let closestPrefecture = '';
    let closestDistance = Infinity;
    let secondClosestDistance = Infinity;

    for (const feature of prefectures.features) {
      const distance = getDistance(point, feature.properties.center);

      if (distance < closestDistance) {
        secondClosestDistance = closestDistance;
        closestDistance = distance;
        closestPrefecture = feature.properties.nam;
      } else if (distance < secondClosestDistance) {
        secondClosestDistance = distance;
      }
    }

    // Determine if this is a boundary click based on distance ratios
    const isNearBoundary = closestDistance <= toleranceDegrees;
    const confidence = secondClosestDistance > 0
      ? Math.max(0.1, 1 - (closestDistance / secondClosestDistance))
      : 0.5;

    console.log('Boundary-aware prefecture detection:', {
      point,
      prefecture: closestPrefecture,
      isNearBoundary,
      confidence,
      closestDistance: closestDistance * 111, // Convert back to km for logging
      toleranceKm
    });

    return {
      prefecture: closestPrefecture,
      isNearBoundary,
      confidence
    };
  } catch (error) {
    console.error('Error in boundary-aware prefecture detection:', error);

    // Fallback to simple closest prefecture
    const closestPrefecture = getClosestPrefecture(point, prefectures);
    return {
      prefecture: closestPrefecture,
      isNearBoundary: true, // Assume boundary click on error
      confidence: 0.3
    };
  }
}

function getClosestPrefecture(point: Position, prefectures: FeatureCollection<MultiPolygon, PrefectureProperties>) {
  let closestPrefecture = '';
  let closestDistance = Infinity;
  for (const feature of prefectures.features) {
    const distance = getDistance(point, feature.properties.center);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPrefecture = feature.properties.nam;
    }
  }
  return closestPrefecture;
}

function getDistance(point: Position, center: Position) {
  return Math.sqrt((point[1] - center[0]) ** 2 + (point[0] - center[1]) ** 2);
}
/**
 * Validates and ensures prefecture center coordinates are valid
 */
function validatePrefectureCenter(
  prefectureCenter: [number, number],
  feature: Feature<Geometry, PrefectureProperties>
): [number, number] {
  if (!ViewportCalculator.validateClickPosition(prefectureCenter, prefectureCenter)) {
    console.error('Invalid prefecture center coordinates:', prefectureCenter);
    // Use Tokyo coordinates as ultimate fallback
    const fallbackCenter: [number, number] = [35.6762, 139.6503];
    console.warn('Using fallback center coordinates:', fallbackCenter);
    feature.properties.center = fallbackCenter;
    return fallbackCenter;
  }
  return prefectureCenter;
}

/**
 * Captures and validates click position with boundary analysis
 */
function captureClickPosition(
  clickLatLng: { lat: number; lng: number },
  prefectureCenter: [number, number],
  prefectureData?: FeatureCollection<MultiPolygon, PrefectureProperties>
): {
  clickPosition: [number, number];
  boundaryInfo: { isNearBoundary: boolean; confidence: number };
} {
  let clickPosition: [number, number];
  let boundaryInfo: { isNearBoundary: boolean; confidence: number } = {
    isNearBoundary: false,
    confidence: 1.0
  };

  try {
    if (typeof clickLatLng.lat !== 'number' || typeof clickLatLng.lng !== 'number') {
      throw new Error('Invalid click event coordinates');
    }
    clickPosition = [clickLatLng.lat, clickLatLng.lng];
    console.log('click position captured:', clickPosition);

  try {
      const clickPoint: Position = [clickPosition[1], clickPosition[0]];
      if (prefectureData) {
        const boundaryResult = getPrefectureForPointWithBoundaryTolerance(clickPoint, prefectureData);
        boundaryInfo = {
          isNearBoundary: boundaryResult.isNearBoundary,
          confidence: boundaryResult.confidence
        };
        console.log('Boundary analysis result:', boundaryResult);
      }
    } catch (boundaryError) {
      console.warn('Could not perform boundary analysis:', boundaryError);
    }
  } catch (clickError) {
    console.error('Error capturing click position:', clickError);
    clickPosition = prefectureCenter;
    boundaryInfo = { isNearBoundary: false, confidence: 0.5 };
    console.warn('Using prefecture center as click position fallback:', clickPosition);
  }

  return { clickPosition, boundaryInfo };
}

/**
 * Gets map instance and viewport information with error handling
 */
function getMapAndViewportInfo(
  map: MapProjection | null,
  prefectureCenter: [number, number]
): {
  map: MapProjection | null;
  viewportBounds: GeoBounds;
  mapState: { zoom: number; size: { x: number; y: number } } | null;
} {
  let viewportBounds: GeoBounds;
  let mapState: { zoom: number; size: { x: number; y: number } } | null = null;

  try {
    if (!map) {
      throw new Error('Invalid map instance');
    }
    viewportBounds = map.getBounds();
    mapState = {
      zoom: map.getZoom(),
      size: map.getSize()
    };
  } catch (mapError) {
    console.error('Error getting map instance or viewport bounds:', mapError);
    viewportBounds = ViewportCalculator.createFallbackBounds(prefectureCenter);
    console.warn('Using fallback viewport bounds');
  }

  return { map, viewportBounds, mapState };
}

/**
 * Handles rapid clicks and manages click state
 */
function handleClickState(
  clickManager: ClickPositionManager,
  clickPosition: [number, number],
  prefectureName: string,
  boundaryInfo: { isNearBoundary: boolean; confidence: number }
): {
  finalClickPosition: [number, number];
  finalBoundaryInfo: { isNearBoundary: boolean; confidence: number };
} {
  try {
    const finalClickState = clickManager.handleRapidClicks(
      clickPosition,
      prefectureName,
      boundaryInfo.isNearBoundary,
      boundaryInfo.confidence
    );

    // Store the click position for future reference
    clickManager.storeClickPosition(
      finalClickState.position,
      prefectureName,
      finalClickState.isNearBoundary,
      finalClickState.confidence
    );

    return {
      finalClickPosition: finalClickState.position,
      finalBoundaryInfo: {
        isNearBoundary: finalClickState.isNearBoundary,
        confidence: finalClickState.confidence
      }
    };

  } catch (stateError) {
    console.error('Error in click state management:', stateError);
    // Continue with original click position
    return {
      finalClickPosition: clickPosition,
      finalBoundaryInfo: boundaryInfo
    };
  }
}

/**
 * Validates click position against prefecture boundaries
 */
function validateClickPosition(
  clickPosition: [number, number],
  prefectureCenter: [number, number],
  feature: Feature<Geometry, PrefectureProperties>,
  boundaryInfo: { isNearBoundary: boolean; confidence: number }
): [number, number] {
  try {
    const isValidClickPosition = ViewportCalculator.validateClickPosition(
      clickPosition,
      prefectureCenter
    );

    // Additional validation: check if click is within prefecture boundaries
    const clickPoint: Position = [clickPosition[1], clickPosition[0]]; // GeoJSON uses [lng, lat]
    let isWithinPrefecture = booleanPointInPolygon(clickPoint, feature as Feature<MultiPolygon, PrefectureProperties>);

    // For boundary clicks, be more lenient with validation
    if (boundaryInfo.isNearBoundary && !isWithinPrefecture) {
      console.log('Boundary click detected outside prefecture, checking tolerance');

      // For boundary clicks, accept the position if it's reasonably close
      const distance = Math.sqrt(
        Math.pow(clickPosition[0] - prefectureCenter[0], 2) +
        Math.pow(clickPosition[1] - prefectureCenter[1], 2)
      );

      // Allow boundary clicks within 50km of prefecture center
      const boundaryTolerance = 0.5; // degrees (~55km)
      if (distance <= boundaryTolerance && boundaryInfo.confidence > 0.3) {
        isWithinPrefecture = true;
        console.log('Boundary click accepted within tolerance:', { distance, confidence: boundaryInfo.confidence });
      }
    }

    console.log('Enhanced click position validation:', {
      isValidClickPosition,
      isWithinPrefecture,
      clickPosition,
      prefectureCenter,
      isNearBoundary: boundaryInfo.isNearBoundary,
      confidence: boundaryInfo.confidence
    });

    // Use validated click position or fall back to prefecture center
    const finalClickPosition = (isValidClickPosition && (isWithinPrefecture || boundaryInfo.isNearBoundary))
      ? clickPosition
      : prefectureCenter;

    if (finalClickPosition !== clickPosition) {
      console.warn('Click position failed validation, using prefecture center:', {
        original: clickPosition,
        fallback: finalClickPosition,
        reason: !isValidClickPosition ? 'invalid_coordinates' : 'outside_prefecture'
      });
    }

    return finalClickPosition;

  } catch (validationError) {
    console.error('Error validating click position:', validationError);
    return prefectureCenter;
  }
}

/**
 * Determines smart positioning configuration
 */
function determineSmartPositioning(
  prefectureCenter: [number, number],
  finalClickPosition: [number, number],
  viewportBounds: GeoBounds,
  map: MapProjection | null,
  mapState: { zoom: number; size: { x: number; y: number } } | null
): SmartPositionConfig {
  try {
    // Check for very small viewport and prioritize visibility
    const isSmallViewport = mapState && ViewportCalculator.isSmallViewport(mapState.size);

    if (isSmallViewport) {
      console.log('Small viewport detected, prioritizing visibility over exact positioning');

      // For small viewports, always use the position that's most likely to be visible
      const centerInViewport = ViewportCalculator.isPointInViewport(prefectureCenter, viewportBounds);
      const clickInViewport = ViewportCalculator.isPointInViewport(finalClickPosition, viewportBounds);

      // Prioritize visibility: use whichever position is in viewport, prefer center for consistency
      const useClickPosition = !centerInViewport && clickInViewport;

      const positionConfig = {
        prefectureCenter,
        clickPosition: finalClickPosition,
        useClickPosition,
        viewportBounds
      };

      console.log('Small viewport positioning decision:', {
        centerInViewport,
        clickInViewport,
        useClickPosition,
        viewportSize: mapState.size
      });

      return positionConfig;
    } else {
      // Standard smart positioning logic
      return ViewportCalculator.determineSmartPosition(
        prefectureCenter,
        finalClickPosition,
        viewportBounds,
        map || undefined
      );
    }
  } catch (positionError) {
    console.error('Error determining smart position:', positionError);
    // Create fallback position config that always uses prefecture center
    return {
      prefectureCenter,
      clickPosition: prefectureCenter,
      useClickPosition: false,
      viewportBounds: ViewportCalculator.createFallbackBounds(prefectureCenter)
    };
  }
}

/**
 * Sets the selected prefecture with error handling
 */
function setSelectedPrefectureWithErrorHandling(
  prefectureName: string,
  positionConfig: SmartPositionConfig,
  setSelectedPrefecture: (name: string, positionConfig: SmartPositionConfig) => void,
  isPopupOpening: PopupOpeningControl
): void {
  try {
    isPopupOpening.markOpening();
    setSelectedPrefecture(prefectureName, positionConfig);
    console.log('selectedPrefecture set to:', prefectureName, 'with enhanced position config');

    // Reset flag after a short delay
    setTimeout(() => {
      isPopupOpening.markClosed();
    }, 500);
  } catch (setError) {
    console.error('Error setting selected prefecture:', setError);
    // Ensure flag is reset even on error
    isPopupOpening.markClosed();
  }
}

/**
 * Emergency fallback for prefecture selection
 */
function emergencyFallback(
  prefectureName: string,
  prefectureCenter: [number, number],
  setSelectedPrefecture: (name: string, positionConfig: SmartPositionConfig) => void,
  isPopupOpening: PopupOpeningControl
): void {
  try {
    const fallbackConfig: SmartPositionConfig = {
      prefectureCenter,
      clickPosition: prefectureCenter,
      useClickPosition: false,
      viewportBounds: ViewportCalculator.createFallbackBounds(prefectureCenter)
    };

    isPopupOpening.markOpening();
    setSelectedPrefecture(prefectureName, fallbackConfig);
    console.warn('Used emergency fallback for prefecture selection');

    setTimeout(() => {
      isPopupOpening.markClosed();
    }, 500);
  } catch (fallbackError) {
    console.error('Emergency fallback also failed:', fallbackError);
    isPopupOpening.markClosed();
  }
}

/**
 * Main click handler for prefecture interactions
 */
export function handlePrefectureMapClick(
  prefectureName: string,
  feature: Feature<Geometry, PrefectureProperties>,
  clickLatLng: { lat: number; lng: number },
  map: MapProjection,
  japanData: FeatureCollection<MultiPolygon, PrefectureProperties>,
  setSelectedPrefecture: (name: string, positionConfig: SmartPositionConfig) => void,
  isPopupOpening: PopupOpeningControl,
  clickManager: ClickPositionManager = ClickPositionManager.getInstance()
): void {
  try {
    console.log('prefecture clicked:', prefectureName);

    const validatedPrefectureCenter = validatePrefectureCenter(feature.properties.center, feature);

    const { clickPosition, boundaryInfo } = captureClickPosition(
      clickLatLng,
      validatedPrefectureCenter,
      japanData
    );

    const { map: mapInstance, viewportBounds, mapState } = getMapAndViewportInfo(map, validatedPrefectureCenter);

    // Step 4: Handle rapid clicks and state management
    const { finalClickPosition, finalBoundaryInfo } = handleClickState(
      clickManager,
      clickPosition,
      prefectureName,
      boundaryInfo
    );

    // Step 5: Validate final click position
    const validatedClickPosition = validateClickPosition(
      finalClickPosition,
      validatedPrefectureCenter,
      feature,
      finalBoundaryInfo
    );

    // Step 6: Determine smart positioning
    const positionConfig = determineSmartPositioning(
      validatedPrefectureCenter,
      validatedClickPosition,
      viewportBounds,
      mapInstance,
      mapState
    );

    console.log('Enhanced smart position config:', positionConfig);

    // Step 7: Set selected prefecture
    setSelectedPrefectureWithErrorHandling(
      prefectureName,
      positionConfig,
      setSelectedPrefecture,
      isPopupOpening
    );

  } catch (error) {
    console.error('Unexpected error in enhanced prefecture click handler:', error);
    // Emergency fallback
    emergencyFallback(
      prefectureName,
      feature.properties.center,
      setSelectedPrefecture,
      isPopupOpening
    );
  }
}

/** @deprecated Leaflet-only; MapLibre uses `handlePrefectureMapClick` from layer click handlers. */
export const createPrefectureHandlers = () => {
  return () => {
    /* no-op — retained for legacy test imports until mocks are updated */
  };
};