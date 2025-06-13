import React, { useMemo } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { AttrDisplay, AttrTag, type AttrCalcToken } from "~/modules/Tool/components/AttrDisplay";
import type { EnemyData, LevelData, StageData } from "~/types/gameData";
import { parseDefinedData } from "~/modules/Tool/DamageCalculator/utils";

/** 敌人最大生命值属性计算公式 */
export function getEnemyMaxHpTagGroups(props: { baseHp: number; hpMul: number }): AttrCalcToken[] {
  const { baseHp, hpMul } = props;

  if (hpMul === 1) {
    return [];
  }

  return [
    {
      tooltip: "基础",
      tags: [<AttrTag tooltip="基础生命值">{baseHp}</AttrTag>],
    },
    {
      tooltip: "难度倍率",
      tags: [<AttrTag tooltip="关卡难度影响">{hpMul}</AttrTag>],
    },
  ];
}

/** 敌人攻击力属性计算公式 */
export function getEnemyAtkTagGroups(props: { baseAtk: number; atkMul: number }): AttrCalcToken[] {
  const { baseAtk, atkMul } = props;

  if (atkMul === 1) {
    return [];
  }

  return [
    {
      tooltip: "基础",
      tags: [<AttrTag tooltip="基础攻击力">{baseAtk}</AttrTag>],
    },
    {
      tooltip: "难度倍率",
      tags: [<AttrTag tooltip="关卡难度影响">{atkMul}</AttrTag>],
    },
  ];
}

/** 敌人防御属性计算公式 */
export function getEnemyDefTagGroups(props: { baseDef: number; defMul: number }): AttrCalcToken[] {
  const { baseDef, defMul } = props;

  if (defMul === 1) {
    return [];
  }

  return [
    {
      tooltip: "基础",
      tags: [<AttrTag tooltip="基础防御力">{baseDef}</AttrTag>],
    },
    {
      tooltip: "难度倍率",
      tags: [<AttrTag tooltip="关卡难度影响">{defMul}</AttrTag>],
    },
  ];
}

/** 获取敌人属性的难度倍率信息 */
export function getEnemyDifficultyMultipliers(enemyData: EnemyData, stageData: StageData, levelData: LevelData) {
  const stageDifficulty = stageData.difficulty;
  const runes = levelData.runes || [];
  const rune = runes.find(
    (rune) =>
      rune.key === "enemy_attribute_mul" && (rune.difficultyMask === stageDifficulty || rune.difficultyMask === "ALL"),
  )?.blackboard;

  const atkMul = rune?.find((bb) => bb.key === "atk")?.value || 1;
  const defMul = rune?.find((bb) => bb.key === "def")?.value || 1;
  const hpMul = rune?.find((bb) => bb.key === "max_hp")?.value || 1;

  const baseHp = parseDefinedData(enemyData.attributes.maxHp);
  const baseAtk = parseDefinedData(enemyData.attributes.atk);
  const baseDef = parseDefinedData(enemyData.attributes.def);

  return {
    baseHp,
    baseAtk,
    baseDef,
    hpMul,
    atkMul,
    defMul,
  };
}

export default function EnemyAttribute({
  attrKey,
  attributeValue,
  color,
}: {
  attrKey: string;
  attributeValue?: number;
  color: string;
}) {
  const { enemyDataParsed, enemyData, stageData, levelData } = useDamageCalculatorStore();

  // 使用 useMemo 来避免重复计算倍率信息
  const multipliers = useMemo(() => {
    if (enemyData && stageData && levelData) {
      return getEnemyDifficultyMultipliers(enemyData, stageData, levelData);
    }
    return null;
  }, [enemyData, stageData, levelData]);

  // 使用 useMemo 来避免重复计算 TagGroups
  const calcTokens = useMemo((): AttrCalcToken[] => {
    if (!multipliers) return [];

    if (attrKey === "maxHp") {
      return getEnemyMaxHpTagGroups({ baseHp: multipliers.baseHp, hpMul: multipliers.hpMul });
    } else if (attrKey === "atk") {
      return getEnemyAtkTagGroups({ baseAtk: multipliers.baseAtk, atkMul: multipliers.atkMul });
    } else if (attrKey === "def") {
      return getEnemyDefTagGroups({ baseDef: multipliers.baseDef, defMul: multipliers.defMul });
    }
    return [];
  }, [multipliers, attrKey]);

  const _attributeValue = attributeValue || enemyDataParsed.attributes[attrKey as never];

  return (
    <div className={"bg-black-gray px-3 leading-8 h-8 font-bold text-xl " + color}>
      <AttrDisplay calcTokens={calcTokens}>{_attributeValue}</AttrDisplay>
    </div>
  );
}
