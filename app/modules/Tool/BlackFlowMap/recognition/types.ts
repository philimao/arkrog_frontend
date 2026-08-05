/** 后端 OCR 代理返回的单段文本（已裁剪，只保留下游需要的字段） */
export interface OcrItem {
  /** 识别文本，已去空白 */
  t: string;
  /** 外接矩形左上角与宽高（坐标系为压缩后的图片） */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 匹配到词表的节点：标签 + 像素中心 */
export interface NodeLabel {
  label: string;
  cx: number;
  cy: number;
  /** 该段的单字宽度，用作这张图的尺度单位 */
  charWidth: number;
}

/** 吸附到网格后的节点；label 为 null 表示空白过路点 */
export interface GridNode {
  row: number;
  col: number;
  label: string | null;
}

export interface Axis {
  firstCenter: number;
  unitPitch: number;
}

export interface ScoreResult {
  anchorScore: number;
  anchorTotal: number;
  cellHits: number;
  cellTotal: number;
  edgeHits: number;
  edgeTotal: number;
  outOfBounds: number;
}

export interface MatchCandidate extends ScoreResult {
  mapId: string;
  offset: { dr: number; dc: number };
}

export interface CorrectedNode {
  row: number;
  col: number;
  label: string | null;
  /** 该点原本不落在候选地图的真实格子上，被吸附到了最近的合法格子 */
  corrected: boolean;
  /** 附近也找不到合法格子 */
  unresolved?: boolean;
}

export type ConfidenceTone = "high" | "medium" | "low" | "none";

export interface RecognizeResult {
  zone: string;
  mapId: string;
  /** best 与「最高分的、地图不同的候选」的分差占比，反映本次匹配有无歧义 */
  marginRatio: number | null;
  hasAnchor: boolean;
  candidates: MatchCandidate[];
  best: MatchCandidate;
  gridNodes: GridNode[];
  correctedNodes: CorrectedNode[];
  /** 诊断用：检出的文字节点数与空白过路点数 */
  stats: { labels: number; blanks: number; occupiedRatio: number };
}
