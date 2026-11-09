import type { FeatureCollection, MultiPolygon, Position } from 'geojson';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { PrefectureProperties } from '@/types/map';
import {
  PLATEAU_XING_LOD1_BY_PREFECTURE,
  XING_PLATEAU_DATA_BASE,
} from '@/constants/plateau3dConstants';
import { getPrefectureForPoint } from '@/utils/mapPrefectureUtils';

/** 3D Tiles region: [west, south, east, north, minH, maxH] in radians (lon/lat). */
export function tilesetRegionContainsPoint(region: number[], lng: number, lat: number): boolean {
  if (region.length < 4) return false;
  const [west, south, east, north] = region;
  const lngRad = (lng * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  return lngRad >= west && lngRad <= east && latRad >= south && latRad <= north;
}

function tilesetUrlFromFolder(folder: string): string {
  return `${XING_PLATEAU_DATA_BASE}/${folder}/tileset.json`;
}

function getPrefectureIdAtPoint(
  point: Position,
  japanData: FeatureCollection<MultiPolygon, PrefectureProperties>
): number | null {
  for (const feature of japanData.features) {
    if (booleanPointInPolygon(point, feature)) {
      return feature.properties.id;
    }
  }
  const name = getPrefectureForPoint(point, japanData);
  const match = japanData.features.find((f) => f.properties.nam === name);
  return match?.properties.id ?? null;
}

const pathsByPrefId = new Map<number, string[]>();

async function listLod1FolderPaths(prefId: number): Promise<string[]> {
  const cached = pathsByPrefId.get(prefId);
  if (cached) return cached;

  const prefix = `xing/${String(prefId).padStart(2, '0')}`;
  const folders: string[] = [];
  let continuation: string | undefined;

  for (let page = 0; page < 8; page++) {
    const url = new URL('https://data.source.coop/smartmaps/');
    url.searchParams.set('list-type', '2');
    url.searchParams.set('prefix', prefix);
    url.searchParams.set('max-keys', '1000');
    if (continuation) url.searchParams.set('continuation-token', continuation);

    const xml = await fetch(url).then((r) => r.text());
    const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1]);
    for (const key of keys) {
      if (key.includes('op_bldg') && key.endsWith('_lod1/tileset.json')) {
        folders.push(key.slice('xing/'.length).replace(/\/tileset\.json$/, ''));
      }
    }

    const truncated = xml.includes('<IsTruncated>true</IsTruncated>');
    const tokenMatch = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
    if (!truncated || !tokenMatch) break;
    continuation = tokenMatch[1];
  }

  const unique = [...new Set(folders)];
  pathsByPrefId.set(prefId, unique);
  return unique;
}

async function pickFolderForPoint(
  folders: string[],
  lng: number,
  lat: number
): Promise<string | null> {
  if (!folders.length) return null;

  let bestFolder: string | null = null;
  let bestDist = Infinity;

  await Promise.all(
    folders.map(async (folder) => {
      try {
        const tileset = await fetch(tilesetUrlFromFolder(folder)).then((r) => r.json());
        const region = tileset?.root?.boundingVolume?.region as number[] | undefined;
        if (!region) return;
        if (tilesetRegionContainsPoint(region, lng, lat)) {
          bestFolder = folder;
          bestDist = 0;
          return;
        }
        const west = region[0];
        const south = region[1];
        const east = region[2];
        const north = region[3];
        const cLng = (((west + east) / 2) * 180) / Math.PI;
        const cLat = (((south + north) / 2) * 180) / Math.PI;
        const dist = (cLng - lng) ** 2 + (cLat - lat) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          bestFolder = folder;
        }
      } catch {
        /* skip bad tilesets */
      }
    })
  );

  return bestFolder;
}

export async function resolvePlateauXingTilesetUrl(
  coordinates: [number, number],
  japanData: FeatureCollection<MultiPolygon, PrefectureProperties>
): Promise<string | null> {
  const [lng, lat] = coordinates;
  const prefId = getPrefectureIdAtPoint(coordinates, japanData);
  if (prefId == null) return null;

  try {
    const folders = await listLod1FolderPaths(prefId);
    const folder = await pickFolderForPoint(folders, lng, lat);
    if (folder) return tilesetUrlFromFolder(folder);
  } catch {
    /* fall through to static fallback */
  }

  const prefName = getPrefectureForPoint(coordinates, japanData);
  return prefName ? PLATEAU_XING_LOD1_BY_PREFECTURE[prefName] ?? null : null;
}
