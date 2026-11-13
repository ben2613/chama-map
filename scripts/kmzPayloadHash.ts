import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';

/** SHA-256 of sorted KMZ entry names + uncompressed bytes (ignores ZIP mtime stamps). */
export function kmzPayloadSha256(kmzBytes: Uint8Array): string {
  const files = unzipSync(kmzBytes);
  const h = createHash('sha256');
  for (const name of Object.keys(files).sort()) {
    h.update(name);
    h.update('\0');
    h.update(files[name]);
  }
  return h.digest('hex');
}
