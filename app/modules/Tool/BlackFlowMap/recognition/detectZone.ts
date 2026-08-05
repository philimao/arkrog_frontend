/**
 * 从截图里判定当前层数，省掉用户手选。
 *
 * 游戏顶栏固定显示层名（如「血色空脉」）与罗马数字（如「(III)」）。实测 82 张
 * 真实样张，用滑窗模糊子串匹配层名可以 82/82 全中；罗马数字作为兜底信号。
 */
import { editDistance, fuzzySubstringMatch } from "./vocab";
import { intToRoman } from "~/utils/tools";
import type { ZoneData } from "~/types/gameData";
import type { OcrItem } from "./types";

/**
 * 层名匹配。
 *
 * 必须用滑窗而不是整段编辑距离 —— 层名常跟旁边的 UI 文字粘成一段（实测有
 * `"FPs受害者腐殖2℃"` 这种），整段比对会被噪声长度拖累判不匹配。
 */
function matchByName(items: OcrItem[], zones: ZoneData[]): string | null {
  const names = zones.map((z) => z.name).filter(Boolean);
  if (!names.length) return null;

  let bestZone: string | null = null;
  let bestDist = Infinity;
  for (const item of items) {
    if (item.t.length < 3) continue;
    const hit = fuzzySubstringMatch(item.t, names);
    if (!hit) continue;
    // fuzzySubstringMatch 只回命中的词，这里再算一次距离用于挑全局最优
    const dist = Math.min(
      ...Array.from(
        { length: Math.max(1, item.t.length - hit.length + 1) },
        (_, i) => editDistance(item.t.slice(i, i + hit.length), hit),
      ),
    );
    if (dist < bestDist) {
      bestDist = dist;
      bestZone = zones.find((z) => z.name === hit)?.id ?? null;
    }
  }
  return bestZone;
}

/**
 * 罗马数字兜底。层名被裁掉或糊得认不出时，顶栏的 `(I)`~`(V)` 往往还在。
 * OCR 常把 I 读成 l/1，所以先做字符归一再比。
 */
function matchByRoman(items: OcrItem[], zones: ZoneData[]): string | null {
  const normalize = (s: string) => s.replace(/[l1|]/g, "I").toUpperCase();
  for (const item of items) {
    const m = item.t.match(/[（(]([IVXivxl1|]{1,5})[)）]/);
    if (!m) continue;
    const got = normalize(m[1]);
    for (let i = 0; i < zones.length; i++) {
      if (got === intToRoman(i + 1)) return zones[i].id;
    }
  }
  return null;
}

/**
 * @param items 一次 OCR 返回的全部文本段
 * @param zones 该肉鸽主题的层列表（顺序即层序），层名取自 gameData，不写死
 * @returns zone id，判不出时返回 null（由 UI 让用户手选）
 */
export function detectZone(items: OcrItem[], zones: ZoneData[]): string | null {
  return matchByName(items, zones) ?? matchByRoman(items, zones);
}
