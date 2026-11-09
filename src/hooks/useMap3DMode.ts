import { useCallback, useState } from 'react';
import { MAP_3D_STORAGE_KEY } from '@/constants/plateau3dConstants';

function readStored3DMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MAP_3D_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function useMap3DMode() {
  const [mode3d, setMode3d] = useState(readStored3DMode);

  const toggleMode3d = useCallback(() => {
    setMode3d((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(MAP_3D_STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore quota / private mode */
      }
      return next;
    });
  }, []);

  return { mode3d, setMode3d, toggleMode3d };
}
