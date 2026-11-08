import { GeoBounds, geoBounds } from '@/map/geoBounds';
import { MapProjection } from '@/map/mapProjection';
import { latLng, pixelBounds, point, type LatLng, type PixelBounds, type Point } from '@/map/geoTypes';

/**
 * Interface for viewport information containing bounds, center, zoom, and pixel bounds
 */
export interface ViewportInfo {
  bounds: GeoBounds;
  center: LatLng;
  zoom: number;
  pixelBounds: PixelBounds;
}

/**
 * Interface for popup size dimensions
 */
export interface PopupSize {
  width: number;
  height: number;
}

/**
 * Interface for smart position configuration
 */
export interface SmartPositionConfig {
  prefectureCenter: [number, number];
  clickPosition: [number, number];
  useClickPosition: boolean;
  viewportBounds: GeoBounds;
  adjustedPosition?: [number, number];
}

/**
 * Interface for control bounds information
 */
export interface ControlBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  element: Element;
  position: string; // 'topright', 'bottomright', etc.
}

/**
 * Interface for cache entry with metadata
 */
interface CacheEntry {
  data: ViewportInfo;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Interface for cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

/**
 * ViewportCalculator provides utilities for viewport boundary detection,
 * point containment checking, and position adjustment for popup positioning.
 * Includes enhanced caching mechanism for performance optimization.
 */
export class ViewportCalculator {
  private static cache = new Map<string, CacheEntry>();
  private static readonly CACHE_TTL = 2000; // 2 second cache TTL for better performance
  private static readonly MAX_CACHE_SIZE = 50; // Maximum cache entries
  private static readonly MOBILE_CACHE_TTL = 5000; // Longer TTL for mobile devices
  private static cacheStats: CacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };
  private static lastMapStateHash: string | null = null;

  /**
   * Gets comprehensive viewport information from a Leaflet map instance
   * with enhanced caching for performance optimization
   * @param map - The Leaflet map instance
   * @returns ViewportInfo containing bounds, center, zoom, and pixel bounds
   */
  static getViewportInfo(map: MapProjection): ViewportInfo {
    try {
      const cacheKey = ViewportCalculator.generateCacheKey(map);
      const now = Date.now();
      const isMobile = ViewportCalculator.isMobileDevice(map);
      const cacheTTL = isMobile ? ViewportCalculator.MOBILE_CACHE_TTL : ViewportCalculator.CACHE_TTL;

      // Check cache validity with enhanced logic
      const cacheEntry = ViewportCalculator.cache.get(cacheKey);
      if (cacheEntry && (now - cacheEntry.timestamp) < cacheTTL) {
        // Update access statistics
        cacheEntry.accessCount++;
        cacheEntry.lastAccessed = now;
        ViewportCalculator.cacheStats.hits++;

        return cacheEntry.data;
      }

      // Cache miss - calculate fresh viewport info
      ViewportCalculator.cacheStats.misses++;

      const viewportInfo: ViewportInfo = {
        bounds: map.getBounds(),
        center: map.getCenter(),
        zoom: map.getZoom(),
        pixelBounds: map.getPixelBounds()
      };

      // Validate viewport info before caching
      if (!ViewportCalculator.isValidViewportInfo(viewportInfo)) {
        throw new Error('Invalid viewport information calculated');
      }

      // Store in cache with enhanced metadata
      ViewportCalculator.setCacheEntry(cacheKey, viewportInfo, now);

      // Perform cache maintenance
      ViewportCalculator.maintainCache();

      return viewportInfo;
    } catch (error) {
      console.error('Error calculating viewport information:', error);

      // Return fallback viewport info covering all of Japan
      return ViewportCalculator.getFallbackViewportInfo();
    }
  }

  /**
   * Checks if a geographic point is within the viewport bounds
   * @param point - Geographic coordinates as [lat, lng]
   * @param bounds - Leaflet LatLngBounds object
   * @returns true if point is within bounds, false otherwise
   */
  static isPointInViewport(point: [number, number], bounds: GeoBounds): boolean {
    try {
      // Validate inputs
      if (!Array.isArray(point) || point.length !== 2) {
        console.error('Invalid point provided to isPointInViewport:', point);
        return false;
      }

      if (!bounds || typeof bounds.contains !== 'function') {
        console.error('Invalid bounds provided to isPointInViewport:', bounds);
        return false;
      }

      const [lat, lng] = point;

      // Validate coordinate values
      if (typeof lat !== 'number' || typeof lng !== 'number' ||
        !isFinite(lat) || !isFinite(lng)) {
        console.error('Invalid coordinate values in isPointInViewport:', { lat, lng });
        return false;
      }

      return bounds.contains(latLng(lat, lng));
    } catch (error) {
      console.error('Error checking point in viewport:', error, { point, bounds });
      return false; // Safe fallback - assume point is not in viewport
    }
  }

  /**
   * Adjusts a position to ensure popup visibility within viewport bounds
   * @param position - Geographic coordinates as [lat, lng]
   * @param _bounds - Viewport bounds (reserved for future use)
   * @param popupSize - Popup dimensions in pixels
   * @param map - Leaflet map instance for coordinate conversion
   * @returns Adjusted position coordinates
   */
  static adjustPositionForVisibility(
    position: [number, number],
    _bounds: GeoBounds,
    popupSize: PopupSize,
    map: MapProjection
  ): [number, number] {
    try {
      // Validate inputs
      if (!ViewportCalculator.validatePositionInput(position)) {
        console.error('Invalid position provided to adjustPositionForVisibility:', position);
        return position; // Return original position as fallback
      }

      if (!popupSize || typeof popupSize.width !== 'number' || typeof popupSize.height !== 'number') {
        console.error('Invalid popup size provided to adjustPositionForVisibility:', popupSize);
        return position; // Return original position as fallback
      }

      if (!map || typeof map.latLngToContainerPoint !== 'function') {
        console.error('Invalid map instance provided to adjustPositionForVisibility:', map);
        return position; // Return original position as fallback
      }

      const padding = 20; // pixels
      let adjustedLat = position[0];
      let adjustedLng = position[1];

      // Convert position to pixel coordinates
      const positionPoint = map.latLngToContainerPoint(latLng(position[0], position[1]));

      // Get container size
      const containerSize = map.getSize();

      // Calculate popup bounds in pixels
      const popupLeft = positionPoint.x - popupSize.width / 2;
      const popupRight = positionPoint.x + popupSize.width / 2;
      const popupTop = positionPoint.y - popupSize.height;
      const popupBottom = positionPoint.y;

      // Adjust horizontally if popup extends beyond viewport
      if (popupLeft < padding) {
        const adjustment = padding - popupLeft;
        const adjustedPoint = point(positionPoint.x + adjustment, positionPoint.y);
        const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);
        adjustedLng = adjustedLatLng.lng;
      } else if (popupRight > containerSize.x - padding) {
        const adjustment = popupRight - (containerSize.x - padding);
        const adjustedPoint = point(positionPoint.x - adjustment, positionPoint.y);
        const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);
        adjustedLng = adjustedLatLng.lng;
      }

      // Adjust vertically if popup extends beyond viewport
      if (popupTop < padding) {
        const adjustment = padding - popupTop;
        const adjustedPoint = point(positionPoint.x, positionPoint.y + adjustment);
        const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);
        adjustedLat = adjustedLatLng.lat;
      } else if (popupBottom > containerSize.y - padding) {
        const adjustment = popupBottom - (containerSize.y - padding);
        const adjustedPoint = point(positionPoint.x, positionPoint.y - adjustment);
        const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);
        adjustedLat = adjustedLatLng.lat;
      }

      // Ensure adjusted position is still within map bounds
      const mapBounds = map.getBounds();
      adjustedLat = Math.max(mapBounds.getSouth(), Math.min(mapBounds.getNorth(), adjustedLat));
      adjustedLng = Math.max(mapBounds.getWest(), Math.min(mapBounds.getEast(), adjustedLng));

      // Validate final adjusted position
      const finalPosition: [number, number] = [adjustedLat, adjustedLng];
      if (!ViewportCalculator.validatePositionInput(finalPosition)) {
        console.error('Adjusted position is invalid, returning original:', { original: position, adjusted: finalPosition });
        return position;
      }

      return finalPosition;
    } catch (error) {
      console.error('Error adjusting position for visibility:', error, { position, popupSize });
      return position; // Return original position as fallback
    }
  }

  /**
   * Determines the optimal popup position based on prefecture center visibility
   * with consistent behavior across different map states and enhanced caching
   * @param prefectureCenter - Prefecture center coordinates
   * @param clickPosition - User click coordinates
   * @param viewportBounds - Current viewport bounds
   * @param map - Leaflet map instance for zoom and size information
   * @returns SmartPositionConfig with positioning decision
   */
  static determineSmartPosition(
    prefectureCenter: [number, number],
    clickPosition: [number, number],
    viewportBounds: GeoBounds,
    map?: MapProjection
  ): SmartPositionConfig {
    try {
      // Invalidate cache if map state changed significantly
      if (map) {
        ViewportCalculator.invalidateCacheOnMapStateChange(map);
        ViewportCalculator.optimizeForMobile(map);
      }

      // Validate inputs
      if (!ViewportCalculator.validatePositionInput(prefectureCenter)) {
        console.error('Invalid prefecture center provided to determineSmartPosition:', prefectureCenter);
        throw new Error('Invalid prefecture center coordinates');
      }

      if (!ViewportCalculator.validatePositionInput(clickPosition)) {
        console.error('Invalid click position provided to determineSmartPosition:', clickPosition);
        // Use prefecture center as fallback for click position
        clickPosition = prefectureCenter;
      }

      if (!viewportBounds || typeof viewportBounds.contains !== 'function') {
        console.error('Invalid viewport bounds provided to determineSmartPosition:', viewportBounds);
        // Create fallback bounds that will always contain the prefecture center
        viewportBounds = ViewportCalculator.createFallbackBounds(prefectureCenter);
      }

      // Get map state information for consistent positioning logic
      let mapState: { zoom: number; size: { x: number; y: number } } | null = null;
      if (map && typeof map.getZoom === 'function' && typeof map.getSize === 'function') {
        try {
          mapState = {
            zoom: map.getZoom(),
            size: map.getSize()
          };
        } catch (mapError) {
          console.warn('Could not get map state information:', mapError);
        }
      }

      // Apply positioning consistency logic across map states
      const positioningDecision = ViewportCalculator.determinePositioningWithConsistency(
        prefectureCenter,
        clickPosition,
        viewportBounds,
        mapState
      );

      return {
        prefectureCenter,
        clickPosition,
        useClickPosition: positioningDecision.useClickPosition,
        viewportBounds,
        adjustedPosition: positioningDecision.adjustedPosition
      };
    } catch (error) {
      console.error('Error determining smart position:', error, { prefectureCenter, clickPosition });

      // Return safe fallback configuration that always uses prefecture center
      return {
        prefectureCenter: ViewportCalculator.validatePositionInput(prefectureCenter)
          ? prefectureCenter
          : [35.6762, 139.6503], // Tokyo coordinates as ultimate fallback
        clickPosition: prefectureCenter,
        useClickPosition: false, // Always use prefecture center on error
        viewportBounds: ViewportCalculator.createFallbackBounds(prefectureCenter)
      };
    }
  }

  /**
   * Determines positioning with consistency across different map states
   * @param prefectureCenter - Prefecture center coordinates
   * @param clickPosition - User click coordinates
   * @param viewportBounds - Current viewport bounds
   * @param mapState - Map zoom and size information
   * @returns Positioning decision with consistency logic applied
   */
  private static determinePositioningWithConsistency(
    prefectureCenter: [number, number],
    clickPosition: [number, number],
    viewportBounds: GeoBounds,
    mapState: { zoom: number; size: { x: number; y: number } } | null
  ): { useClickPosition: boolean; adjustedPosition?: [number, number] } {
    // Basic visibility check
    const centerInViewport = ViewportCalculator.isPointInViewport(prefectureCenter, viewportBounds);

    // For very small viewports (mobile devices), prioritize visibility over exact positioning
    if (mapState && ViewportCalculator.isSmallViewport(mapState.size)) {
      console.log('Small viewport detected, prioritizing visibility over exact positioning');

      // On small viewports, always use the position that's most likely to be visible
      // If prefecture center is visible, use it for consistency
      // If not visible, use click position but with more aggressive adjustment
      return {
        useClickPosition: !centerInViewport,
        adjustedPosition: centerInViewport ? prefectureCenter : clickPosition
      };
    }

    // For extreme zoom levels, adapt positioning logic
    if (mapState && ViewportCalculator.isExtremeZoomLevel(mapState.zoom)) {
      console.log('Extreme zoom level detected:', mapState.zoom);

      if (mapState.zoom >= 16) {
        // Very high zoom - prefer click position for precision
        // But validate that click position is reasonable
        const clickDistance = ViewportCalculator.calculateDistance(prefectureCenter, clickPosition);
        const isClickReasonable = clickDistance <= 0.01; // ~1km at high zoom

        return {
          useClickPosition: !centerInViewport && isClickReasonable,
          adjustedPosition: (!centerInViewport && isClickReasonable) ? clickPosition : prefectureCenter
        };
      } else if (mapState.zoom <= 4) {
        // Very low zoom - always prefer prefecture center for consistency
        return {
          useClickPosition: false,
          adjustedPosition: prefectureCenter
        };
      }
    }

    // Standard positioning logic for normal map states
    return {
      useClickPosition: !centerInViewport
    };
  }

  /**
   * Checks if the viewport is considered small (mobile devices)
   * @param size - Viewport size in pixels
   * @returns true if viewport is small
   */
  static isSmallViewport(size: { x: number; y: number }): boolean {
    // Consider viewport small if either dimension is less than 480px
    // or total area is less than 300,000 square pixels
    return size.x < 480 || size.y < 480 || (size.x * size.y) < 300000;
  }

  /**
   * Checks if the zoom level is considered extreme
   * @param zoom - Map zoom level
   * @returns true if zoom level is extreme (very high or very low)
   */
  private static isExtremeZoomLevel(zoom: number): boolean {
    // Consider zoom extreme if it's very high (>= 16) or very low (<= 4)
    return zoom >= 16 || zoom <= 4;
  }

  /**
   * Calculates the distance between two geographic points
   * @param point1 - First point coordinates
   * @param point2 - Second point coordinates
   * @returns Distance in degrees (approximate)
   */
  private static calculateDistance(point1: [number, number], point2: [number, number]): number {
    const [lat1, lng1] = point1;
    const [lat2, lng2] = point2;

    return Math.sqrt(
      Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)
    );
  }

  /**
   * Validates that a click position falls within reasonable bounds
   * @param clickPosition - Click coordinates to validate
   * @param prefectureCenter - Prefecture center for fallback validation
   * @returns true if click position is valid, false otherwise
   */
  static validateClickPosition(
    clickPosition: [number, number],
    prefectureCenter: [number, number]
  ): boolean {
    try {
      // Check if coordinates are valid numbers
      if (!Array.isArray(clickPosition) || clickPosition.length !== 2) {
        console.error('Click position is not a valid array:', clickPosition);
        return false;
      }

      const [lat, lng] = clickPosition;

      // Check for valid latitude and longitude ranges
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        console.error('Click position coordinates are not numbers:', { lat, lng });
        return false;
      }

      if (!isFinite(lat) || !isFinite(lng)) {
        console.error('Click position coordinates are not finite:', { lat, lng });
        return false;
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.error('Click position coordinates are out of valid range:', { lat, lng });
        return false;
      }

      // Validate prefecture center for distance calculation
      if (!ViewportCalculator.validatePositionInput(prefectureCenter)) {
        console.error('Prefecture center is invalid, cannot validate click distance:', prefectureCenter);
        // If prefecture center is invalid, we can't validate distance, but coordinates are valid
        return true;
      }

      // Check if click position is reasonably close to prefecture center
      // This helps catch obviously invalid click positions
      const distance = Math.sqrt(
        Math.pow(lat - prefectureCenter[0], 2) + Math.pow(lng - prefectureCenter[1], 2)
      );

      // Allow clicks within ~100km of prefecture center (rough approximation)
      const maxDistance = 1.0; // degrees (approximately 111km at equator)

      if (distance > maxDistance) {
        console.warn('Click position is far from prefecture center:', {
          clickPosition,
          prefectureCenter,
          distance,
          maxDistance
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating click position:', error, { clickPosition, prefectureCenter });
      return false; // Safe fallback - assume invalid on error
    }
  }

  /**
   * Gets all map control positions and their bounds
   * @param map - Leaflet map instance
   * @returns Array of control bounds information
   */
  static getControlBounds(map: MapProjection): ControlBounds[] {
    const controlContainers = map.getContainer().querySelectorAll('.maplibregl-ctrl, .chama-map-control');
    const mapRect = map.getContainer().getBoundingClientRect();
    const controls: ControlBounds[] = [];

    for (const control of controlContainers) {
      const controlRect = control.getBoundingClientRect();

      // Skip controls that are not visible or have zero dimensions
      if (controlRect.width === 0 || controlRect.height === 0) {
        continue;
      }

      // Convert control position to map container coordinates
      const controlBounds = {
        left: controlRect.left - mapRect.left,
        right: controlRect.right - mapRect.left,
        top: controlRect.top - mapRect.top,
        bottom: controlRect.bottom - mapRect.top,
        element: control,
        position: ViewportCalculator.getControlPosition(control)
      };

      controls.push(controlBounds);
    }

    return controls;
  }

  /**
   * Determines the position of a control element based on its CSS classes
   * @param control - Control DOM element
   * @returns Control position string
   */
  private static getControlPosition(control: Element): string {
    const classList = control.classList;

    // Handle case where classList is not available (e.g., in tests)
    if (!classList || typeof classList.contains !== 'function') {
      return 'unknown';
    }

    const dataPosition = control.getAttribute('data-control-position');
    if (dataPosition) {
      return dataPosition;
    }

    const ctrl = control.closest('.maplibregl-ctrl-top-left, .maplibregl-ctrl-top-right, .maplibregl-ctrl-bottom-left, .maplibregl-ctrl-bottom-right');
    if (ctrl) {
      if (ctrl.classList.contains('maplibregl-ctrl-top-right')) return 'topright';
      if (ctrl.classList.contains('maplibregl-ctrl-bottom-right')) return 'bottomright';
      if (ctrl.classList.contains('maplibregl-ctrl-top-left')) return 'topleft';
      if (ctrl.classList.contains('maplibregl-ctrl-bottom-left')) return 'bottomleft';
    }

    // Legacy Leaflet class names (unit tests)
    if (classList.contains('leaflet-top') && classList.contains('leaflet-right')) {
      return 'topright';
    }
    if (classList.contains('leaflet-bottom') && classList.contains('leaflet-right')) {
      return 'bottomright';
    }
    if (classList.contains('leaflet-top') && classList.contains('leaflet-left')) {
      return 'topleft';
    }
    if (classList.contains('leaflet-bottom') && classList.contains('leaflet-left')) {
      return 'bottomleft';
    }

    const parent = control.parentElement;
    if (parent?.classList) {
      const parentClassList = parent.classList;
      if (parentClassList.contains('leaflet-top') && parentClassList.contains('leaflet-right')) {
        return 'topright';
      }
      if (parentClassList.contains('leaflet-bottom') && parentClassList.contains('leaflet-right')) {
        return 'bottomright';
      }
      if (parentClassList.contains('leaflet-top') && parentClassList.contains('leaflet-left')) {
        return 'topleft';
      }
      if (parentClassList.contains('leaflet-bottom') && parentClassList.contains('leaflet-left')) {
        return 'bottomleft';
      }
    }

    return 'unknown';
  }

  /**
   * Checks if there are existing map controls that might interfere with popup positioning
   * @param map - Leaflet map instance
   * @param position - Proposed popup position in container pixels
   * @param popupSize - Popup dimensions
   * @param padding - Additional padding around controls (default: 10px)
   * @returns true if position would collide with controls, false otherwise
   */
  static checkControlCollision(
    map: MapProjection,
    position: Point,
    popupSize: PopupSize,
    padding: number = 10
  ): boolean {
    const controls = ViewportCalculator.getControlBounds(map);

    // Calculate popup bounds with center-bottom positioning (typical for Leaflet popups)
    const popupBounds = {
      left: position.x - popupSize.width / 2,
      right: position.x + popupSize.width / 2,
      top: position.y - popupSize.height,
      bottom: position.y
    };

    // Check each control for collision with padding
    for (const control of controls) {
      const controlBoundsWithPadding = {
        left: control.left - padding,
        right: control.right + padding,
        top: control.top - padding,
        bottom: control.bottom + padding
      };

      // Check for overlap using standard rectangle intersection test
      if (!(popupBounds.right < controlBoundsWithPadding.left ||
        popupBounds.left > controlBoundsWithPadding.right ||
        popupBounds.bottom < controlBoundsWithPadding.top ||
        popupBounds.top > controlBoundsWithPadding.bottom)) {
        return true; // Collision detected
      }
    }

    return false; // No collision
  }

  /**
   * Finds the best position to avoid control collisions
   * @param map - Leaflet map instance
   * @param originalPosition - Original desired position
   * @param popupSize - Popup dimensions
   * @param padding - Padding around controls
   * @returns Adjusted position that avoids control collisions, or original if no better position found
   */
  static findCollisionFreePosition(
    map: MapProjection,
    originalPosition: [number, number],
    popupSize: PopupSize,
    padding: number = 10
  ): [number, number] {
    const originalPoint = map.latLngToContainerPoint(latLng(originalPosition[0], originalPosition[1]));

    // If no collision, return original position
    if (!ViewportCalculator.checkControlCollision(map, originalPoint, popupSize, padding)) {
      return originalPosition;
    }

    const controls = ViewportCalculator.getControlBounds(map);
    const containerSize = map.getSize();

    // Try different offset strategies
    const offsetStrategies = [
      { x: 0, y: -50 }, // Move up
      { x: -50, y: 0 }, // Move left
      { x: 50, y: 0 },  // Move right
      { x: 0, y: 50 },  // Move down
      { x: -50, y: -50 }, // Move up-left
      { x: 50, y: -50 },  // Move up-right
      { x: -50, y: 50 },  // Move down-left
      { x: 50, y: 50 }    // Move down-right
    ];

    for (const offset of offsetStrategies) {
      const testPoint = point(originalPoint.x + offset.x, originalPoint.y + offset.y);

      // Ensure the test point is within the container bounds
      if (testPoint.x < 0 || testPoint.x > containerSize.x ||
        testPoint.y < 0 || testPoint.y > containerSize.y) {
        continue;
      }

      // Check if this position avoids collisions
      if (!ViewportCalculator.checkControlCollision(map, testPoint, popupSize, padding)) {
        const adjustedLatLng = map.containerPointToLatLng(testPoint);
        return [adjustedLatLng.lat, adjustedLatLng.lng];
      }
    }

    // If no collision-free position found, try to find the position with minimal overlap
    let bestPosition = originalPosition;
    let minOverlapArea = Number.MAX_VALUE;

    for (const offset of offsetStrategies) {
      const testPoint = point(originalPoint.x + offset.x, originalPoint.y + offset.y);

      if (testPoint.x < 0 || testPoint.x > containerSize.x ||
        testPoint.y < 0 || testPoint.y > containerSize.y) {
        continue;
      }

      const overlapArea = ViewportCalculator.calculateOverlapArea(testPoint, popupSize, controls, padding);
      if (overlapArea < minOverlapArea) {
        minOverlapArea = overlapArea;
        const adjustedLatLng = map.containerPointToLatLng(testPoint);
        bestPosition = [adjustedLatLng.lat, adjustedLatLng.lng];
      }
    }

    return bestPosition;
  }

  /**
   * Calculates the total overlap area between popup and controls
   * @param position - Popup position in container pixels
   * @param popupSize - Popup dimensions
   * @param controls - Array of control bounds
   * @param padding - Padding around controls
   * @returns Total overlap area in square pixels
   */
  private static calculateOverlapArea(
    position: Point,
    popupSize: PopupSize,
    controls: ControlBounds[],
    padding: number
  ): number {
    const popupBounds = {
      left: position.x - popupSize.width / 2,
      right: position.x + popupSize.width / 2,
      top: position.y - popupSize.height,
      bottom: position.y
    };

    let totalOverlap = 0;

    for (const control of controls) {
      const controlBoundsWithPadding = {
        left: control.left - padding,
        right: control.right + padding,
        top: control.top - padding,
        bottom: control.bottom + padding
      };

      // Calculate intersection area
      const intersectionLeft = Math.max(popupBounds.left, controlBoundsWithPadding.left);
      const intersectionRight = Math.min(popupBounds.right, controlBoundsWithPadding.right);
      const intersectionTop = Math.max(popupBounds.top, controlBoundsWithPadding.top);
      const intersectionBottom = Math.min(popupBounds.bottom, controlBoundsWithPadding.bottom);

      if (intersectionLeft < intersectionRight && intersectionTop < intersectionBottom) {
        const overlapWidth = intersectionRight - intersectionLeft;
        const overlapHeight = intersectionBottom - intersectionTop;
        totalOverlap += overlapWidth * overlapHeight;
      }
    }

    return totalOverlap;
  }

  /**
   * Adjusts popup position to avoid control collisions while maintaining viewport visibility
   * with enhanced logic for different map states
   * @param position - Original position coordinates
   * @param bounds - Viewport bounds
   * @param popupSize - Popup dimensions
   * @param map - Leaflet map instance
   * @returns Position adjusted for both viewport visibility and control collision avoidance
   */
  static adjustPositionForVisibilityAndControls(
    position: [number, number],
    bounds: GeoBounds,
    popupSize: PopupSize,
    map: MapProjection
  ): [number, number] {
    try {
      // Validate inputs
      if (!ViewportCalculator.validatePositionInput(position)) {
        console.error('Invalid position provided to adjustPositionForVisibilityAndControls:', position);
        return position;
      }

      if (!popupSize || typeof popupSize.width !== 'number' || typeof popupSize.height !== 'number') {
        console.error('Invalid popup size provided to adjustPositionForVisibilityAndControls:', popupSize);
        return position;
      }

      if (!map || typeof map.latLngToContainerPoint !== 'function') {
        console.error('Invalid map instance provided to adjustPositionForVisibilityAndControls:', map);
        return position;
      }

      // Get map state for enhanced positioning logic
      let mapState: { zoom: number; size: { x: number; y: number } } | null = null;
      try {
        mapState = {
          zoom: map.getZoom(),
          size: map.getSize()
        };
      } catch (mapError) {
        console.warn('Could not get map state for enhanced positioning:', mapError);
      }

      // Apply map state-aware position adjustment
      let adjustedPosition = ViewportCalculator.adjustPositionWithMapStateAwareness(
        position,
        bounds,
        popupSize,
        map,
        mapState
      );

      // Then, check for control collisions and adjust if necessary
      const collisionFreePosition = ViewportCalculator.findCollisionFreePosition(
        map,
        adjustedPosition,
        popupSize
      );

      // Ensure the final position is still within viewport bounds
      const finalPosition = ViewportCalculator.adjustPositionForVisibility(
        collisionFreePosition,
        bounds,
        popupSize,
        map
      );

      return finalPosition;
    } catch (error) {
      console.error('Error adjusting position for visibility and controls:', error, { position, popupSize });
      return position; // Return original position as fallback
    }
  }

  /**
   * Adjusts position with awareness of map state (zoom level and viewport size)
   * @param position - Original position coordinates
   * @param bounds - Viewport bounds
   * @param popupSize - Popup dimensions
   * @param map - Leaflet map instance
   * @param mapState - Map zoom and size information
   * @returns Position adjusted for map state
   */
  private static adjustPositionWithMapStateAwareness(
    position: [number, number],
    bounds: GeoBounds,
    popupSize: PopupSize,
    map: MapProjection,
    mapState: { zoom: number; size: { x: number; y: number } } | null
  ): [number, number] {
    // Start with basic visibility adjustment
    let adjustedPosition = ViewportCalculator.adjustPositionForVisibility(
      position,
      bounds,
      popupSize,
      map
    );

    if (!mapState) {
      return adjustedPosition;
    }

    // Handle small viewports with enhanced logic
    if (ViewportCalculator.isSmallViewport(mapState.size)) {
      console.log('Applying small viewport positioning adjustments');

      // For small viewports, use more aggressive centering to ensure visibility
      const containerSize = mapState.size;
      const centerPoint = point(containerSize.x / 2, containerSize.y / 2);

      // Adjust popup size for small viewports if needed
      const adjustedPopupSize = {
        width: Math.min(popupSize.width, containerSize.x * 0.9),
        height: Math.min(popupSize.height, containerSize.y * 0.7)
      };

      // Try to center the popup more aggressively on small screens
      try {
        const centerLatLng = map.containerPointToLatLng(centerPoint);
        const centerPosition: [number, number] = [centerLatLng.lat, centerLatLng.lng];

        // Validate the center position is within bounds
        if (bounds.contains(centerLatLng)) {
          adjustedPosition = ViewportCalculator.adjustPositionForVisibility(
            centerPosition,
            bounds,
            adjustedPopupSize,
            map
          );
        }
      } catch (centerError) {
        console.warn('Could not calculate center position for small viewport:', centerError);
      }
    }

    // Handle extreme zoom levels
    if (ViewportCalculator.isExtremeZoomLevel(mapState.zoom)) {
      console.log('Applying extreme zoom level positioning adjustments for zoom:', mapState.zoom);

      if (mapState.zoom >= 16) {
        // Very high zoom - use minimal adjustment to preserve precision
        const padding = 10; // Reduced padding for high zoom
        adjustedPosition = ViewportCalculator.adjustPositionForVisibilityWithPadding(
          position,
          bounds,
          popupSize,
          map,
          padding
        );
      } else if (mapState.zoom <= 4) {
        // Very low zoom - use more aggressive centering for better visibility
        const padding = 40; // Increased padding for low zoom
        adjustedPosition = ViewportCalculator.adjustPositionForVisibilityWithPadding(
          adjustedPosition,
          bounds,
          popupSize,
          map,
          padding
        );
      }
    }

    return adjustedPosition;
  }

  /**
   * Adjusts position for visibility with custom padding
   * @param position - Original position coordinates
   * @param bounds - Viewport bounds
   * @param popupSize - Popup dimensions
   * @param map - Leaflet map instance
   * @param padding - Custom padding in pixels
   * @returns Position adjusted with custom padding
   */
  private static adjustPositionForVisibilityWithPadding(
    position: [number, number],
    _bounds: GeoBounds,
    popupSize: PopupSize,
    map: MapProjection,
    padding: number
  ): [number, number] {
    try {
      let adjustedLat = position[0];
      let adjustedLng = position[1];

      // Convert position to pixel coordinates
      const positionPoint = map.latLngToContainerPoint(latLng(position[0], position[1]));

      // Get container size
      const containerSize = map.getSize();

      // Calculate popup bounds in pixels
      const popupLeft = positionPoint.x - popupSize.width / 2;
      const popupRight = positionPoint.x + popupSize.width / 2;
      const popupTop = positionPoint.y - popupSize.height;
      const popupBottom = positionPoint.y;

      // Adjust horizontally if popup extends beyond viewport
      if (popupLeft < padding) {
        const adjustment = padding - popupLeft;
        const adjustedPoint = point(positionPoint.x + adjustment, positionPoint.y);
        const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);
        adjustedLng = adjustedLatLng.lng;
      } else if (popupRight > containerSize.x - padding) {
        const adjustment = popupRight - (containerSize.x - padding);
        const adjustedPoint = point(positionPoint.x - adjustment, positionPoint.y);
        const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);
        adjustedLng = adjustedLatLng.lng;
      }

      // Adjust vertically if popup extends beyond viewport
      if (popupTop < padding) {
        const adjustment = padding - popupTop;
        const adjustedPoint = point(positionPoint.x, positionPoint.y + adjustment);
        const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);
        adjustedLat = adjustedLatLng.lat;
      } else if (popupBottom > containerSize.y - padding) {
        const adjustment = popupBottom - (containerSize.y - padding);
        const adjustedPoint = point(positionPoint.x, positionPoint.y - adjustment);
        const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);
        adjustedLat = adjustedLatLng.lat;
      }

      // Ensure adjusted position is still within map bounds
      const mapBounds = map.getBounds();
      adjustedLat = Math.max(mapBounds.getSouth(), Math.min(mapBounds.getNorth(), adjustedLat));
      adjustedLng = Math.max(mapBounds.getWest(), Math.min(mapBounds.getEast(), adjustedLng));

      return [adjustedLat, adjustedLng];
    } catch (error) {
      console.error('Error adjusting position with custom padding:', error);
      return position;
    }
  }

  /**
   * Clears the viewport calculation cache
   * Should be called when map state changes significantly
   * @param selective - If true, only clear entries older than TTL
   */
  static clearCache(selective: boolean = false): void {
    if (selective) {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, entry] of ViewportCalculator.cache.entries()) {
        const age = now - entry.timestamp;
        const isMobile = ViewportCalculator.isMobileFromCacheKey(key);
        const ttl = isMobile ? ViewportCalculator.MOBILE_CACHE_TTL : ViewportCalculator.CACHE_TTL;

        if (age > ttl) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => {
        ViewportCalculator.cache.delete(key);
        ViewportCalculator.cacheStats.evictions++;
      });
    } else {
      ViewportCalculator.cache.clear();
      ViewportCalculator.cacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };
    }

    ViewportCalculator.cacheStats.size = ViewportCalculator.cache.size;
    ViewportCalculator.lastMapStateHash = null;
  }

  /**
   * Invalidates cache when map state changes significantly
   * @param map - The Leaflet map instance
   */
  static invalidateCacheOnMapStateChange(map: MapProjection): void {
    try {
      const currentMapStateHash = ViewportCalculator.generateMapStateHash(map);

      if (ViewportCalculator.lastMapStateHash &&
        ViewportCalculator.lastMapStateHash !== currentMapStateHash) {
        // Map state has changed significantly, clear cache
        ViewportCalculator.clearCache(true); // Selective clear
        console.log('Cache invalidated due to map state change');
      }

      ViewportCalculator.lastMapStateHash = currentMapStateHash;
    } catch (error) {
      console.error('Error invalidating cache on map state change:', error);
      // Clear cache as a safety measure
      ViewportCalculator.clearCache(true);
    }
  }

  /**
   * Gets cache statistics for performance monitoring
   * @returns Cache statistics object
   */
  static getCacheStats(): CacheStats {
    return { ...ViewportCalculator.cacheStats, size: ViewportCalculator.cache.size };
  }

  /**
   * Sets up automatic cache invalidation for map events
   * Should be called when initializing map components
   * @param map - Leaflet map instance
   * @returns Cleanup function to remove event listeners
   */
  static setupAutomaticCacheInvalidation(map: MapProjection): () => void {
    const invalidateCache = () => {
      ViewportCalculator.invalidateCacheOnMapStateChange(map);
    };

    const optimizeCache = () => {
      ViewportCalculator.optimizeForMobile(map);
    };

    // Set up event listeners for map state changes
    map.on('zoomend', invalidateCache);
    map.on('moveend', invalidateCache);
    map.on('resize', invalidateCache);

    // Optimize cache periodically for mobile devices
    const optimizationInterval = setInterval(optimizeCache, 30000); // Every 30 seconds

    // Return cleanup function
    return () => {
      map.off('zoomend', invalidateCache);
      map.off('moveend', invalidateCache);
      map.off('resize', invalidateCache);
      clearInterval(optimizationInterval);
    };
  }

  /**
   * Preloads cache with common viewport calculations for better performance
   * @param map - Leaflet map instance
   * @param commonPositions - Array of common positions to preload
   */
  static preloadCache(map: MapProjection, commonPositions?: [number, number][]): void {
    try {
      // Preload current viewport
      ViewportCalculator.getViewportInfo(map);

      // Preload common positions if provided
      if (commonPositions && commonPositions.length > 0) {
        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();

        commonPositions.forEach(position => {
          try {
            // Temporarily set map view to preload position
            map.setView(position, currentZoom, { animate: false });
            ViewportCalculator.getViewportInfo(map);
          } catch (error) {
            console.warn('Error preloading cache for position:', position, error);
          }
        });

        // Restore original view
        map.setView([currentCenter.lat, currentCenter.lng], currentZoom, { animate: false });
      }
    } catch (error) {
      console.error('Error preloading cache:', error);
    }
  }

  /**
   * Optimizes cache for mobile devices by adjusting TTL and size limits
   * @param map - The Leaflet map instance
   */
  static optimizeForMobile(map: MapProjection): void {
    if (ViewportCalculator.isMobileDevice(map)) {
      // For mobile devices, be more aggressive about cache cleanup
      // to preserve memory
      if (ViewportCalculator.cache.size > 20) {
        ViewportCalculator.evictLeastRecentlyUsed(10);
      }
    }
  }

  /**
   * Generates a cache key based on map state with enhanced precision
   * @param map - Leaflet map instance
   * @returns Cache key string
   */
  private static generateCacheKey(map: MapProjection): string {
    try {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const size = map.getSize();
      const isMobile = ViewportCalculator.isMobileDevice(map);

      // Include mobile flag in cache key for different TTL handling
      return `${center.lat.toFixed(6)}_${center.lng.toFixed(6)}_${zoom}_${size.x}_${size.y}_${isMobile ? 'mobile' : 'desktop'}`;
    } catch (error) {
      console.error('Error generating cache key:', error);
      // Return a fallback cache key based on timestamp to avoid cache issues
      return `fallback_${Date.now()}`;
    }
  }

  /**
   * Generates a hash for map state to detect significant changes
   * @param map - Leaflet map instance
   * @returns Map state hash string
   */
  private static generateMapStateHash(map: MapProjection): string {
    try {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const size = map.getSize();

      // Create a hash that changes when map state changes significantly
      // Use lower precision for center to avoid cache invalidation on minor movements
      return `${center.lat.toFixed(4)}_${center.lng.toFixed(4)}_${Math.floor(zoom)}_${Math.floor(size.x / 100)}_${Math.floor(size.y / 100)}`;
    } catch (error) {
      console.error('Error generating map state hash:', error);
      return `error_${Date.now()}`;
    }
  }

  /**
   * Determines if the device is mobile based on map size and user agent
   * @param map - Leaflet map instance
   * @returns true if mobile device
   */
  private static isMobileDevice(map: MapProjection): boolean {
    try {
      const size = map.getSize();
      const isMobileSize = size.x <= 768 || size.y <= 768;

      // Check user agent if available
      const isMobileUserAgent = typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      return isMobileSize || isMobileUserAgent;
    } catch (error) {
      console.error('Error detecting mobile device:', error);
      return false; // Default to desktop behavior
    }
  }

  /**
   * Determines if cache key is for mobile device
   * @param cacheKey - Cache key string
   * @returns true if mobile cache key
   */
  private static isMobileFromCacheKey(cacheKey: string): boolean {
    return cacheKey.endsWith('_mobile');
  }

  /**
   * Sets a cache entry with enhanced metadata
   * @param key - Cache key
   * @param data - Viewport info data
   * @param timestamp - Current timestamp
   */
  private static setCacheEntry(key: string, data: ViewportInfo, timestamp: number): void {
    const entry: CacheEntry = {
      data,
      timestamp,
      accessCount: 1,
      lastAccessed: timestamp
    };

    ViewportCalculator.cache.set(key, entry);
    ViewportCalculator.cacheStats.size = ViewportCalculator.cache.size;
  }

  /**
   * Maintains cache by removing old or excess entries
   */
  private static maintainCache(): void {
    const now = Date.now();

    // Remove expired entries
    const keysToDelete: string[] = [];
    for (const [key, entry] of ViewportCalculator.cache.entries()) {
      const age = now - entry.timestamp;
      const isMobile = ViewportCalculator.isMobileFromCacheKey(key);
      const ttl = isMobile ? ViewportCalculator.MOBILE_CACHE_TTL : ViewportCalculator.CACHE_TTL;

      if (age > ttl * 2) { // Remove entries that are significantly old
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      ViewportCalculator.cache.delete(key);
      ViewportCalculator.cacheStats.evictions++;
    });

    // If cache is still too large, remove least recently used entries
    if (ViewportCalculator.cache.size > ViewportCalculator.MAX_CACHE_SIZE) {
      const excessCount = ViewportCalculator.cache.size - ViewportCalculator.MAX_CACHE_SIZE;
      ViewportCalculator.evictLeastRecentlyUsed(excessCount);
    }

    ViewportCalculator.cacheStats.size = ViewportCalculator.cache.size;
  }

  /**
   * Evicts least recently used cache entries
   * @param count - Number of entries to evict
   */
  private static evictLeastRecentlyUsed(count: number): void {
    const entries = Array.from(ViewportCalculator.cache.entries());

    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove the oldest entries
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      ViewportCalculator.cache.delete(entries[i][0]);
      ViewportCalculator.cacheStats.evictions++;
    }

    ViewportCalculator.cacheStats.size = ViewportCalculator.cache.size;
  }

  /**
   * Validates that viewport information is complete and valid
   * @param viewportInfo - Viewport information to validate
   * @returns true if valid, false otherwise
   */
  private static isValidViewportInfo(viewportInfo: ViewportInfo): boolean {
    try {
      if (!viewportInfo) return false;

      // Check bounds
      if (!viewportInfo.bounds || typeof viewportInfo.bounds.contains !== 'function') {
        return false;
      }

      // Check center
      if (!viewportInfo.center ||
        typeof viewportInfo.center.lat !== 'number' ||
        typeof viewportInfo.center.lng !== 'number') {
        return false;
      }

      // Check zoom
      if (typeof viewportInfo.zoom !== 'number' || !isFinite(viewportInfo.zoom)) {
        return false;
      }

      // Check pixel bounds
      if (!viewportInfo.pixelBounds) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating viewport info:', error);
      return false;
    }
  }

  /**
   * Creates fallback viewport information covering all of Japan
   * @returns Fallback ViewportInfo
   */
  private static getFallbackViewportInfo(): ViewportInfo {
    // Japan bounding box coordinates
    const japanBounds = geoBounds(
      [24.0, 123.0], // Southwest corner
      [46.0, 146.0]  // Northeast corner
    );

    return {
      bounds: japanBounds,
      center: latLng(35.6762, 139.6503), // Tokyo coordinates
      zoom: 6, // Reasonable zoom level for Japan
      pixelBounds: pixelBounds(point(0, 0), point(800, 600)) // Default pixel bounds
    };
  }

  /**
   * Validates position input coordinates
   * @param position - Position coordinates to validate
   * @returns true if valid, false otherwise
   */
  private static validatePositionInput(position: [number, number]): boolean {
    if (!Array.isArray(position) || position.length !== 2) {
      return false;
    }

    const [lat, lng] = position;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return false;
    }

    if (!isFinite(lat) || !isFinite(lng)) {
      return false;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }

    return true;
  }

  /**
   * Creates fallback bounds that contain the given position
   * @param position - Position to center the bounds around
   * @returns Fallback LatLngBounds
   */
  static createFallbackBounds(position: [number, number]): GeoBounds {
    try {
      const [lat, lng] = ViewportCalculator.validatePositionInput(position)
        ? position
        : [35.6762, 139.6503]; // Tokyo as ultimate fallback

      // Create bounds with ~50km radius around the position
      const offset = 0.5; // degrees (approximately 55km at equator)

      return geoBounds(
        [lat - offset, lng - offset], // Southwest
        [lat + offset, lng + offset]  // Northeast
      );
    } catch (error) {
      console.error('Error creating fallback bounds:', error);
      // Return Japan-wide bounds as ultimate fallback
      return geoBounds([24.0, 123.0], [46.0, 146.0]);
    }
  }

  /**
   * Applies map state-specific adjustments for extreme cases
   * @param adjustedPosition - Position already adjusted for visibility and controls
   * @param originalPosition - Original position before adjustments
   * @param mapState - Map zoom and size information
   * @param viewportBounds - Current viewport bounds
   * @returns Position with map state-specific adjustments applied
   */
  static applyMapStateSpecificAdjustments(
    adjustedPosition: [number, number],
    originalPosition: [number, number],
    mapState: { zoom: number; size: { x: number; y: number } },
    viewportBounds: GeoBounds
  ): [number, number] {
    try {
      let finalPosition = adjustedPosition;

      // Handle very small viewports with special logic
      if (ViewportCalculator.isSmallViewport(mapState.size)) {
        console.log('Applying small viewport specific adjustments');

        // For very small viewports, ensure the position is well within bounds
        // to account for limited screen real estate
        const bounds = viewportBounds;
        const center = bounds.getCenter();
        const centerCoords: [number, number] = [center.lat, center.lng];

        // If the adjusted position is too close to edges, move it more toward center
        const distanceFromCenter = ViewportCalculator.calculateDistance(adjustedPosition, centerCoords);
        const maxDistanceFromCenter = 0.1; // Degrees - keep popup closer to center on small screens

        if (distanceFromCenter > maxDistanceFromCenter) {
          // Move position closer to viewport center
          const ratio = maxDistanceFromCenter / distanceFromCenter;
          finalPosition = [
            centerCoords[0] + (adjustedPosition[0] - centerCoords[0]) * ratio,
            centerCoords[1] + (adjustedPosition[1] - centerCoords[1]) * ratio
          ];
          console.log('Moved position closer to center for small viewport:', finalPosition);
        }
      }

      // Handle extreme zoom levels with specific logic
      if (ViewportCalculator.isExtremeZoomLevel(mapState.zoom)) {
        if (mapState.zoom >= 16) {
          // Very high zoom - preserve original position if it was reasonable
          const distanceFromOriginal = ViewportCalculator.calculateDistance(adjustedPosition, originalPosition);

          // If adjustment moved the position too far from original, try to keep it closer
          if (distanceFromOriginal > 0.005) { // ~500m at high zoom
            console.log('High zoom: keeping position closer to original click');

            // Use a weighted average favoring the original position
            finalPosition = [
              originalPosition[0] * 0.7 + adjustedPosition[0] * 0.3,
              originalPosition[1] * 0.7 + adjustedPosition[1] * 0.3
            ];
          }
        } else if (mapState.zoom <= 4) {
          // Very low zoom - ensure position is well-centered for visibility
          const bounds = viewportBounds;
          const center = bounds.getCenter();
          const centerCoords: [number, number] = [center.lat, center.lng];

          // At low zoom, prefer positions closer to viewport center
          const distanceFromCenter = ViewportCalculator.calculateDistance(finalPosition, centerCoords);
          const maxDistanceFromCenter = 2.0; // Degrees - allow more distance at low zoom

          if (distanceFromCenter > maxDistanceFromCenter) {
            const ratio = maxDistanceFromCenter / distanceFromCenter;
            finalPosition = [
              centerCoords[0] + (finalPosition[0] - centerCoords[0]) * ratio,
              centerCoords[1] + (finalPosition[1] - centerCoords[1]) * ratio
            ];
            console.log('Low zoom: adjusted position for better visibility:', finalPosition);
          }
        }
      }

      // Validate final position
      if (!ViewportCalculator.validatePositionInput(finalPosition)) {
        console.warn('Map state adjustments produced invalid position, reverting to adjusted position');
        return adjustedPosition;
      }

      return finalPosition;
    } catch (error) {
      console.error('Error applying map state specific adjustments:', error);
      return adjustedPosition; // Return the input position as fallback
    }
  }
}