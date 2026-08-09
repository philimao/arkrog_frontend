/**
 * 候选基底打分与选择。
 */
import { ANCHOR_LABELS } from "./vocab";
import type { MapShorthand } from "../mapData";
import type {
  CorrectedNode,
  GridNode,
  MatchCandidate,
  ScoreResult,
} from "./types";

/** 候选地图上真实存在的格子（由 edges 的端点构成） */
function cellSetOf(candidate: MapShorthand): Set<string> {
  return new Set(
    candidate.edges.flatMap(([r1, c1, r2, c2]) => [
      `${r1},${c1}`,
      `${r2},${c2}`,
    ]),
  );
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function scoreOffset(
  nodes: GridNode[],
  candidate: MapShorthand,
  dr: number,
  dc: number,
): ScoreResult {
  const cellSet = cellSetOf(candidate);
  let anchorScore = 0;
  let anchorTotal = 0;
  let cellHits = 0;
  let cellTotal = 0;
  let outOfBounds = 0;

  for (const n of nodes) {
    const ar = n.row + dr;
    const ac = n.col + dc;
    if (ar < 0 || ar >= candidate.rows || ac < 0 || ac >= candidate.cols) {
      outOfBounds += 1;
      continue;
    }
    const anchorType = n.label ? ANCHOR_LABELS[n.label] : undefined;
    if (anchorType === "end") {
      anchorTotal += 1;
      if ((candidate.ends ?? []).some(([r, c]) => r === ar && c === ac))
        anchorScore += 1;
    } else if (anchorType === "battleEnd") {
      anchorTotal += 1;
      if (candidate.battleEnd?.[0] === ar && candidate.battleEnd?.[1] === ac) {
        anchorScore += 1;
      }
    } else {
      cellTotal += 1;
      if (cellSet.has(`${ar},${ac}`)) cellHits += 1;
    }
  }

  const edgeSet = new Set(
    candidate.edges.map(([r1, c1, r2, c2]) =>
      edgeKey(`${r1},${c1}`, `${r2},${c2}`),
    ),
  );
  let edgeHits = 0;
  let edgeTotal = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dRow = Math.abs(nodes[i].row - nodes[j].row);
      const dCol = Math.abs(nodes[i].col - nodes[j].col);
      const isGridAdjacent =
        (dRow === 1 && dCol === 0) || (dRow === 0 && dCol === 1);
      if (!isGridAdjacent) continue;
      edgeTotal += 1;
      const key = edgeKey(
        `${nodes[i].row + dr},${nodes[i].col + dc}`,
        `${nodes[j].row + dr},${nodes[j].col + dc}`,
      );
      if (edgeSet.has(key)) edgeHits += 1;
    }
  }

  return {
    anchorScore,
    anchorTotal,
    cellHits,
    cellTotal,
    edgeHits,
    edgeTotal,
    outOfBounds,
  };
}

/**
 * 排序分。优先级：越界点少 > 锚点解释率 > 连线命中率与格子命中率（同权重）。
 *
 * anchorRate 的分母用「这张图总共检测到几个锚点」而不是 `anchorTotal`（各候选
 * 自己算的、落在图内的锚点数）—— 否则某候选的偏移让一个真实锚点越界时，它的
 * anchorTotal 会同步减少，导致「只解释对一半锚点」的候选反而拿到 100% 命中率。
 */
export function rank(r: ScoreResult, totalDetectedAnchors: number): number {
  const anchorRate =
    totalDetectedAnchors > 0 ? r.anchorScore / totalDetectedAnchors : 0;
  const edgeRate = r.edgeTotal > 0 ? r.edgeHits / r.edgeTotal : 1;
  const cellRate = r.cellTotal > 0 ? r.cellHits / r.cellTotal : 1;
  return (
    anchorRate * 100000 +
    edgeRate * 1000 +
    cellRate * 1000 +
    r.edgeHits * 10 +
    r.cellHits * 5 -
    r.outOfBounds * 500
  );
}

/**
 * 候选自身的匹配质量，供 UI 展示为百分比（如 92%）。
 *
 * 用格子命中率与连线命中率的均值，而非 rank() 的排序分 —— 排序分掺了越界惩罚等
 * 只在候选间比较时才有意义的项，数值本身不能直接读作"这张图有多像"。
 */
export function matchPercentOf(r: ScoreResult): number {
  const cellRate = r.cellTotal > 0 ? r.cellHits / r.cellTotal : 1;
  const edgeRate = r.edgeTotal > 0 ? r.edgeHits / r.edgeTotal : 1;
  return Math.round(((cellRate + edgeRate) / 2) * 100);
}

/**
 * 已确定是哪张候选地图后，候选的 edges 就是真值：检测节点加偏移后若不落在真实
 * 存在的格子上，大概率是网格聚类的局部误差（不是选错图，是这个点自己偏了一格），
 * 吸附到附近最近的合法格子。
 */
export function correctNodes(
  nodes: GridNode[],
  candidate: MapShorthand,
  offset: { dr: number; dc: number },
): CorrectedNode[] {
  const cellSet = cellSetOf(candidate);
  return nodes.map((n) => {
    const ar = n.row + offset.dr;
    const ac = n.col + offset.dc;
    if (cellSet.has(`${ar},${ac}`)) {
      return { row: ar, col: ac, label: n.label, corrected: false };
    }
    let best: { row: number; col: number } | null = null;
    let bestDist = Infinity;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = ar + dr;
        const c = ac + dc;
        if (!cellSet.has(`${r},${c}`)) continue;
        const dist = Math.hypot(dr, dc);
        if (dist < bestDist) {
          bestDist = dist;
          best = { row: r, col: c };
        }
      }
    }
    if (best)
      return { row: best.row, col: best.col, label: n.label, corrected: true };
    return {
      row: ar,
      col: ac,
      label: n.label,
      corrected: false,
      unresolved: true,
    };
  });
}

/** 枚举所有候选地图 × 所有合法偏移，按 rank 排序 */
export function matchCandidates(
  gridNodes: GridNode[],
  candidates: MapShorthand[],
): { results: MatchCandidate[]; totalDetectedAnchors: number } {
  const results: MatchCandidate[] = [];
  const anchors = gridNodes.filter((n) => n.label && ANCHOR_LABELS[n.label]);

  for (const candidate of candidates) {
    const offsets = new Set<string>();
    for (const a of anchors) {
      const type = ANCHOR_LABELS[a.label!];
      const candAnchors =
        type === "end"
          ? (candidate.ends ?? []).map(([r, c]) => ({ r, c }))
          : candidate.battleEnd
            ? [{ r: candidate.battleEnd[0], c: candidate.battleEnd[1] }]
            : [];
      for (const ca of candAnchors)
        offsets.add(`${ca.r - a.row},${ca.c - a.col}`);
    }
    // 一个锚点都没有时没法反推偏移，退化成穷举全部合法平移量，纯靠连线/格子命中打分
    if (offsets.size === 0) {
      for (let dr = -candidate.rows + 1; dr < candidate.rows; dr++) {
        for (let dc = -candidate.cols + 1; dc < candidate.cols; dc++) {
          offsets.add(`${dr},${dc}`);
        }
      }
    }
    for (const key of offsets) {
      const [dr, dc] = key.split(",").map(Number);
      results.push({
        mapId: candidate.id,
        offset: { dr, dc },
        ...scoreOffset(gridNodes, candidate, dr, dc),
      });
    }
  }

  const totalDetectedAnchors = new Set(anchors.map((n) => `${n.row},${n.col}`))
    .size;
  results.sort(
    (a, b) => rank(b, totalDetectedAnchors) - rank(a, totalDetectedAnchors),
  );
  return { results, totalDetectedAnchors };
}

/**
 * best 与「最高分的、地图不同的候选」的分差占比。
 *
 * 反映的是「这次匹配有没有歧义」，而不是「识别有多完美」。用它判断可信度比看
 * edgeRate 合适得多 —— 迷宫里本来就存在网格相邻但没有路连着的格子对，edgeRate
 * 的分母把这些也算进去了，即使完全选对也很难到 90%。
 *
 * 比较对象不能简单取第二名：同一张地图在相邻 offset 下往往也排在前列（同一答案
 * 的近似平移），跟它比没有意义。
 */
export function computeMarginRatio(
  results: MatchCandidate[],
  totalDetectedAnchors: number,
): number | null {
  const best = results[0];
  if (!best) return null;
  const rival = results.find((r) => r.mapId !== best.mapId);
  if (!rival) return null;
  const bestScore = rank(best, totalDetectedAnchors);
  const rivalScore = rank(rival, totalDetectedAnchors);
  return bestScore > 0 ? (bestScore - rivalScore) / bestScore : 0;
}
