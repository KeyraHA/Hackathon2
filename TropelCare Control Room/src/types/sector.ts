
export interface Sector {
  id: string;
  name: string;
  description?: string;
  chaosIndex?: number;
  tropelCount?: number;
}

export interface StoryMetric {
  label: string;
  value: string | number;
}

export interface StoryVisual {
  kind: "image" | "gradient" | "icon";
  value: string;
  accentColor?: string;
}

export interface StoryStage {
  id: string;
  order: number;
  title: string;
  body: string;
  visual: StoryVisual;
  metrics: StoryMetric[];
}

export interface SectorStory {
  sectorId: string;
  sectorName: string;
  summary?: string;
  stages: StoryStage[];
}
