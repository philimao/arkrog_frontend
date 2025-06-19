import type { EnemyData, EnemyInput, StageData } from "~/types/gameData";
import { parseDefinedData } from "../utils";

export const enemyTagMap: Record<string, string> = {
  infection: "感染生物",
  collapsal: "坍缩体",
  animated: "化物",
  seamonster: "海怪",
  drone: "无人机",
  machine: "机械",
  origen: "源石造物",
  sarkaz: "萨卡兹",
  mutant: "宿主",
  originiumartscraft: "法术造物",
  wildanimal: "野生动物",
};

export const levelTypeMap: Record<string, string> = {
  NORMAL: "普通",
  ELITE: "精英",
  BOSS: "领袖",
};

/**
 * 解析敌人数据
 * @param enemyData
 * @param stageData 关卡数据（用于获取难度）
 * @param levelData 关卡数据（用于获取符文）
 * @returns
 */
export function parseEnemyData(enemyData: EnemyData): EnemyInput {
  const attributes = enemyData.attributes;
  return {
    id: enemyData.id,
    level: enemyData.level,
    name: parseDefinedData(enemyData.name)!,
    description: parseDefinedData(enemyData.description)!,
    attributes: {
      maxHp: parseDefinedData(attributes.maxHp)!,
      atk: parseDefinedData(attributes.atk)!,
      def: parseDefinedData(attributes.def)!,
      magicResistance: parseDefinedData(attributes.magicResistance)!,
      cost: parseDefinedData(attributes.cost)!,
      blockCnt: parseDefinedData(attributes.blockCnt)!,
      moveSpeed: parseDefinedData(attributes.moveSpeed)!,
      attackSpeed: parseDefinedData(attributes.attackSpeed)!,
      baseAttackTime: parseDefinedData(attributes.baseAttackTime)!,
      respawnTime: parseDefinedData(attributes.respawnTime)!,
      hpRecoveryPerSec: parseDefinedData(attributes.hpRecoveryPerSec)!,
      spRecoveryPerSec: parseDefinedData(attributes.spRecoveryPerSec)!,
      maxDeployCount: parseDefinedData(attributes.maxDeployCount)!,
      massLevel: parseDefinedData(attributes.massLevel)!,
      baseForceLevel: parseDefinedData(attributes.baseForceLevel)!,
      tauntLevel: parseDefinedData(attributes.tauntLevel)!,
      disarmedCombatImmune: parseDefinedData(attributes.disarmedCombatImmune)!,
      fearedImmune: parseDefinedData(attributes.fearedImmune)!,
      epDamageResistance: parseDefinedData(attributes.epDamageResistance)!,
      epResistance: parseDefinedData(attributes.epResistance)!,
      damageHitratePhysical: parseDefinedData(attributes.damageHitratePhysical)!,
      damageHitrateMagical: parseDefinedData(attributes.damageHitrateMagical)!,
      stunImmune: parseDefinedData(attributes.stunImmune)!,
      silenceImmune: parseDefinedData(attributes.silenceImmune)!,
      sleepImmune: parseDefinedData(attributes.sleepImmune)!,
      frozenImmune: parseDefinedData(attributes.frozenImmune)!,
      levitateImmune: parseDefinedData(attributes.levitateImmune)!,
      damageResistance: 0,
    },
    levelType: parseDefinedData(enemyData.levelType)!,
    rangedRadius: parseDefinedData(enemyData.rangeRadius),
    applyWay: parseDefinedData(enemyData.applyWay)!,
    enemyTags: parseDefinedData(enemyData.enemyTags) || [],
  };
}

export const navOfZone = [
  {
    id: "zone_1",
    name: "第一层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if (args[1] !== "n" && args[1] !== "e") return false;
      return args[2] === "1";
    },
  },
  {
    id: "zone_2",
    name: "第二层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if (args[1] !== "n" && args[1] !== "e") return false;
      return args[2] === "2";
    },
  },
  {
    id: "zone_3",
    name: "第三层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if ((args[1] === "n" || args[1] === "e") && args[2] === "3") return true;
      if (args[1] === "b" && ["1", "2", "3"].includes(args[2])) return true;
      if (args[1] === "duel") return true;
      return false;
    },
  },
  {
    id: "zone_4",
    name: "第四层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if ((args[1] === "n" || args[1] === "e") && args[2] === "4") return true;
      if (args[1] === "duel") return true;
      return false;
    },
  },
  {
    id: "zone_5",
    name: "第五层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if ((args[1] === "n" || args[1] === "e") && args[2] === "5") return true;
      if (args[1] === "b" && ["4", "5"].includes(args[2])) return true;
      if (args[1] === "duel") return true;
      return false;
    },
  },
  {
    id: "zone_6",
    name: "第六层 · 爱国者",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if ((args[1] === "n" || args[1] === "e") && (args[2] === "6" || args[2] === "7")) return true;
      if (args[1] === "b" && ["6"].includes(args[2])) return true;
      return false;
    },
  },
  {
    id: "zone_7",
    name: "第六层 · 奎隆",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if ((args[1] === "n" || args[1] === "e") && (args[2] === "6" || args[2] === "7")) return true;
      if (args[1] === "b" && ["7"].includes(args[2])) return true;
      return false;
    },
  },
  {
    id: "zone_8",
    name: "第七层 · 魔王阿米娅",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if (args[1] === "b" && ["8"].includes(args[2])) return true;
      return false;
    },
  },
];
