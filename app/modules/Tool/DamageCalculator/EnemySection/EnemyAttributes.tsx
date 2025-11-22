import React, { useMemo } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { AttrDisplay, AttrTag, type AttrCalcToken } from "~/modules/Tool/components/AttrDisplay";
import type { BuffContext } from "../calculator/buff-context";
import type { EnemyAttribute } from "~/types/gameData";
import { mergeClassNameSafe } from "~/utils/tools";

function getMaxHpTagGroups(props: { baseValue: number; context: BuffContext }): AttrCalcToken[] {
  const { baseValue, context } = props;
  return [
    {
      tooltip: "局内",
      tags: [<AttrTag tooltip="基础">{baseValue}</AttrTag>],
    },
    {
      tooltip: "乘区",
      tags: [
        ...context.relic_rune_mul.enemy_max_hp.children.map((item) => (
          <AttrTag tooltip={item.tooltip}>{item.calculate().toFixed(2)}</AttrTag>
        )),
        ...context.in_game_buff_final_mul.enemy_max_hp.children.map((item) => (
          <AttrTag tooltip={item.tooltip}>{item.calculate().toFixed(2)}</AttrTag>
        )),
      ],
    },
  ];
}

function getAtkTagGroups(props: { baseValue: number; context: BuffContext }): AttrCalcToken[] {
  const { baseValue, context } = props;
  return [
    {
      tooltip: "局内",
      tags: [<AttrTag tooltip="基础">{baseValue}</AttrTag>],
    },
    ...context.in_game_buff_final_mul.enemy_atk.children.map((item) => ({
      tooltip: item.tooltip,
      tags: [<AttrTag tooltip={item.tooltip}>{item.calculate().toFixed(2)}</AttrTag>],
    })),
  ];
}

function getDefTagGroups(props: { baseValue: number; context: BuffContext }): AttrCalcToken[] {
  const { baseValue, context } = props;
  return [
    {
      tooltip: "局内",
      tags: [<AttrTag tooltip="基础">{baseValue}</AttrTag>],
    },
    ...context.in_game_buff_final_mul.enemy_def.children.map((item) => ({
      tooltip: item.tooltip,
      tags: [<AttrTag tooltip={item.tooltip}>{item.calculate().toFixed(2)}</AttrTag>],
    })),
  ];
}

export default function EnemyAttribute({
  attrKey,
  value,
  className = "",
  context,
}: {
  attrKey: string;
  value?: number;
  className?: string;
  context: BuffContext | null;
}) {
  const { enemyBase } = useDamageCalculatorStore();

  // 使用 useMemo 来避免重复计算 TagGroups
  const calcTokens = useMemo((): AttrCalcToken[] => {
    if (!context) return [];
    if (attrKey === "maxHp") {
      return getMaxHpTagGroups({ baseValue: enemyBase.attributes.maxHp, context });
    } else if (attrKey === "atk") {
      return getAtkTagGroups({ baseValue: enemyBase.attributes.atk, context });
    } else if (attrKey === "def") {
      return getDefTagGroups({ baseValue: enemyBase.attributes.def, context });
    }
    return [];
  }, [attrKey, enemyBase, context]);

  return (
    <div className={mergeClassNameSafe("bg-black-gray px-3 leading-8 h-8 font-bold text-xl", className)}>
      <AttrDisplay calcTokens={calcTokens}>{value}</AttrDisplay>
    </div>
  );
}
