import type { RelicUiState, WrappedRelicItem } from "~/types/gameData";
import { layerValueStrs } from "~/modules/Tool/DamageCalculator/utils";

/** 克隆包装外层，允许用户修改 layer/enable，但不修改原封的 relic/charBuffs。 */
export function getRelicsData(
  sourceRelics: Record<string, WrappedRelicItem>,
): Record<string, WrappedRelicItem> {
  const relicsData: Record<string, WrappedRelicItem> = {};
  for (const wrapped of Object.values(sourceRelics)) {
    relicsData[wrapped.id] = {
      ...wrapped,
      // 原始对象仅复用引用，用户态只能改包装层的两个字段。
      layer: wrapped.layer ?? 0,
      enable: wrapped.enable ?? true,
    };
  }
  return relicsData;
}

/** 生成不污染 WrappedRelicItem 契约的展示派生状态。 */
export function getRelicUiStates(
  relicsData: Record<string, WrappedRelicItem>,
): Record<string, RelicUiState> {
  const relicUiStates: Record<string, RelicUiState> = {};
  for (const [relicId, relicData] of Object.entries(relicsData)) {
    relicUiStates[relicId] = createRelicUiState(relicData);
  }
  return relicUiStates;
}

/** 藏品是否可叠层 */
export function relicHasLayer(relic: WrappedRelicItem): boolean {
  return relic.relic.buffs.some(
    (buff) =>
      buff.key.startsWith("layer_char") ||
      buff.key.startsWith("char_squad") ||
      buff.blackboard.some((bb) => layerValueStrs.includes(bb.valueStr!) || bb.key.includes("stack")),
  );
}

/**
 * 计算藏品相关属性
 * @param relic 包装藏品本体
 */
export function createRelicUiState(relic: WrappedRelicItem): RelicUiState {
  return {
    isFavorite: false,
    hasLayer: relicHasLayer(relic),
    initials: relic.pinyin
      .split("_")
      .map((s) => s[0])
      .join(""),
    disabled: false,
  };
}
