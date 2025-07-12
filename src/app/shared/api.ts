import { FootageProperties, PrefectureProperties } from '@/types/map';
import type { FeatureCollection, Feature, Point, MultiPolygon, Position } from 'geojson';
import { unzipSync, strFromU8, Unzipped } from 'fflate';
import { DOMParser } from 'xmldom';
import striptags from 'striptags';

function getImageUrlFromFiles(files: Unzipped, iconPath: string) {
  const fileData = files[iconPath];
  if (!fileData) return null;
  const blob = new Blob([fileData], { type: 'image/png' }); // or infer type from extension
  return URL.createObjectURL(blob);
}

export async function getChamaFootage(): Promise<FeatureCollection<Point, FootageProperties>> {
  // 1. Fetch KMZ as ArrayBuffer
  const res = await fetch('https://www.google.com/maps/d/kml?mid=1a45uJ6SzJbC3jBX8C8L2sENgRM1dNUY&lid=sAQuhRAMIVs');
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
  const placemarks = dom.getElementsByTagName('Placemark');
  const features: Feature<Point, FootageProperties>[] = [];
  for (let i = 0; i < placemarks.length; i++) {
    const placemark = placemarks[i];
    const name = placemark.getElementsByTagName('name')[0]?.textContent || '';
    const descriptionRaw = placemark.getElementsByTagName('description')[0]?.textContent || '';
    // Remove <img> tags and strip HTML
    const descriptionNoImg = descriptionRaw.replace(/<img[^>]*>/g, '');
    const descriptionStripped = striptags(descriptionNoImg, undefined, ' ').trim();
    // Extract URLs (tweets)
    const tweets = Array.from(descriptionStripped.matchAll(/https?:\/\/\S+/g)).map((m) => m[0]);
    // remove the URLS
    const description = descriptionStripped.replace(/https?:\/\/\S+/g, '').trim();

    // Image from gx_media_links
    let image = '';
    const dataNodes = placemark.getElementsByTagName('Data');
    for (let j = 0; j < dataNodes.length; j++) {
      if (dataNodes[j].getAttribute('name') === 'gx_media_links') {
        image = dataNodes[j].getElementsByTagName('value')[0]?.textContent || '';
        break;
      }
    }
    // Icon from styleUrl, StyleMap, and Style
    let icon = '';
    const styleUrl = placemark.getElementsByTagName('styleUrl')[0]?.textContent || '';
    let resolvedStyleUrl = styleUrl;
    // If styleUrl points to a StyleMap, resolve to normal style
    if (styleMap[styleUrl]) {
      resolvedStyleUrl = styleMap[styleUrl];
    }
    // Now resolvedStyleUrl should point to a Style, get the icon href
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
        title: name,
        description,
        tweets,
        image,
        icon,
        prefecture: '' // still required by FootageProperties
      }
    });
  }
  return {
    type: 'FeatureCollection',
    features
  };
}

export async function getJapanPrefectures(): Promise<FeatureCollection<MultiPolygon, PrefectureProperties>> {
  const res = await fetch('/data/japan-prefectures.geojson');
  const data = await res.json();
  // set center of each feature
  for (const feature of data.features) {
    const coords =
      feature.geometry.type === 'Polygon'
        ? feature.geometry.coordinates[0]
        : feature.geometry.type === 'MultiPolygon'
        ? feature.geometry.coordinates[0][0]
        : null;
    if (coords && coords.length > 0) {
      // Average the coordinates for a rough center
      const avg = coords.reduce((acc: Position, cur: Position) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]);
      feature.properties.center = [avg[1] / coords.length, avg[0] / coords.length];
    }
  }
  return data;
}
