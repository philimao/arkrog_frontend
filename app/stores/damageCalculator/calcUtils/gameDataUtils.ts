import { navOfZone, zoneOfTopic } from "~/modules/Tool/DamageCalculator/EnemySection/enemyUtils";
import type { LevelData, RogueKey, StageOfRogue } from "~/types/gameData";
import { _get } from "~/utils/tools";
import { dummy } from "../calcConstants";
import type { RogueInput } from "../calcTypes";

/** 获取渲染关卡列表 */
export function getStageList(stages: Record<RogueKey, StageOfRogue>, rogueInput: RogueInput) {
  const stageOfRogue = stages[rogueInput.topic as RogueKey];
  const zones = [...navOfZone, ...zoneOfTopic[rogueInput.topic as never]];
  const zone = zones.find((zone) => rogueInput[rogueInput.topic].zone === zone.id);
  return (
    Object.values(stageOfRogue)
      // 过滤区域关卡
      .filter((stage) => zone!.filter(stage))
      // 排序 紧急 > 普通
      .sort((a, b) => {
        const isEliteA = a.isElite;
        const isEliteB = b.isElite;
        if (isEliteA !== isEliteB) return isEliteA ? -1 : 1;
        return 0;
      })
      // 相同关卡排列在一起
      .sort((a, b) => {
        const argsA = a.id.match(/.*_(\d{1,2})/)?.[1] || "0";
        const argsB = b.id.match(/.*_(\d{1,2})/)?.[1] || "0";
        return parseInt(argsA) - parseInt(argsB);
      })
      // // Boss关在最前，狭路在最后
      .sort((a, b) => {
        const isBossA = a.isBoss;
        const isBossB = b.isBoss;
        if (isBossA !== isBossB) return isBossA ? -1 : 1;
        const isDuelA = a.id.includes("duel");
        const isDuelB = b.id.includes("duel");
        if (isDuelA !== isDuelB) return isDuelA ? 1 : -1;
        return 0;
      })
  );
}

/** 设置关卡数据 */
export async function handleUpdateStageId(state: {
  rogueInput: RogueInput;
  stages: Record<RogueKey, StageOfRogue>;
  levels: Record<string, LevelData>;
  relics: string[];
  stageId: string;
}) {
  const rogueKey = state.rogueInput.topic;
  const stageId = state.stageId;
  const stageData = state.stages[rogueKey][stageId];
  // 如果stageData存在，则判断是否需要加载levelData
  let levelData;
  const levels = { ...state.levels };
  const relics = [...state.relics];
  if (stageData) {
    // 读取缓存
    if (state.levels[stageId]) levelData = state.levels[stageId];
    else {
      // 加载并设置缓存
      levelData = await loadLevelData(stageData.levelId);
      levels[stageId] = levelData;
    }
    const stageWithBoatIds = [
      "ro4_b_4_c", // 紧急授课
      "ro4_b_4_d", // 思维矫正
      "ro4_b_5_c", // 朝谒
      "ro4_b_5_d", // 魂灵朝谒
      "ro4_b_7", // 授法
    ];
    // 带船关卡自动添加阿纳萨
    if (stageWithBoatIds.includes(stageId) && !state.relics.includes("rogue_4_relic_final_6")) {
      relics.push("rogue_4_relic_final_6");
    }
    const stageWithRollingAncestorIds = [
      "ro4_b_4_b", // 思维矫正
      "ro4_b_4_d", // 带船思维矫正
      "ro4_b_5_b", // 魂灵朝谒
      "ro4_b_5_d", // 带船魂灵朝谒
    ];
    // 异格关卡自动添加滚动先祖
    if (stageWithRollingAncestorIds.includes(stageId) && !state.relics.includes("rogue_4_relic_explore_7")) {
      relics.push("rogue_4_relic_explore_7");
    }
  } else {
    levelData = undefined;
  }
  return {
    stageData,
    levelData,
    levels,
    relics,
    enemyData: undefined,
    enemyBase: dummy,
  };
}

/** 加载关卡详细解包数据 */
export async function loadLevelData(levelId: string) {
  return await _get<LevelData>(`/gamedata/level/${levelId.toLowerCase().replace(/\//g, "&&")}`);
}
