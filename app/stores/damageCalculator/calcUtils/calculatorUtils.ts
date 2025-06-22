import type { ItemData, RelicData, RogueKey } from "~/types/gameData";

/** 获取藏品列表 */
export function getRelicList(
  relics: Record<RogueKey, Record<string, RelicData>>,
  items: Record<RogueKey, Record<string, ItemData>>,
  rogueKey: RogueKey,
) {
  return Object.values(items[rogueKey])
    .filter((item) => item.type === "RELIC")
    .map((item) => ({
      ...item,
      ...relics[rogueKey][item.id],
      show: true,
    }));
}
