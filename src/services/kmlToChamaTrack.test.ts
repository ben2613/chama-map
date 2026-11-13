import { describe, expect, it } from 'vitest';
import { normalizeYoutubeLink, youtubeThumbnailUrl } from './kmlToChamaTrack';

describe('kmlToChamaTrack helpers', () => {
  it('normalizes youtube watch links', () => {
    expect(normalizeYoutubeLink('https://www.youtube.com/watch?v=abc123&list=foo')).toBe(
      'https://www.youtube.com/watch?v=abc123'
    );
  });

  it('normalizes youtube shorts', () => {
    expect(normalizeYoutubeLink('https://www.youtube.com/shorts/xyz789')).toBe(
      'https://www.youtube.com/watch?v=xyz789'
    );
  });

  it('builds youtube thumbnail URLs', () => {
    expect(youtubeThumbnailUrl('https://www.youtube.com/watch?v=abc123')).toBe(
      'https://img.youtube.com/vi/abc123/0.jpg'
    );
  });
});
