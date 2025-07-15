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
      // 排序 BOSS > 普通+紧急
      .sort((a, b) => {
        const argsA = a.id.split("_");
        const argsB = b.id.split("_");
        const softMap: Record<string, number> = {
          b: 1,
          duel: 2,
          e: 4,
          n: 4,
        };
        if (softMap[argsA[1]] !== softMap[argsB[1]]) return softMap[argsA[1]] - softMap[argsB[1]];
        return parseInt(argsA[3]) - parseInt(argsB[3]);
      })
  );
}

/** 设置关卡数据 */
export async function handleUpdateStageId(state: {
  rogueInput: RogueInput;
  stages: Record<RogueKey, StageOfRogue>;
  levels: Record<string, LevelData>;
  selectedIds: string[];
  stageId: string;
}) {
  const rogueKey = state.rogueInput.topic;
  const stageId = state.stageId;
  const stageData = state.stages[rogueKey][stageId];
  // 如果stageData存在，则判断是否需要加载levelData
  let levelData;
  const levels = { ...state.levels };
  const selectedIds = [...state.selectedIds];
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
    if (stageWithBoatIds.includes(stageId) && !state.selectedIds.includes("rogue_4_relic_final_6")) {
      selectedIds.push("rogue_4_relic_final_6");
    }
    const stageWithRollingAncestorIds = [
      "ro4_b_4_b", // 思维矫正
      "ro4_b_4_d", // 带船思维矫正
      "ro4_b_5_b", // 魂灵朝谒
      "ro4_b_5_d", // 带船魂灵朝谒
    ];
    // 异格关卡自动添加滚动先祖
    if (stageWithRollingAncestorIds.includes(stageId) && !state.selectedIds.includes("rogue_4_relic_explore_7")) {
      selectedIds.push("rogue_4_relic_explore_7");
    }
  } else {
    levelData = undefined;
  }
  return {
    stageData,
    levelData,
    levels,
    selectedIds,
    enemyData: undefined,
    enemyBase: dummy,
  };
}

/** 加载关卡详细解包数据 */
export async function loadLevelData(levelId: string) {
  return await _get<LevelData>(`/gamedata/level/${levelId.toLowerCase().replace(/\//g, "&&")}`);
}
