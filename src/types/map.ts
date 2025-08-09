export interface PrefectureProperties {
  nam: string;
  nam_ja: string;
  id: number;
  // Add more specific properties here if needed
  center: [number, number];
}

export interface TrackProperties {
  prefecture: string; // calculated from getPrefectureForPoint
  icon: string;
  /** @deprecated */
  title: string;
  /** New metadata parsed from KML */
  layerName: string; // Folder name containing the Placemark
  name: string; // English or display name
  nameJp: string; // Japanese name
  images: string[];
  description?: string; // from ExtendedData
  descriptionJp?: string; // from ExtendedData
  links: string[]; // space-separated URLs from ExtendedData
  tweets: string[];
}
