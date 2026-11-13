export const DEFAULT_DEGEOCODE_URL = 'https://degeocode.benlab.link';
const MAX_POINTS = 1000;

export type DegeocodePoint = { lat: number; lng: number };
export type DegeocodeResult = DegeocodePoint & { country: string | null };

export type DegeocodeConfig = {
  url: string;
  apiKey: string;
};

type DegeocodeResponse = {
  results: DegeocodeResult[];
  cached?: boolean;
  cache_key?: string;
};

async function postCountries(
  config: DegeocodeConfig,
  points: DegeocodePoint[]
): Promise<DegeocodeResult[]> {
  const baseUrl = config.url.replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/v1/countries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
    },
    body: JSON.stringify({ points }),
  });
  if (!res.ok) {
    throw new Error(`degeocode ${res.status}`);
  }
  const data = (await res.json()) as DegeocodeResponse;
  return data.results ?? [];
}

/** Batch reverse-geocode for build-time ingest (Node) or tests. */
export async function fetchCountries(
  points: DegeocodePoint[],
  config: DegeocodeConfig
): Promise<DegeocodeResult[]> {
  if (points.length === 0) return [];

  const out: DegeocodeResult[] = [];
  for (let i = 0; i < points.length; i += MAX_POINTS) {
    const chunk = points.slice(i, i + MAX_POINTS);
    const results = await postCountries(config, chunk);
    for (let j = 0; j < chunk.length; j++) {
      out.push(results[j] ?? { ...chunk[j], country: null });
    }
  }
  return out;
}
