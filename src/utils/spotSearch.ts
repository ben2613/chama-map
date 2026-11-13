import type { Feature, FeatureCollection, Point } from 'geojson';
import type { TrackProperties } from '@/types/map';
import { getGroupingKeyForFeature } from '@/utils/groupTrackFeatures';
import { OVERSEAS_PREFECTURE } from '@/utils/mapPrefectureUtils';

export interface SpotSearchResult {
  popupId: string;
  feature: Feature<Point, TrackProperties>;
  nameEn: string;
  nameJa: string;
  prefecture: string;
  prefectureJa?: string;
}

function normalizeForSearch(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function displayName(props: TrackProperties): { en: string; ja: string } {
  return {
    en: (props.name || props.title || '').trim(),
    ja: (props.nameJp || props.name || props.title || '').trim(),
  };
}

function scoreMatch(queryNorm: string, candidate: string): number {
  const candNorm = normalizeForSearch(candidate);
  if (!candNorm) return 0;
  if (candNorm === queryNorm) return 100;
  if (candNorm.startsWith(queryNorm)) return 80;
  if (candNorm.includes(queryNorm)) return 60;
  const tokens = queryNorm.split(' ').filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => candNorm.includes(t))) return 50;
  return 0;
}

/**
 * Build deduplicated search rows (one per map marker group).
 */
export function buildSpotSearchIndex(
  chamaTrack: FeatureCollection<Point, TrackProperties>,
  precision = 6
): SpotSearchResult[] {
  const seen = new Set<string>();
  const results: SpotSearchResult[] = [];

  for (const feature of chamaTrack.features) {
    if (feature.geometry.type !== 'Point') continue;
    const popupId = getGroupingKeyForFeature(feature, precision);
    if (seen.has(popupId)) continue;
    seen.add(popupId);
    const { en, ja } = displayName(feature.properties);
    if (!en && !ja) continue;
    results.push({
      popupId,
      feature,
      nameEn: en,
      nameJa: ja,
      prefecture: feature.properties.prefecture,
    });
  }

  return results.sort((a, b) => {
    const aLabel = a.nameEn || a.nameJa;
    const bLabel = b.nameEn || b.nameJa;
    return aLabel.localeCompare(bLabel, undefined, { sensitivity: 'base' });
  });
}

export function searchSpots(
  index: SpotSearchResult[],
  query: string,
  opts?: {
    prefectureJaByEn?: Record<string, string>;
    maxResults?: number;
  }
): SpotSearchResult[] {
  const q = normalizeForSearch(query);
  if (q.length < 1) return [];

  const max = opts?.maxResults ?? 12;
  const prefectureJa = opts?.prefectureJaByEn ?? {};

  const scored: { item: SpotSearchResult; score: number }[] = [];

  for (const item of index) {
    const prefJa = prefectureJa[item.prefecture] ?? '';
    const prefLabel =
      item.prefecture === OVERSEAS_PREFECTURE ? item.prefecture : item.prefecture;

    const scores = [
      scoreMatch(q, item.nameEn),
      scoreMatch(q, item.nameJa),
      scoreMatch(q, prefLabel),
      scoreMatch(q, prefJa),
      scoreMatch(q, item.feature.properties.layerName ?? ''),
    ];

    const best = Math.max(...scores);
    if (best > 0) {
      scored.push({ item: { ...item, prefectureJa: prefJa || undefined }, score: best });
    }
  }

  scored.sort((a, b) => b.score - a.score || (a.item.nameEn || a.item.nameJa).localeCompare(b.item.nameEn || b.item.nameJa));

  return scored.slice(0, max).map((s) => s.item);
}
