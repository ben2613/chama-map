import { FootageProperties } from "@/types/map";
import type { FeatureCollection, Point } from 'geojson';

export async function getChamaFootage() :Promise<FeatureCollection<Point, FootageProperties>> {
  const res = await fetch('/data/chama-footage.geojson');
  const data = await res.json();
  return data;
}