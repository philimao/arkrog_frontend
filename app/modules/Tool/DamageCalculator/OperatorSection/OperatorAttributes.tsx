import React, { useMemo } from "react";
import { styled } from "styled-components";
import type { CharAttribute } from "~/types/gameData";
import { BuffContext, CalculatorHelper } from "../calculator";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { AttrTag, type AttrCalcToken } from "~/modules/Tool/components/AttrDisplay";
import { ExpressionGroupNode } from "~/modules/Tool/DamageCalculator/calculator/ast";
import ExpressionDisplay from "~/modules/Tool/components/ExpressionDisplay";
import { ExpressionUtil } from "~/modules/Tool/DamageCalculator/calculator/expression-util";
import { getCharImpl } from "../calculator/impls";

const StyledAttributeWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  //grid-template-rows: repeat(6, auto);
  gap: 0.5rem 2rem;
  font-size: 0.8rem;
  justify-content: center;
  background: rgba(24, 24, 24, 0.7);
  padding: 1rem 1.5rem;
  & > div {
    display: flex;
    align-items: center;
    background: var(--black-gray);
    padding: 0 0.5rem;
    height: 44px;
    white-space: nowrap;
    & > span:first-child {
      font-weight: bold;
      margin-right: 1.5rem;
    }
    & > div:last-child {
      margin-left: auto;
      font-family: "NovecentoWide", sans-serif;
      padding: 0;
    }
  }
`;

/** 部署费用属性计算公式 */
export function useCostTagGroups(props: { attribute: CharAttribute; context: BuffContext }): AttrCalcToken[] {
  const { attribute, context } = props;

  const tokens: AttrCalcToken[] = [
    {
      tooltip: "局外",
      tags: [
        <AttrTag tooltip="基础">{attribute?.cost}</AttrTag>,
        ...context.relic_rune_add.cost.children.map((item) => (
          <AttrTag tooltip={item.tooltip}>{item.calculate()}</AttrTag>
        )),
      ],
    },
  ];

  if (tokens[0].tags.length < 2) {
    return [];
  }
  return tokens;
}

export default function OperatorAttributes(props: { mode: "out_game" | "in_game" | "skill" }) {
  const { charData, charInput } = useDamageCalculatorStore();
  const context = useDamageCalculatorStore((state) => state.globalAnalysisResult);

  const result = useMemo(
    () => CalculatorHelper.calculateOutsidePanel({ charInput: charInput, context }),
    [charInput, context],
  );

  const operatorExpression = useMemo((): Record<string, ExpressionGroupNode> => {
    if (props.mode === "out_game") {
      return {
        maxHp: ExpressionUtil.operator_out_game_max_hp({ charInput, context }),
        atk: ExpressionUtil.operator_out_game_atk({ charInput, context }),
        def: ExpressionUtil.operator_out_game_def({ charInput, context }),
        magicResistance: ExpressionUtil.operator_out_game_magic_resistance({ charInput, context }),
        attackSpeed: ExpressionUtil.operator_out_game_attack_speed({ charInput, context }),
        baseAttackTime: ExpressionUtil.operator_out_game_base_attack_time({ charInput, context }),
        respawnTime: ExpressionUtil.operator_out_game_respawn_time({ charInput, context }),
        cost: ExpressionUtil.operator_out_game_cost({ charInput: charInput, context }),
        blockCnt: ExpressionUtil.operator_in_game_block_cnt({ charInput: charInput, context }),
        hpRecoveryPerSec: ExpressionUtil.operator_out_game_hp_recovery_per_sec({ charInput: charInput, context }),
        spRecoveryPerSec: ExpressionUtil.operator_out_game_sp_recovery_per_sec({ charInput: charInput, context }),
        damageScale: ExpressionUtil.operator_out_game_damage_scale({ charInput: charInput, context }),
      };
    } else if (props.mode === "in_game") {
      return {
        maxHp: ExpressionUtil.operator_in_game_max_hp({ charInput: charInput, context }),
        atk: ExpressionUtil.operator_in_game_atk({ charInput: charInput, context }),
        def: ExpressionUtil.operator_in_game_def({ charInput: charInput, context }),
        magicResistance: ExpressionUtil.operator_in_game_magic_resistance({ charInput: charInput, context }),
        attackSpeed: ExpressionUtil.operator_in_game_attack_speed({ charInput: charInput, context }),
        baseAttackTime: ExpressionUtil.operator_in_game_base_attack_time({ charInput: charInput, context }),
        respawnTime: ExpressionUtil.operator_in_game_respawn_time({ charInput: charInput, context }),
        cost: ExpressionUtil.operator_out_game_cost({ charInput: charInput, context }),
        blockCnt: ExpressionUtil.operator_in_game_block_cnt({ charInput: charInput, context }),
        hpRecoveryPerSec: ExpressionUtil.operator_out_game_hp_recovery_per_sec({ charInput: charInput, context }),
        spRecoveryPerSec: ExpressionUtil.operator_out_game_sp_recovery_per_sec({ charInput: charInput, context }),
        damageScale: ExpressionUtil.operator_in_game_damage_scale({ charInput: charInput, context }),
      };
    } else if (props.mode === "skill") {
      const skillContext = context.clone();
      getCharImpl(charData.name).applySkill({ charInput: charInput }, skillContext);
      return {
        maxHp: ExpressionUtil.operator_in_game_max_hp({ charInput: charInput, context: skillContext }),
        atk: ExpressionUtil.operator_in_game_atk({ charInput: charInput, context: skillContext }),
        def: ExpressionUtil.operator_in_game_def({ charInput: charInput, context: skillContext }),
        magicResistance: ExpressionUtil.operator_in_game_magic_resistance({
          charInput: charInput,
          context: skillContext,
        }),
        attackSpeed: ExpressionUtil.operator_in_game_attack_speed({
          charInput: charInput,
          context: skillContext,
        }),
        baseAttackTime: ExpressionUtil.operator_in_game_base_attack_time({
          charInput: charInput,
          context: skillContext,
        }),
        respawnTime: ExpressionUtil.operator_in_game_respawn_time({ charInput: charInput, context: skillContext }),
        cost: ExpressionUtil.operator_out_game_cost({ charInput: charInput, context: skillContext }),
        blockCnt: ExpressionUtil.operator_in_game_block_cnt({ charInput: charInput, context: skillContext }),
        hpRecoveryPerSec: ExpressionUtil.operator_out_game_hp_recovery_per_sec({
          charInput: charInput,
          context: skillContext,
        }),
        spRecoveryPerSec: ExpressionUtil.operator_out_game_sp_recovery_per_sec({
          charInput: charInput,
          context: skillContext,
        }),
        damageScale: ExpressionUtil.operator_in_game_damage_scale({ charInput: charInput, context: skillContext }),
      };
    }
    return {};
  }, [charData.name, charInput, context, props.mode]);

  // const color = key === "maxHp" ? "text-ak-blue" : key === "atk" ? "text-ak-red" : "";
  // const className = "text-sm h-4 px-2 " + color;
  return (
    <StyledAttributeWrapper>
      {result && (
        <>
          <div>
            <span>最大生命值</span>
            <ExpressionDisplay
              mode={props.mode}
              expression={operatorExpression.maxHp}
              className="text-sm h-4 px-2 text-ak-blue"
            />
          </div>
          <div>
            <span>攻击力</span>
            <ExpressionDisplay
              mode={props.mode}
              expression={operatorExpression.atk}
              className="text-sm h-4 px-2 text-ak-red"
            />
          </div>
          <div>
            <span>防御</span>
            <ExpressionDisplay mode={props.mode} expression={operatorExpression.def} className="text-sm h-4 px-2" />
          </div>
          <div>
            <span>法术抗性</span>
            <ExpressionDisplay
              mode={props.mode}
              expression={operatorExpression.magicResistance}
              className="text-sm h-4 px-2"
            />
          </div>
          <div>
            <span>费用</span>
            <ExpressionDisplay mode={props.mode} expression={operatorExpression.cost} className="text-sm h-4 px-2" />
          </div>
          <div>
            <span>阻挡数</span>
            <ExpressionDisplay
              mode={props.mode}
              expression={operatorExpression.blockCnt}
              className="text-sm h-4 px-2"
            />
          </div>
          <div>
            <span>攻击速度</span>
            <ExpressionDisplay
              mode={props.mode}
              expression={operatorExpression.attackSpeed}
              className="text-sm h-4 px-2"
            />
          </div>
          <div>
            <span>攻击间隔</span>
            <ExpressionDisplay
              mode={props.mode}
              expression={operatorExpression.baseAttackTime}
              className="text-sm h-4 px-2"
            />
          </div>
          <div>
            <span>再部署</span>
            <ExpressionDisplay
              mode={props.mode}
              expression={operatorExpression.respawnTime}
              className="text-sm h-4 px-2"
            />
          </div>
          <div>
            <span>每秒生命回复</span>
            <ExpressionDisplay
              mode={props.mode}
              expression={operatorExpression.hpRecoveryPerSec}
              className="text-sm h-4 px-2"
            />
          </div>
          <div>
            <span>每秒技力回复</span>
            <ExpressionDisplay
              mode={props.mode}
              expression={operatorExpression.spRecoveryPerSec}
              className="text-sm h-4 px-2"
            />
          </div>
          <div>
            <span>伤害倍率</span>
            <ExpressionDisplay
              mode={props.mode}
              expression={operatorExpression.damageScale}
              className="text-sm h-4 px-2"
            />
          </div>
        </>
      )}
    </StyledAttributeWrapper>
  );
}
