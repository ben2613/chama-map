import { TrackProperties, PrefectureProperties } from '@/types/map';
import type { FeatureCollection, Feature, Point, MultiPolygon } from 'geojson';
import { unzipSync, strFromU8, Unzipped } from 'fflate';
import { DOMParser } from '@xmldom/xmldom';
import striptags from 'striptags';

function getImageUrlFromFiles(files: Unzipped, iconPath: string) {
  const fileData = files[iconPath];
  if (!fileData) return null;
  const blob = new Blob([fileData], { type: 'image/png' }); // or infer type from extension
  return URL.createObjectURL(blob);
}

export async function getChamaTrack(): Promise<FeatureCollection<Point, TrackProperties>> {
  // 1. Fetch KMZ as ArrayBuffer
  const res = await fetch('https://www.google.com/maps/d/kml?mid=1a45uJ6SzJbC3jBX8C8L2sENgRM1dNUY');
  const arrayBuffer = await res.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  // 2. Unzip KMZ in memory
  const files = unzipSync(uint8);

  // 3. Find and parse doc.kml
  const kmlFile = files['doc.kml'];
  if (!kmlFile) throw new Error('doc.kml not found in KMZ');
  const kmlText = strFromU8(kmlFile);

  // 4. Parse KML to DOM
  const dom = new DOMParser().parseFromString(kmlText, 'text/xml');

  // 5. Parse Style and StyleMap
  // Build a map of style id -> icon href
  const styleMap: Record<string, string> = {};
  const iconHrefMap: Record<string, string> = {};

  // Parse <Style> tags
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

  // Parse <StyleMap> tags
  const styleMapNodes = dom.getElementsByTagName('StyleMap');
  for (let i = 0; i < styleMapNodes.length; i++) {
    const styleMapNode = styleMapNodes[i];
    const id = styleMapNode.getAttribute('id');
    if (!id) continue;
    // Find the Pair with <key>normal</key>
    const pairNodes = styleMapNode.getElementsByTagName('Pair');
    for (let j = 0; j < pairNodes.length; j++) {
      const pair = pairNodes[j];
      const keyNode = pair.getElementsByTagName('key')[0];
      if (keyNode && keyNode.textContent === 'normal') {
        const styleUrlNode = pair.getElementsByTagName('styleUrl')[0];
        if (styleUrlNode && styleUrlNode.textContent) {
          // Map #id to the normal styleUrl (e.g. #icon-1534-FF5252 -> #icon-1534-FF5252-normal)
          styleMap[`#${id}`] = styleUrlNode.textContent;
        }
      }
    }
  }

  // 6. Convert KML Placemarks to GeoJSON features
  const features: Feature<Point, TrackProperties>[] = [];

  // Iterate over Folders; each Folder's name is the layerName
  const folderNodes = dom.getElementsByTagName('Folder');
  for (let fi = 0; fi < folderNodes.length; fi++) {
    const folder = folderNodes[fi];
    const layerName = folder.getElementsByTagName('name')[0]?.textContent?.trim() || '';
    const placemarks = folder.getElementsByTagName('Placemark');

    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];

      // Display name handling
      const outerName = placemark.getElementsByTagName('name')[0]?.textContent?.trim() || '';

      // ExtendedData map
      const dataNodes = placemark.getElementsByTagName('Data');
      const dataMap: Record<string, string> = {};
      for (let j = 0; j < dataNodes.length; j++) {
        const key = dataNodes[j].getAttribute('name') || '';
        const valueNode = dataNodes[j].getElementsByTagName('value')[0];
        const value = valueNode?.textContent ?? '';
        dataMap[key] = value;
      }

      // Name/NameJp logic:
      // - If ExtendedData has both name and name_jp, the folder uses "name" as display field.
      //   Save as: name = ExtendedData.name, nameJp = ExtendedData.name_jp.
      // - Otherwise, outer <name> is actually Japanese display: nameJp = outerName, name = ExtendedData.name (if any).
      let name = '';
      let nameJp = '';
      if (dataMap['name'] && dataMap['name_jp']) {
        name = dataMap['name'];
        nameJp = dataMap['name_jp'];
      } else {
        nameJp = outerName;
        name = dataMap['name'] || '';
      }

      // Descriptions from ExtendedData only
      let description = dataMap['description'] ? striptags(dataMap['description'], undefined, ' ').trim() : '';
      let descriptionJp = dataMap['description_jp'] ? striptags(dataMap['description_jp'], undefined, ' ').trim() : '';
      const linksFromDescription = Array.from(`${description} ${descriptionJp}`.matchAll(/https?:\/\/\S+/g)).map(
        (m) => m[0]
      );

      // remove links from description
      description = description.replace(/https?:\/\/\S+/g, '').trim();
      descriptionJp = descriptionJp.replace(/https?:\/\/\S+/g, '').trim();

      // Links: space-separated URLs in ExtendedData
      const linksRaw = dataMap['links'] || '';
      let links = linksRaw
        .split(/\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      // merge and deduplicate
      links = [...new Set([...links, ...linksFromDescription])];

      // Image from gx_media_links
      let images: string[] = [];
      if (dataMap['gx_media_links']) {
        images = dataMap['gx_media_links'].split(' ').filter(Boolean);
      }
      // get youtube links from links, including shorts
      const youtubeLinks = links
        .filter((link) => link.includes('youtube.com') || link.includes('youtu.be'))
        .map((link) => {
          try {
            const url = new URL(link);
            if (url.hostname.includes('youtube.com')) {
              // Handle /watch?v=, /shorts/, and other paths
              if (url.pathname.startsWith('/watch')) {
                const v = url.searchParams.get('v');
                if (v) {
                  return `https://www.youtube.com/watch?v=${v}`;
                }
              } else if (url.pathname.startsWith('/shorts/')) {
                // /shorts/VIDEOID
                const videoId = url.pathname.split('/')[2];
                if (videoId) {
                  return `https://www.youtube.com/watch?v=${videoId}`;
                }
              }
            } else if (url.hostname.includes('youtu.be')) {
              // youtu.be short link, keep only the path (video id)
              const videoId = url.pathname.replace('/', '');
              if (videoId) {
                return `https://youtu.be/${videoId}`;
              }
            }
            // fallback: return original link
            return link;
          } catch {
            // fallback: return original link if URL parsing fails
            return link;
          }
        });
      // grab thumbnail from youtube links (handles watch, youtu.be, and shorts)
      const youtubeThumbnails = youtubeLinks
        .map((link) => {
          let videoId = '';
          if (link.includes('v=')) {
            videoId = link.split('v=')[1].split('&')[0];
          } else if (link.includes('youtu.be/')) {
            videoId = link.split('youtu.be/')[1].split(/[?&]/)[0];
          }
          return videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : '';
        })
        .filter(Boolean);
      images = [...images, ...youtubeThumbnails];

      // grab twitter embed image with fxembed (handle twitter.com and x.com)
      const twitterLinks = links.filter((link) => link.includes('twitter.com') || link.includes('x.com'));
      const twitterImages = twitterLinks.map((link) => {
        const url = new URL(link);
        // replace host with https://d.fxtwitter.com
        return `https://d.fxtwitter.com${url.pathname}`;
      });
      images = [...images, ...twitterImages];

      // Icon from styleUrl, StyleMap, and Style
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
        icon = getImageUrlFromFiles(files, icon) || '';
      }

      // Coordinates
      const coordsText = placemark.getElementsByTagName('coordinates')[0]?.textContent || '';
      const coords = coordsText.split(',').map(Number); // [lng, lat, alt]
      if (coords.length < 2) continue;

      // Build GeoJSON feature
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [coords[0], coords[1]]
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
          prefecture: ''
        }
      });
    }
  }
  return {
    type: 'FeatureCollection',
    features
  };
}

export async function getJapanPrefectures(): Promise<FeatureCollection<MultiPolygon, PrefectureProperties>> {
  return fetch('data/japan-prefectures.geojson').then((res) => res.json());
}
