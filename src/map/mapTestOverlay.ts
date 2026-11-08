/** Dev-only map overlay flags from `?testOverlay=1` / `?noPrefecture=1`. */
export function isMapTestOverlayEnabled(search: string, dev = import.meta.env.DEV): boolean {
  return dev && new URLSearchParams(search).get('testOverlay') === '1';
}

export function isPrefectureOverlaySkipped(search: string, dev = import.meta.env.DEV): boolean {
  return dev && new URLSearchParams(search).get('noPrefecture') === '1';
}
