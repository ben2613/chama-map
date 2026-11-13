import type { Feature, FeatureCollection, Point } from 'geojson';
import type { Unzipped } from 'fflate';
import { unzipSync, strFromU8 } from 'fflate';
import { DOMParser } from '@xmldom/xmldom';
import striptags from 'striptags';
import type { TrackProperties } from '@/types/map';

export type KmzIconResolver = (files: Unzipped, iconPathInKmz: string) => string;

export function parseKmzBytesToChamaTrack(
  kmzBytes: Uint8Array,
  resolveIcon: KmzIconResolver
): FeatureCollection<Point, TrackProperties> {
  const files = unzipSync(kmzBytes);
  const kmlFile = files['doc.kml'];
  if (!kmlFile) throw new Error('doc.kml not found in KMZ');
  const kmlText = strFromU8(kmlFile);
  return parseKmlTextToChamaTrack(kmlText, files, resolveIcon);
}

export function parseKmlTextToChamaTrack(
  kmlText: string,
  kmzFiles: Unzipped,
  resolveIcon: KmzIconResolver
): FeatureCollection<Point, TrackProperties> {
  const dom = new DOMParser().parseFromString(kmlText, 'text/xml');

  const styleMap: Record<string, string> = {};
  const iconHrefMap: Record<string, string> = {};

  const styleNodes = dom.getElementsByTagName('Style');
  for (let i = 0; i < styleNodes.length; i++) {
    const style = styleNodes[i];
    const id = style.getAttribute('id');
    if (!id) continue;
    const iconNode = style.getElementsByTagName('Icon')[0];
    if (iconNode) {
      const hrefNode = iconNode.getElementsByTagName('href')[0];
      if (hrefNode && hrefNode.textContent) {
        iconHrefMap[`#${id}`] = hrefNode.textContent;
      }
    }
  }

  const styleMapNodes = dom.getElementsByTagName('StyleMap');
  for (let i = 0; i < styleMapNodes.length; i++) {
    const styleMapNode = styleMapNodes[i];
    const id = styleMapNode.getAttribute('id');
    if (!id) continue;
    const pairNodes = styleMapNode.getElementsByTagName('Pair');
    for (let j = 0; j < pairNodes.length; j++) {
      const pair = pairNodes[j];
      const keyNode = pair.getElementsByTagName('key')[0];
      if (keyNode && keyNode.textContent === 'normal') {
        const styleUrlNode = pair.getElementsByTagName('styleUrl')[0];
        if (styleUrlNode && styleUrlNode.textContent) {
          styleMap[`#${id}`] = styleUrlNode.textContent;
        }
      }
    }
  }

  const features: Feature<Point, TrackProperties>[] = [];
  const folderNodes = dom.getElementsByTagName('Folder');

  for (let fi = 0; fi < folderNodes.length; fi++) {
    const folder = folderNodes[fi];
    const layerName = folder.getElementsByTagName('name')[0]?.textContent?.trim() || '';
    const placemarks = folder.getElementsByTagName('Placemark');

    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      const outerName = placemark.getElementsByTagName('name')[0]?.textContent?.trim() || '';

      const dataNodes = placemark.getElementsByTagName('Data');
      const dataMap: Record<string, string> = {};
      for (let j = 0; j < dataNodes.length; j++) {
        const key = dataNodes[j].getAttribute('name') || '';
        const valueNode = dataNodes[j].getElementsByTagName('value')[0];
        const value = valueNode?.textContent ?? '';
        dataMap[key] = value;
      }

      let name: string;
      let nameJp: string;
      if (dataMap['name'] && dataMap['name_jp']) {
        name = dataMap['name'];
        nameJp = dataMap['name_jp'];
      } else {
        nameJp = outerName;
        name = dataMap['name'] || '';
      }

      let description = dataMap['description'] ? striptags(dataMap['description'], undefined, ' ').trim() : '';
      let descriptionJp = dataMap['description_jp'] ? striptags(dataMap['description_jp'], undefined, ' ').trim() : '';
      const linksFromDescription = Array.from(`${description} ${descriptionJp}`.matchAll(/https?:\/\/\S+/g)).map(
        (m) => m[0]
      );

      description = description.replace(/https?:\/\/\S+/g, '').trim();
      descriptionJp = descriptionJp.replace(/https?:\/\/\S+/g, '').trim();

      const linksRaw = dataMap['links'] || '';
      let links = linksRaw
        .split(/\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      links = [...new Set([...links, ...linksFromDescription])];

      let images: string[] = [];
      if (dataMap['gx_media_links']) {
        images = dataMap['gx_media_links'].split(' ').filter(Boolean);
      }

      const youtubeLinks = links
        .filter((link) => link.includes('youtube.com') || link.includes('youtu.be'))
        .map((link) => normalizeYoutubeLink(link));

      const youtubeThumbnails = youtubeLinks
        .map((link) => youtubeThumbnailUrl(link))
        .filter(Boolean) as string[];
      images = [...images, ...youtubeThumbnails];

      const twitterLinks = links.filter((link) => link.includes('twitter.com') || link.includes('x.com'));
      const twitterImages = twitterLinks.map((link) => {
        const url = new URL(link);
        return `https://d.fxtwitter.com${url.pathname}`;
      });
      images = [...images, ...twitterImages];

      let icon = '';
      const styleUrl = placemark.getElementsByTagName('styleUrl')[0]?.textContent || '';
      let resolvedStyleUrl = styleUrl;
      if (styleMap[styleUrl]) {
        resolvedStyleUrl = styleMap[styleUrl];
      }
      if (iconHrefMap[resolvedStyleUrl]) {
        icon = iconHrefMap[resolvedStyleUrl];
      }
      if (icon) {
        icon = resolveIcon(kmzFiles, icon) || '';
      }

      const coordsText = placemark.getElementsByTagName('coordinates')[0]?.textContent || '';
      const coords = coordsText.split(',').map(Number);
      if (coords.length < 2) continue;

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [coords[0], coords[1]],
        },
        properties: {
          title: outerName,
          layerName,
          name,
          nameJp,
          description,
          descriptionJp,
          links,
          images,
          icon,
          prefecture: '',
        },
      });
    }
  }

  return { type: 'FeatureCollection', features };
}

export function normalizeYoutubeLink(link: string): string {
  try {
    const url = new URL(link);
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/watch')) {
        const v = url.searchParams.get('v');
        if (v) return `https://www.youtube.com/watch?v=${v}`;
      } else if (url.pathname.startsWith('/shorts/')) {
        const videoId = url.pathname.split('/')[2];
        if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
      }
    } else if (url.hostname.includes('youtu.be')) {
      const videoId = url.pathname.replace('/', '');
      if (videoId) return `https://youtu.be/${videoId}`;
    }
    return link;
  } catch {
    return link;
  }
}

export function youtubeThumbnailUrl(link: string): string {
  let videoId = '';
  if (link.includes('v=')) {
    videoId = link.split('v=')[1].split('&')[0];
  } else if (link.includes('youtu.be/')) {
    videoId = link.split('youtu.be/')[1].split(/[?&]/)[0];
  }
  return videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : '';
}

/** Resolve pin/marker icon paths for bundled track assets (no leading slash; Vite BASE_URL applied at runtime). */
export function resolveTrackAssetUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http:') || path.startsWith('https:') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const base = import.meta.env.BASE_URL;
  const normalized = path.replace(/^\//, '');
  return `${base}${normalized}`;
}
