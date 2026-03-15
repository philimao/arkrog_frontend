export type MatchAlgorithm = "ncc" | "edge-ncc" | "chamfer";

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
}

export interface MatchResultPayload {
  scores: TemplateScore[];
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
