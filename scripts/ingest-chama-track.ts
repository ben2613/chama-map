/**
 * Fetches the Chama My Maps KMZ, writes public/data/chama-track.geojson,
 * track-meta.json, and vendored marker icons. Run at build time (CI or local).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Unzipped } from 'fflate';
import { CHAMA_TRACK_KMZ_URL, CHAMA_TRACK_SCHEMA_VERSION } from '../src/constants/chamaTrackConstants';
import { parseKmzBytesToChamaTrack } from '../src/services/kmlToChamaTrack';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const dataDir = join(repoRoot, 'public', 'data');
const iconsDir = join(dataDir, 'track-icons');

function sha256Hex(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

function iconFileName(iconPathInKmz: string): string {
  const ext = extname(iconPathInKmz) || '.png';
  const hash = createHash('sha256').update(iconPathInKmz).digest('hex').slice(0, 20);
  return `${hash}${ext}`;
}

function writeIconFromKmz(files: Unzipped, iconPathInKmz: string): string {
  const fileData = files[iconPathInKmz];
  if (!fileData) return '';
  const fileName = iconFileName(iconPathInKmz);
  const outPath = join(iconsDir, fileName);
  writeFileSync(outPath, fileData);
  return `data/track-icons/${fileName}`;
}

async function main(): Promise<void> {
  console.log('Fetching KMZ from', CHAMA_TRACK_KMZ_URL);
  const res = await fetch(CHAMA_TRACK_KMZ_URL);
  if (!res.ok) {
    throw new Error(`KMZ fetch failed: ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const kmzBytes = new Uint8Array(arrayBuffer);
  const kmzSha256 = sha256Hex(kmzBytes);

  mkdirSync(dataDir, { recursive: true });
  if (existsSync(iconsDir)) {
    rmSync(iconsDir, { recursive: true, force: true });
  }
  mkdirSync(iconsDir, { recursive: true });

  const collection = parseKmzBytesToChamaTrack(kmzBytes, writeIconFromKmz);
  const geojsonText = JSON.stringify(collection);
  const contentHash = sha256Hex(geojsonText);

  const meta = {
    schemaVersion: CHAMA_TRACK_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    sourceUrl: CHAMA_TRACK_KMZ_URL,
    kmzSha256,
    contentHash,
    featureCount: collection.features.length,
  };

  writeFileSync(join(dataDir, 'chama-track.geojson'), geojsonText, 'utf8');
  writeFileSync(join(dataDir, 'track-meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${collection.features.length} features (contentHash ${contentHash.slice(0, 12)}…)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
