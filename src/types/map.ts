export interface PrefectureProperties {
  nam: string;
  nam_ja: string;
  id: number;
  // Add more specific properties here if needed
}

export interface FootageProperties {
  prefecture: string; // calculated from getPrefectureForPoint
  icon: string;
  title: string;
  image: string;
  description?: string;
  tweets: string[];
}
