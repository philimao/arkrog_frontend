import React, { useMemo } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { AttrDisplay, AttrTag, type AttrCalcToken } from "~/modules/Tool/components/AttrDisplay";
import type { BuffContext } from "../calculator/buff-context";
import type { EnemyAttribute } from "~/types/gameData";

function getMaxHpTagGroups(props: { baseValue: number; context: BuffContext }): AttrCalcToken[] {
  const { baseValue, context } = props;
  return [
    {
      tooltip: "局内",
      tags: [<AttrTag tooltip="基础">{baseValue}</AttrTag>],
    },
    ...context.in_game_buff_final_mul.enemy_max_hp.children.map((item) => ({
      tooltip: item.tooltip,
      tags: [<AttrTag tooltip={item.tooltip}>{item.calculate().toFixed(2)}</AttrTag>],
    })),
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
  attributeValue,
  baseValue,
  color,
  context,
}: {
  attrKey: string;
  attributeValue?: number;
  baseValue?: number;
  color: string;
  context: BuffContext | null;
}) {
  const { enemyDataParsed } = useDamageCalculatorStore();

  const _attributeValue = attributeValue !== undefined ? attributeValue : enemyDataParsed.attributes[attrKey as never];

  // 使用 useMemo 来避免重复计算 TagGroups
  const calcTokens = useMemo((): AttrCalcToken[] => {
    if (!context || !baseValue) return [];
    if (attrKey === "maxHp") {
      return getMaxHpTagGroups({ baseValue, context });
    } else if (attrKey === "atk") {
      return getAtkTagGroups({ baseValue, context });
    } else if (attrKey === "def") {
      return getDefTagGroups({ baseValue, context });
    }
    return [];
  }, [attrKey, baseValue, context]);

  return (
    <div className={"bg-black-gray px-3 leading-8 h-8 font-bold text-xl " + color}>
      <AttrDisplay calcTokens={calcTokens}>{_attributeValue}</AttrDisplay>
    </div>
  );
}
