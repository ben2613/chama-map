/**
 * Fetches the Chama KMZ and compares SHA-256 to .github/last-kmz-sha256.
 * Used by the scheduled GitHub Actions workflow (stdout + GITHUB_OUTPUT).
 */
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHAMA_TRACK_KMZ_URL } from '../src/constants/chamaTrackConstants';

const HASH_FILE = join(process.cwd(), '.github/last-kmz-sha256');

async function main(): Promise<void> {
  const res = await fetch(CHAMA_TRACK_KMZ_URL);
  if (!res.ok) {
    throw new Error(`KMZ fetch failed: ${res.status} ${res.statusText}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const remoteSha256 = createHash('sha256').update(bytes).digest('hex');

  const localSha256 = existsSync(HASH_FILE) ? readFileSync(HASH_FILE, 'utf8').trim() : '';
  const changed = localSha256.length > 0 && remoteSha256 !== localSha256;
  const initialized = localSha256.length > 0;

  const summary = {
    sourceUrl: CHAMA_TRACK_KMZ_URL,
    remoteSha256,
    localSha256: localSha256 || null,
    changed,
    initialized,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `changed=${String(changed)}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `remote_sha256=${remoteSha256}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `initialized=${String(initialized)}\n`);
  }

  if (!initialized) {
    console.warn('No local KMZ baseline; commit .github/last-kmz-sha256 before relying on scheduled checks.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
