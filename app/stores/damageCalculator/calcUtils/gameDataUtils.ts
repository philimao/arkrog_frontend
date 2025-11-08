import { getNavOfZone, zoneOfTopic } from "~/modules/Tool/DamageCalculator/EnemySection/enemyUtils";
import type { LevelData, RogueKey, StageOfRogue, EnemyData, StageData } from "~/types/gameData";
import { _get } from "~/utils/tools";
import { dummy } from "../calcConstants";
import type { RogueInput } from "../calcTypes";

/** 获取渲染关卡列表 */
export function getStageList(stages: Record<RogueKey, StageOfRogue>, rogueInput: RogueInput) {
  const stageOfRogue = stages[rogueInput.topic as RogueKey];
  const zones = [...getNavOfZone(rogueInput.topic), ...zoneOfTopic[rogueInput.topic as never]];
  let zone = zones.find((zone) => rogueInput[rogueInput.topic].zone === zone.id);

  // 调试信息
  if (!zone) {
    console.error(`Zone not found: ${rogueInput[rogueInput.topic].zone}`, {
      topic: rogueInput.topic,
      availableZones: zones.map((z) => z.id),
      requestedZone: rogueInput[rogueInput.topic].zone,
    });
    // 如果找不到区域，使用第一个可用区域
    const fallbackZone = zones[0];
    if (fallbackZone) {
      console.warn(`Using fallback zone: ${fallbackZone.id}`);
      zone = fallbackZone;
    } else {
      throw new Error(`No zones available for topic: ${rogueInput.topic}`);
    }
  }

  // 获取所有关卡并合并重复的关卡
  const allStages = Object.values(stageOfRogue).filter((stage) => zone!.filter(stage));

  // 过滤无效关卡
  const invalidStages = ["ro5_e_t_9_a"];
  const filteredStages = allStages.filter((stage) => !invalidStages.includes(stage.id));

  // 合并重复关卡
  const mergedStages = mergeDuplicateStages(filteredStages);

  return (
    mergedStages
      // 指点迷津区域特殊排序 - 最高优先级
      .sort((a, b) => {
        const isFsA = a.id.includes("_fs_");
        const isFsB = b.id.includes("_fs_");
        const isDvA = a.id.includes("_dv_");
        const isDvB = b.id.includes("_dv_");

        // 如果都是指点迷津类型关卡，使用特殊排序
        if ((isFsA || isDvA) && (isFsB || isDvB)) {
          // 分明(dv)排在最上面
          if (isDvA && isFsB) return -1; // dv在前
          if (isFsA && isDvB) return 1; // fs在后

          // 如果都是fs类型，按数字排序
          if (isFsA && isFsB) {
            const numA = a.id.match(/_fs_(\d+)/)?.[1] || "0";
            const numB = b.id.match(/_fs_(\d+)/)?.[1] || "0";
            return parseInt(numA) - parseInt(numB);
          }
        }

        return 0;
      })
      // 诡异行商区域特殊排序 - 第二优先级
      .sort((a, b) => {
        const isEvA = a.id.includes("_ev_");
        const isEvB = b.id.includes("_ev_");

        // 如果都是ev类型关卡，使用特殊排序
        if (isEvA && isEvB) {
          const topic = rogueInput.topic;

          // 萨卡兹主题：叙事要约(ev_2) - 物权纠纷(ev_1)
          if (topic === "rogue_4") {
            if (a.id === "ro4_ev_2" && b.id === "ro4_ev_1") return -1; // 叙事要约在前
            if (a.id === "ro4_ev_1" && b.id === "ro4_ev_2") return 1; // 物权纠纷在后
          }

          // 界园主题：神游天外(ev_1) - 作壁上观(ev_2)
          if (topic === "rogue_5") {
            if (a.id === "ro5_ev_1" && b.id === "ro5_ev_2") return -1; // 神游天外在前
            if (a.id === "ro5_ev_2" && b.id === "ro5_ev_1") return 1; // 作壁上观在后
          }
        }

        return 0;
      })
      // 排序 普通 > 紧急
      .sort((a, b) => {
        const isEliteA = a.isElite;
        const isEliteB = b.isElite;
        if (isEliteA !== isEliteB) return isEliteA ? 1 : -1;
        return 0;
      })
      // 相同关卡排列在一起（跳过ev、fs、dv类型关卡，它们有特殊排序）
      .sort((a, b) => {
        const isEvA = a.id.includes("_ev_");
        const isEvB = b.id.includes("_ev_");
        const isFsA = a.id.includes("_fs_");
        const isFsB = b.id.includes("_fs_");
        const isDvA = a.id.includes("_dv_");
        const isDvB = b.id.includes("_dv_");

        // 如果都是特殊类型，跳过数字排序
        if ((isEvA || isFsA || isDvA) && (isEvB || isFsB || isDvB)) return 0;

        const argsA = a.id.match(/.*_(\d{1,2})/)?.[1] || "0";
        const argsB = b.id.match(/.*_(\d{1,2})/)?.[1] || "0";
        return parseInt(argsA) - parseInt(argsB);
      })
      // 变种关卡排序，以字母结尾
      .sort((a, b) => {
        const re = /[a-z]$/;
        if (a.id.match(re) && b.id.match(re)) {
          return a.id.match(re)?.[0]?.charCodeAt(0) - b.id.match(re)?.[0]?.charCodeAt(0);
        }
        return 0;
      })
      // Boss关在最前，狭路在最后
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

/** 合并重复关卡 */
function mergeDuplicateStages(stages: StageData[]) {
  const stageMap = new Map();

  stages.forEach((stage) => {
    const key = stage.name; // 使用关卡名称作为合并键

    if (!stageMap.has(key)) {
      // 如果是夕江对擂或南武群英会，需要特殊处理
      if (key === "夕江对擂") {
        // 夕江对擂：只保留ro5_duel_1
        if (stage.id === "ro5_duel_1") {
          stageMap.set(stage.id, stage);
        }
      } else if (key === "南武群英会") {
        // 南武群英会：只保留ro5_duel_2_c
        if (stage.id === "ro5_duel_2_c") {
          stageMap.set(stage.id, stage); // 使用关卡名称作为键，合并为一个
        }
      } else {
        // 其他关卡正常添加
        stageMap.set(stage.id, stage);
      }
    }
  });

  return Array.from(stageMap.values());
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

      // 为南武群英会添加神父变体
      if (stageId === "ro5_duel_2_c") {
        levelData = await addPriestVariants(levelData);
      }

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

/** 为南武群英会添加神父变体 TODO 放到后端 */
async function addPriestVariants(levelData: LevelData): Promise<LevelData> {
  // 找到原有的神父敌人
  const originalPriest = levelData.enemies.find((enemy) => enemy.id === "enemy_1284_sgprst");

  if (originalPriest) {
    // 从ro5_duel_2关卡加载level 1的神父数据
    const level1Data = await loadLevelData("Obt/Roguelike/RO5/level_rogue5_d-2");
    const level1Priest = level1Data.enemies.find((enemy) => enemy.id === "enemy_1284_sgprst");

    if (level1Priest) {
      // 创建神父变体（全远程版本，level 1）
      const priestVariant: EnemyData = {
        ...level1Priest,
        id: "enemy_1284_sgprst_variant",
        name: { ...level1Priest.name, m_value: "阿格尼尔神父" },
      };

      // 修改原神父的显示名称（深拷贝避免引用问题）
      const modifiedOriginalPriest: EnemyData = {
        ...originalPriest,
        name: { ...originalPriest.name, m_value: "阿格尼尔神父" },
        attributes: {
          ...originalPriest.attributes,
        },
      };

      // 找到原神父在数组中的位置
      const priestIndex = levelData.enemies.findIndex((enemy) => enemy.id === "enemy_1284_sgprst");

      // 创建新的敌人数组，在原神父位置插入两个神父变体
      const newEnemies = [...levelData.enemies];
      newEnemies[priestIndex] = modifiedOriginalPriest;
      newEnemies.splice(priestIndex + 1, 0, priestVariant);

      return {
        ...levelData,
        enemies: newEnemies,
      };
    }
  }

  return levelData;
}

/** 加载关卡详细解包数据 */
export async function loadLevelData(levelId: string) {
  const levelData = await _get<LevelData>(`/gamedata/level/${levelId.toLowerCase().replace(/\//g, "&&")}`);
  // 合并同名，同属性敌人，在加载时处理避免被freeze，以及减少运算
  const mergedEnemies: EnemyData[] = [];
  for (const enemy of levelData.enemies) {
    const existingEnemy = mergedEnemies.find(
      (e) =>
        e.name.m_value === enemy.name.m_value &&
        e.attributes.maxHp.m_value === enemy.attributes.maxHp.m_value &&
        e.attributes.atk.m_value === enemy.attributes.atk.m_value &&
        e.attributes.def.m_value === enemy.attributes.def.m_value &&
        e.attributes.magicResistance.m_value === enemy.attributes.magicResistance.m_value,
    );
    if (!existingEnemy) {
      mergedEnemies.push(enemy);
    }
  }
  levelData.enemies = mergedEnemies;
  return levelData;
}
