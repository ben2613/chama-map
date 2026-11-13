import { createHash } from 'node:crypto';
import { zipSync, strToU8 } from 'fflate';
import { describe, expect, it } from 'vitest';
import { kmzPayloadSha256 } from './kmzPayloadHash';

describe('kmzPayloadSha256', () => {
  it('ignores ZIP local-header DOS mtime', () => {
    const files = {
      'doc.kml': strToU8('<kml/>'),
      'images/icon-1.png': new Uint8Array([1, 2, 3]),
    };
    const a = Buffer.from(zipSync(files));
    const b = Buffer.from(a);
    // Local file header DOS time is at offset 10 (after PK\x03\x04 + ver + flags + method).
    b.writeUInt16LE((a.readUInt16LE(10) + 1) & 0xffff, 10);

    expect(createHash('sha256').update(a).digest('hex')).not.toBe(
      createHash('sha256').update(b).digest('hex')
    );
    expect(kmzPayloadSha256(a)).toBe(kmzPayloadSha256(b));
  });
});
