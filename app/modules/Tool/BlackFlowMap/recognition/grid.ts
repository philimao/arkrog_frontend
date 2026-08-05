/**
 * 网格标定：从「已识别节点的像素坐标」反推出整个格点阵列。
 *
 * 地图节点严格落在 rows × cols 的格点上，所以只要认出足够多的节点，没认出来的
 * 位置也是确定的 —— 抢救识别就是靠这个把 ROI 算出来的（而不是去「找」漏检的节点）。
 */
import type { Axis } from "./types";

/**
 * 把一维坐标聚类并标定出「起点 + 单格间距」。
 *
 * @param values 只传**文字节点**的坐标。空白过路点检测有像素噪声，可能凭空造出
 *   一个多余的簇，而下面「簇数超上限就合并」的兜底会不分青红皂白地把两个本来
 *   正确的真实行/列合并掉。空白点只用标定好的间距「对号入座」，不参与标定本身。
 * @param maxClusters 该 zone 已知的最大行数/列数，用作聚类数上限
 */
export function fitAxis(values: number[], maxClusters: number): Axis | null {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  if (sorted.length === 0) return null;

  let boundaries = sorted.map((v) => ({ min: v, max: v }));
  // 同一行/列的节点坐标有几像素抖动，会被合并回一簇
  while (maxClusters && boundaries.length > maxClusters) {
    let minGapIdx = 0;
    let minGap = Infinity;
    for (let i = 1; i < boundaries.length; i++) {
      const gap = boundaries[i].min - boundaries[i - 1].max;
      if (gap < minGap) {
        minGap = gap;
        minGapIdx = i;
      }
    }
    boundaries[minGapIdx - 1] = {
      min: boundaries[minGapIdx - 1].min,
      max: boundaries[minGapIdx].max,
    };
    boundaries.splice(minGapIdx, 1);
  }

  const centers = boundaries.map((b) => (b.min + b.max) / 2);
  if (centers.length <= 2) {
    const pitch = centers.length === 2 ? centers[1] - centers[0] : 1;
    return { firstCenter: centers[0], unitPitch: pitch || 1 };
  }

  // 取相邻簇间距的**中位数**而不是平均或最小值：如果中间几列整个漏检，那一段
  // 实测间距会是单格间距的整数倍，中位数能让这些大间隙不污染标定。
  const gaps = centers.slice(1).map((c, i) => c - centers[i]);
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  return {
    firstCenter: centers[0],
    unitPitch: sortedGaps[Math.floor(sortedGaps.length / 2)],
  };
}

/** 任意坐标离起点有几个单格间距，四舍五入即绝对格号 */
export function snapToAxis(value: number, axis: Axis | null): number {
  if (!axis) return 0;
  return Math.round((value - axis.firstCenter) / axis.unitPitch);
}

/** 由格号反推像素中心，抢救裁图用 */
export function axisToPixel(index: number, axis: Axis): number {
  return axis.firstCenter + index * axis.unitPitch;
}
