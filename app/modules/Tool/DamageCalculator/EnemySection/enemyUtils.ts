import type { EnemyData, EnemyInput, LevelData, StageData } from "~/types/gameData";
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
export function parseEnemyData(enemyData: EnemyData, stageData: StageData, levelData: LevelData): EnemyInput {
  const stageDifficulty = stageData.difficulty;
  const runes = levelData.runes || [];
  const rune = runes.find(
    (rune) =>
      rune.key === "enemy_attribute_mul" && (rune.difficultyMask === stageDifficulty || rune.difficultyMask === "ALL"),
  )?.blackboard;
  const atk_mul = rune?.find((bb) => bb.key === "atk")?.value || 1;
  const def_mul = rune?.find((bb) => bb.key === "def")?.value || 1;
  const hp_mul = rune?.find((bb) => bb.key === "max_hp")?.value || 1;

  const attributes = enemyData.attributes;
  return {
    id: enemyData.id,
    level: enemyData.level,
    name: parseDefinedData(enemyData.name)!,
    description: parseDefinedData(enemyData.description)!,
    attributes: {
      maxHp: parseDefinedData(attributes.maxHp)! * hp_mul,
      atk: parseDefinedData(attributes.atk)! * atk_mul,
      def: parseDefinedData(attributes.def)! * def_mul,
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
