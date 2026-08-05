/**
 * 节点词表与模糊匹配。
 *
 * 云 OCR 返回的是整段文本（一个节点标签就是一段），不需要按字间距把 word 拼成词，
 * 所以这里只做「整段 → 词表」的容错匹配。
 */

export const NODE_VOCAB = [
  "作战",
  "紧急作战",
  "“居民”据点",
  "诡意行商",
  "秘境行商",
  "应急助力",
  "不期而遇",
  "安全的角落",
  "得偿所愿",
  "失与得",
  "先行一步",
  "狭路相逢",
  "险路小径",
  "误入奇境",
  "曲折密道",
  "羽瞰点",
  "命运所指",
  "未知的凶戾",
  "未知的诡秘",
  "险路尽头",
  "险路恶敌",
] as const;

/**
 * 结构性锚点，用来把检测坐标系对齐到候选地图坐标系。
 *
 * 注意：`险路尽头` 是**游戏内的显示状态**而非地图固有属性 —— 未探明的出口会被
 * 遮蔽成「未知的诡秘」（图标也不同）。所以一张图能看到几个锚点取决于玩家进度，
 * 不能用「检出锚点数 < 该 zone 应有数」来判断识别是否完整。
 */
export const ANCHOR_LABELS: Record<string, "end" | "battleEnd"> = {
  险路尽头: "end",
  险路恶敌: "battleEnd",
};

export function editDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** 允许的编辑距离：目标词长度的一半，至少 1 */
function tolerance(word: string): number {
  return Math.max(1, Math.ceil(word.length * 0.5));
}

/** 整段与词表比对 */
export function matchVocab(raw: string): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const v of NODE_VOCAB) {
    const d = editDistance(raw, v);
    if (d < bestDist) {
      bestDist = d;
      best = v;
    }
  }
  return best && bestDist <= tolerance(best) ? best : null;
}

/**
 * 模糊子串匹配：目标词被噪声包住时用。
 *
 * OCR 有时会把节点标签和旁边的 UI 文字连成一段（实测层名会读成 `"FPs受害者腐殖2℃"`），
 * 整段做编辑距离会被噪声长度拖累判不匹配，精确子串匹配又受不了目标词本身有错字。
 * 这里在文本里滑动跟目标词等长（±1）的窗口逐一比对，相当于「容错的子串包含」。
 */
export function fuzzySubstringMatch(
  raw: string,
  vocabulary: readonly string[] = NODE_VOCAB,
): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const v of vocabulary) {
    for (let len = v.length - 1; len <= v.length + 1; len++) {
      if (len < 1 || len > raw.length) continue;
      for (let i = 0; i + len <= raw.length; i++) {
        const d = editDistance(raw.slice(i, i + len), v);
        if (d < bestDist) {
          bestDist = d;
          best = v;
        }
      }
    }
  }
  return best && bestDist <= tolerance(best) ? best : null;
}
