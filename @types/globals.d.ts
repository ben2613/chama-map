/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

// Global type definitions
declare global {
  // Node.js globals
  namespace NodeJS {
    interface Timeout {
      [Symbol.toPrimitive](): number;
    }
    interface Timer {
      [Symbol.toPrimitive](): number;
    }
  }

  // Browser geolocation API
  interface PositionOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }

  interface GeolocationPosition {
    coords: GeolocationCoordinates;
    timestamp: number;
  }

  interface GeolocationCoordinates {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  }

  interface GeolocationPositionError {
    code: number;
    message: string;
    PERMISSION_DENIED: 1;
    POSITION_UNAVAILABLE: 2;
    TIMEOUT: 3;
  }

  interface Geolocation {
    getCurrentPosition(
      successCallback: (position: GeolocationPosition) => void,
      errorCallback?: (error: GeolocationPositionError) => void,
      options?: PositionOptions
    ): void;
    watchPosition(
      successCallback: (position: GeolocationPosition) => void,
      errorCallback?: (error: GeolocationPositionError) => void,
      options?: PositionOptions
    ): number;
    clearWatch(watchId: number): void;
  }

  // Permissions API
  type PermissionState = 'granted' | 'denied' | 'prompt';

  interface PermissionStatus {
    state: PermissionState;
    onchange: ((this: PermissionStatus, ev: Event) => unknown) | null;
  }

  interface Permissions {
    query(permissionDesc: { name: string }): Promise<PermissionStatus>;
  }

  interface Navigator {
    geolocation: Geolocation;
    permissions: Permissions;
  }

  // Vitest globals
  declare const vi: typeof import('vitest').vi;
  declare const describe: typeof import('vitest').describe;
  declare const it: typeof import('vitest').it;
  declare const test: typeof import('vitest').test;
  declare const expect: typeof import('vitest').expect;
  declare const beforeEach: typeof import('vitest').beforeEach;
  declare const afterEach: typeof import('vitest').afterEach;
  declare const beforeAll: typeof import('vitest').beforeAll;
  declare const afterAll: typeof import('vitest').afterAll;
}

export { };