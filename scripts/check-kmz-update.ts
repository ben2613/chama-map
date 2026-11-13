/**
 * Fetches the Chama KMZ and compares SHA-256 to LAST_KMZ_SHA256 (repo variable in CI).
 * Used by the scheduled GitHub Actions workflow (stdout + GITHUB_OUTPUT).
 */
import { createHash } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { CHAMA_TRACK_KMZ_URL } from '../src/constants/chamaTrackConstants';

async function main(): Promise<void> {
  const res = await fetch(CHAMA_TRACK_KMZ_URL);
  if (!res.ok) {
    throw new Error(`KMZ fetch failed: ${res.status} ${res.statusText}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const remoteSha256 = createHash('sha256').update(bytes).digest('hex');

  const localSha256 = (process.env.LAST_KMZ_SHA256 ?? '').trim();
  const initialized = localSha256.length > 0;
  /** Deploy when baseline is missing or Google KMZ bytes changed. */
  const changed = !initialized || remoteSha256 !== localSha256;

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
    console.warn('No LAST_KMZ_SHA256 repository variable; deploy recommended to initialize baseline.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
