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

export interface Confidence {
  text: string;
  tone: ConfidenceTone;
}

/**
 * 去重到「每张基底只留最好 offset」之后的候选，供低/中可信度时让用户二选一。
 *
 * 实测 82 张样张：判错的 3 张里，正确答案**全部排第 2**，且该结论与打分权重
 * 无关（扫过 outOfBounds 惩罚系数 0~1000，Top-2 命中率恒为 100%）。所以展示
 * 前两名比调参更值得做。
 */
export interface RankedCandidate {
  mapId: string;
  offset: { dr: number; dc: number };
  score: number;
  /** 相对第一名落后的比例；第一名为 0 */
  gapToBest: number;
  /** 该候选自身的匹配质量（格子命中率与连线命中率的均值），供 UI 展示为百分比 */
  matchPercent: number;
  /** 按该候选自己的 offset 修正后的节点，选中它时用这一套填入 */
  correctedNodes: CorrectedNode[];
}

export interface RecognizeResult {
  zone: string;
  mapId: string;
  /** best 与「最高分的、地图不同的候选」的分差占比，反映本次匹配有无歧义 */
  marginRatio: number | null;
  hasAnchor: boolean;
  confidence: Confidence;
  candidates: MatchCandidate[];
  /** 每张基底只留最好 offset，按分数降序，最多 3 项 */
  topCandidates: RankedCandidate[];
  best: MatchCandidate;
  gridNodes: GridNode[];
  correctedNodes: CorrectedNode[];
  /** 网格填充密度过低 —— 截图很可能没覆盖完整地图，识别结果不可靠 */
  lowDensity: boolean;
  /** 后端本次实际使用的 OCR 策略（账号 × 接口），仅用于诊断 */
  strategy?: { account: string; action: string };
  /** 诊断用：检出的文字节点数与空白过路点数 */
  stats: { labels: number; blanks: number; occupiedRatio: number };
}
