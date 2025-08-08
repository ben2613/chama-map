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
  title: string;
  images: string[];
  description?: string;
  tweets: string[];
}
