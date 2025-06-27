import type { RogueKey, RelicData, ItemData, RelicDataExt, RelicWrapper } from "~/types/gameData";
import { layerValueStrs } from "~/modules/Tool/DamageCalculator/utils";

/** 获取藏品列表 */

export function getRelicsData(
  relics: Record<RogueKey, Record<string, RelicData>>,
  items: Record<RogueKey, Record<string, ItemData>>,
  rogueKey: RogueKey,
): Record<string, RelicDataExt> {
  const relicsData: Record<string, RelicDataExt> = {};
  for (const [itemId, item] of Object.entries(items[rogueKey])) {
    if (item.type === "RELIC") {
      const relicData = relics[rogueKey][itemId];
      if (relicData) {
        relicsData[itemId] = {
          ...item,
          ...relicData,
        };
      }
    }
  }
  return relicsData;
} /** 设置藏品状态 */

export function getRelicWrappers(relicsData: Record<string, RelicDataExt>): Record<string, RelicWrapper> {
  const relicWrappers: Record<string, RelicWrapper> = {};
  for (const [relicId, relicData] of Object.entries(relicsData)) {
    relicWrappers[relicId] = wrapRelicData(relicData);
  }
  return relicWrappers;
}

/**
 * 计算藏品相关属性
 * @param relicDataExt
 * @param charData
 */
export function wrapRelicData(relicDataExt: RelicDataExt): RelicWrapper {
  const hasLayer = relicDataExt.buffs.some(
    (buff) =>
      buff.key.startsWith("layer_char") ||
      buff.key.startsWith("char_squad") ||
      buff.blackboard.some((bb) => layerValueStrs.includes(bb.valueStr!)),
  );
  return {
    id: relicDataExt.id,
    name: relicDataExt.name,
    value: relicDataExt.value,
    usage: relicDataExt.usage,
    userActive: true,
    isFavorite: false,
    hasLayer: hasLayer,
    layer: 1,
    pinyin: relicDataExt.pinyin.replace(/_/g, ""),
    initials: relicDataExt.pinyin
      .split("_")
      .map((s) => s[0])
      .join(""),
    disabled: false,
  };
}
