const DEFAULT_URL = 'https://degeocode.benlab.link';
const MAX_POINTS = 1000;

export type DegeocodePoint = { lat: number; lng: number };
export type DegeocodeResult = DegeocodePoint & { country: string | null };

type DegeocodeResponse = {
  results: DegeocodeResult[];
  cached?: boolean;
  cache_key?: string;
};

function getConfig(): { url: string; apiKey: string } | null {
  const apiKey = import.meta.env.VITE_DEGEOCODE_API_KEY?.trim();
  if (!apiKey) return null;
  const url = (import.meta.env.VITE_DEGEOCODE_URL?.trim() || DEFAULT_URL).replace(/\/$/, '');
  return { url, apiKey };
}

async function postCountries(
  url: string,
  apiKey: string,
  points: DegeocodePoint[]
): Promise<DegeocodeResult[]> {
  const res = await fetch(`${url}/v1/countries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ points }),
  });
  if (!res.ok) {
    throw new Error(`degeocode ${res.status}`);
  }
  const data = (await res.json()) as DegeocodeResponse;
  return data.results ?? [];
}

/** Batch reverse-geocode. Returns null countries if API key missing or request fails. */
export async function fetchCountries(points: DegeocodePoint[]): Promise<DegeocodeResult[]> {
  if (points.length === 0) return [];
  const config = getConfig();
  if (!config) {
    return points.map((p) => ({ ...p, country: null }));
  }

  const out: DegeocodeResult[] = [];
  for (let i = 0; i < points.length; i += MAX_POINTS) {
    const chunk = points.slice(i, i + MAX_POINTS);
    const results = await postCountries(config.url, config.apiKey, chunk);
    // shortcut: assume response order matches request; upgrade if API adds id matching
    for (let j = 0; j < chunk.length; j++) {
      out.push(results[j] ?? { ...chunk[j], country: null });
    }
  }
  return out;
}
