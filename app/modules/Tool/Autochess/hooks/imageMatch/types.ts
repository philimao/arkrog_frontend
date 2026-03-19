export type MatchAlgorithm =
  | "ncc"
  | "jsfeat-ncc"
  | "edge-ncc"
  | "chamfer";

export type MatchStep =
  | "idle"
  | "downloading"
  | "preprocessing"
  | "matching"
  | "done"
  | "failed";

export interface MatchProgress {
  step: MatchStep;
  message: string;
  current: number;
  total: number;
}

export interface TemplateScore {
  templateName: string;
  templateUrl: string;
  algorithm: MatchAlgorithm;
  score: number;
  bestScale?: number | null;
}

export interface MatchResultPayload {
  scores: TemplateScore[];
  scaleScores?: ScaleScoreEntry[];
  scaleDebug?: ScaleDebugInfo;
}

export interface ScaleScoreEntry {
  algorithm: MatchAlgorithm;
  scale: number;
  templateName: string;
  score: number;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface AlgorithmTopMatchItem {
  templateName: string;
  score: number;
}

export interface AlgorithmTopMatches {
  algorithm: MatchAlgorithm;
  topMatches: AlgorithmTopMatchItem[];
  marginTop1Top2: number | null;
}

export interface ScaleDebugInfo {
  baseline: "height";
  referenceSceneHeight: number;
  sceneWidth: number;
  sceneHeight: number;
  minScale: number;
  maxScale: number;
  stepFactor: number;
  scaleCount: number;
  previewScales: number[];
  coarseStep?: number;
  refineStep?: number;
  coarseScaleCount?: number;
  refineScaleCount?: number;
  coarsePeakScale?: number;
  coarsePeakTopScore?: number;
  refinePeakScale?: number;
  refinePeakTopScore?: number;
  coarseTurningStopped?: boolean;
  refineTurningStopped?: boolean;
  turningScoreThreshold?: number;
  refineRangeMin?: number;
  refineRangeMax?: number;
}

export interface TemplateDebugItem {
  templateName: string;
  templateUrl: string;
  previewUrl?: string;
  status: "success" | "failed";
  width?: number;
  height?: number;
  size?: number;
  error?: string;
}
