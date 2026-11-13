import type { FeatureCollection, Point, MultiPolygon } from 'geojson';
import type { PrefectureProperties, TrackProperties } from '@/types/map';
import { CHAMA_TRACK_KMZ_URL } from '@/constants/chamaTrackConstants';
import { parseKmzBytesToChamaTrack } from '@/services/kmlToChamaTrack';
import type { Unzipped } from 'fflate';

function blobIconResolver(files: Unzipped, iconPathInKmz: string): string {
  const fileData = files[iconPathInKmz];
  if (!fileData) return '';
  const blob = new Blob([new Uint8Array(fileData)], { type: 'image/png' });
  return URL.createObjectURL(blob);
}

async function loadChamaTrackFromKmz(): Promise<FeatureCollection<Point, TrackProperties>> {
  const res = await fetch(CHAMA_TRACK_KMZ_URL);
  if (!res.ok) {
    throw new Error(`KMZ fetch failed: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return parseKmzBytesToChamaTrack(new Uint8Array(arrayBuffer), blobIconResolver);
}

async function loadChamaTrackFromBundle(): Promise<FeatureCollection<Point, TrackProperties> | null> {
  const base = import.meta.env.BASE_URL;
  const metaUrl = `${base}data/track-meta.json`;
  const trackUrl = `${base}data/chama-track.geojson`;

  let cacheBuster = '';
  try {
    const metaRes = await fetch(metaUrl);
    if (metaRes.ok) {
      const meta = (await metaRes.json()) as { contentHash?: string };
      if (meta.contentHash) {
        cacheBuster = `?v=${meta.contentHash.slice(0, 12)}`;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const res = await fetch(`${trackUrl}${cacheBuster}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getChamaTrack(): Promise<FeatureCollection<Point, TrackProperties>> {
  const bundled = await loadChamaTrackFromBundle();
  if (bundled) return bundled;

  const allowLive =
    import.meta.env.DEV ||
    import.meta.env.VITE_USE_LIVE_KMZ === 'true';

  if (allowLive) {
    return loadChamaTrackFromKmz();
  }

  throw new Error(
    'Bundled chama track data is missing. Run "npm run ingest:track" locally or deploy via CI.'
  );
}

export async function getJapanPrefectures(): Promise<FeatureCollection<MultiPolygon, PrefectureProperties>> {
  const base = import.meta.env.BASE_URL;
  return fetch(`${base}data/japan-prefectures.geojson?v=1.0.2`).then((res) => res.json());
}
