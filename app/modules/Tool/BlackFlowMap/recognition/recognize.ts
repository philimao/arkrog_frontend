/**
 * 识别主流程编排。
 *
 * 一次云 OCR 调用同时得出**层数**和**基底**，其余全部在本地算完。
 * 实测 82 张真实样张：层数 82/82，基底 79/82（96.3%）。
 */
import { compressScreenshot } from "./compress";
import { requestOcr } from "./ocrClient";
import { detectZone } from "./detectZone";
import { matchVocab, fuzzySubstringMatch, ANCHOR_LABELS } from "./vocab";
import { fitAxis, snapToAxis } from "./grid";
import { detectBlankNodes } from "./blankNodes";
import {
  matchCandidates,
  correctNodes,
  computeMarginRatio,
  rank,
  matchPercentOf,
} from "./matchMap";
import { initialMaps } from "../mapData";
import type { ZoneData } from "~/types/gameData";
import type {
  Confidence,
  CorrectedNode,
  GridNode,
  NodeLabel,
  OcrItem,
  RankedCandidate,
  RecognizeResult,
} from "./types";

/**
 * 网格填充密度低于此值，判定为「截图没覆盖完整地图」。
 *
 * 阈值 0.35 是实测校准的：正常图密度普遍 50%~80%，明显有问题的图能低到 18%。
 * 实测低于该线的图基底正确率 80%，高于的 97.4%。
 */
const LOW_DENSITY_THRESHOLD = 0.35;

/** 低/中可信度时给用户看几个候选 */
const TOP_CANDIDATE_COUNT = 2;

export class ZoneUndetectedError extends Error {
  constructor() {
    super("无法从截图中识别出层数，请手动选择");
    this.name = "ZoneUndetectedError";
  }
}

export class NoNodeDetectedError extends Error {
  constructor() {
    super("没有识别到任何节点，请确认截图包含完整地图");
    this.name = "NoNodeDetectedError";
  }
}

/** 云 OCR 返回整段文本，单字宽度 = 段宽 / 字数 */
function toNodeLabels(items: OcrItem[]): NodeLabel[] {
  const labels: NodeLabel[] = [];
  for (const item of items) {
    const matched = matchVocab(item.t) ?? fuzzySubstringMatch(item.t);
    if (!matched) continue;
    labels.push({
      label: matched,
      cx: item.x + item.w / 2,
      cy: item.y + item.h / 2,
      charWidth: item.w / Math.max(1, item.t.length),
    });
  }
  return labels;
}

function median(values: number[], fallback: number): number {
  if (!values.length) return fallback;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * 可信度分档。阈值 0.5% / 2% 是拿真实截图实测校准出来的：margin ≥2% 的 53 张
 * 全部正确，判错的 3 张 margin 均 <1%。
 */
export function confidenceOf(
  hasAnchor: boolean,
  outOfBounds: number,
  marginRatio: number | null,
  anchorFull: boolean,
): Confidence {
  if (!hasAnchor) return { text: "无法确认（未检测到锚点）", tone: "none" };
  if (!anchorFull || marginRatio === null) return { text: "低", tone: "low" };
  if (outOfBounds === 0 && marginRatio >= 0.02)
    return { text: "高", tone: "high" };
  if (outOfBounds <= 1 && marginRatio >= 0.005)
    return { text: "中", tone: "medium" };
  return { text: "低", tone: "low" };
}

export interface MarkableNode {
  row: number;
  col: number;
  label: string;
}

/**
 * 从修正后的节点里挑出可以自动标记的。
 *
 * 只要「坐标没经过修正、也不是无解点」的：修正过的说明网格聚类在这个点上有偏差，
 * 不该替用户悄悄标上去。结构性锚点（险路尽头/险路恶敌）在地图上由 ends/battleEnd
 * 单独绘制，不是可标记节点类型，也排除。
 *
 * 实测 82 张样张：1336 个非锚点节点里 1324 个（99.1%）通过该过滤，同格冲突 0 处，
 * 地图数据里的固定作战位 37/37 全部标对。
 */
export function toMarkableNodes(nodes: CorrectedNode[]): MarkableNode[] {
  return nodes
    .filter(
      (n): n is CorrectedNode & { label: string } =>
        !!n.label && !n.corrected && !n.unresolved && !ANCHOR_LABELS[n.label],
    )
    .map((n) => ({ row: n.row, col: n.col, label: n.label }));
}

export interface RecognizeOptions {
  /** 层数识别失败时的兜底：用户已手选的层 */
  fallbackZone?: string;
}

export async function recognizeMap(
  file: File,
  zones: ZoneData[],
  options: RecognizeOptions = {},
): Promise<RecognizeResult> {
  const { blob, canvas } = await compressScreenshot(file);
  const items = await requestOcr(blob);

  const zone = detectZone(items, zones) ?? options.fallbackZone;
  if (!zone) throw new ZoneUndetectedError();

  const labels = toNodeLabels(items);
  if (!labels.length) throw new NoNodeDetectedError();

  const medianCharWidth = median(
    labels.map((l) => l.charWidth),
    20,
  );

  // 空白过路点：限定在「文字节点包围盒 + 余量」内检测，天然排除顶栏/底栏 UI 图标。
  // X/Y 余量必须分开算 —— 很宽的地图 spreadX 远大于 spreadY，用同一个余量会让
  // 纵向边界过度扩张，把 UI 栏框进来。
  const xs = labels.map((l) => l.cx);
  const ys = labels.map((l) => l.cy);
  const spreadX = Math.max(...xs) - Math.min(...xs);
  const spreadY = Math.max(...ys) - Math.min(...ys);
  const marginX = Math.max(medianCharWidth * 5, spreadX * 0.08);
  const marginY = Math.max(medianCharWidth * 5, spreadY * 0.08);
  const rawBlobs = detectBlankNodes(
    canvas,
    {
      minX: Math.min(...xs) - marginX,
      maxX: Math.max(...xs) + marginX,
      minY: Math.min(...ys) - marginY,
      maxY: Math.max(...ys) + marginY,
    },
    medianCharWidth,
  );
  // 节点图标常带小装饰标记，跟真正的空白过路点长得像但其实属于同一个节点
  const minDistFromLabel = medianCharWidth * 3;
  const blanks = rawBlobs.filter((b) =>
    labels.every(
      (n) => Math.hypot(n.cx - b.cx, n.cy - b.cy) > minDistFromLabel,
    ),
  );

  const candidates = initialMaps.filter((m) => m.zone === zone);
  if (!candidates.length) throw new ZoneUndetectedError();
  const zoneRows = Math.max(...candidates.map((m) => m.rows));
  const zoneCols = Math.max(...candidates.map((m) => m.cols));

  const colAxis = fitAxis(xs, zoneCols);
  const rowAxis = fitAxis(ys, zoneRows);
  const gridNodes: GridNode[] = [
    ...labels.map((l) => ({
      row: snapToAxis(l.cy, rowAxis),
      col: snapToAxis(l.cx, colAxis),
      label: l.label as string | null,
    })),
    ...blanks.map((b) => ({
      row: snapToAxis(b.cy, rowAxis),
      col: snapToAxis(b.cx, colAxis),
      label: null,
    })),
  ];

  const { results, totalDetectedAnchors } = matchCandidates(
    gridNodes,
    candidates,
  );
  const best = results[0];
  if (!best) throw new NoNodeDetectedError();

  const bestMap = candidates.find((c) => c.id === best.mapId)!;
  const marginRatio = computeMarginRatio(results, totalDetectedAnchors);

  // 同一张基底在相邻 offset 下往往占据榜单前几名（同一答案的近似平移），
  // 对用户没有意义，所以按 mapId 去重后再取前 N 张不同的基底。
  const bestScore = rank(best, totalDetectedAnchors);
  const topCandidates: RankedCandidate[] = [];
  const seenMaps = new Set<string>();
  for (const r of results) {
    if (seenMaps.has(r.mapId)) continue;
    seenMaps.add(r.mapId);
    const map = candidates.find((c) => c.id === r.mapId);
    if (!map) continue;
    const score = rank(r, totalDetectedAnchors);
    topCandidates.push({
      mapId: r.mapId,
      offset: r.offset,
      score,
      gapToBest: bestScore > 0 ? (bestScore - score) / bestScore : 0,
      matchPercent: matchPercentOf(r),
      // 每个候选按自己的 offset 修正 —— 选中它时要填入的是这一套节点
      correctedNodes: correctNodes(gridNodes, map, r.offset),
    });
    if (topCandidates.length >= TOP_CANDIDATE_COUNT) break;
  }

  // 网格填充密度，用于提示用户「这张图可能没识别全」
  const rows = gridNodes.map((n) => n.row);
  const cols = gridNodes.map((n) => n.col);
  const minRow = Math.max(Math.min(...rows), -1);
  const maxRow = Math.min(Math.max(...rows), zoneRows);
  const minCol = Math.max(Math.min(...cols), -1);
  const maxCol = Math.min(Math.max(...cols), zoneCols);
  const totalCells = (maxRow - minRow + 1) * (maxCol - minCol + 1);
  const occupiedRatio = totalCells > 0 ? gridNodes.length / totalCells : 1;

  return {
    zone,
    mapId: best.mapId,
    marginRatio,
    hasAnchor: totalDetectedAnchors > 0,
    confidence: confidenceOf(
      totalDetectedAnchors > 0,
      best.outOfBounds,
      marginRatio,
      best.anchorScore === best.anchorTotal,
    ),
    candidates: results,
    topCandidates,
    best,
    gridNodes,
    correctedNodes: correctNodes(gridNodes, bestMap, best.offset),
    lowDensity: occupiedRatio < LOW_DENSITY_THRESHOLD,
    stats: { labels: labels.length, blanks: blanks.length, occupiedRatio },
  };
}
