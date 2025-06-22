import React, { useMemo } from "react";
import { styled } from "styled-components";
import type { CharAttribute } from "~/types/gameData";
import { BuffContext, CalculatorHelper } from "../calculator";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { AttrTag, type AttrCalcToken } from "~/modules/Tool/components/AttrDisplay";
import { ExpressionGroupNode } from "~/modules/Tool/DamageCalculator/calculator/ast";
import ExpressionDisplay from "~/modules/Tool/components/ExpressionDisplay";
import { ExpressionUtil } from "~/modules/Tool/DamageCalculator/calculator/expression-util";

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
  const { charState } = useDamageCalculatorStore();
  const context = useDamageCalculatorStore((state) => state.globalAnalysisResult);

  const result = useMemo(
    () => CalculatorHelper.calculateOutsidePanel({ charInput: charState, context }),
    [charState, context],
  );

  const enemyExpression = useMemo((): Record<string, ExpressionGroupNode> => {
    if (props.mode === "out_game") {
      return {
        maxHp: ExpressionUtil.operator_out_game_max_hp({ charState, context }),
        atk: ExpressionUtil.operator_out_game_atk({ charState, context }),
        def: ExpressionUtil.operator_out_game_def({ charState, context }),
        attackSpeed: ExpressionUtil.operator_out_game_attack_speed({ charState, context }),
        cost: ExpressionUtil.operator_out_game_cost({ charState, context }),
        hpRecoveryPerSec: ExpressionUtil.operator_out_game_hp_recovery_per_sec({ charState, context }),
        spRecoveryPerSec: ExpressionUtil.operator_out_game_sp_recovery_per_sec({ charState, context }),
      };
    } else if (props.mode === "in_game") {
      return {
        maxHp: ExpressionUtil.operator_in_game_max_hp({ charState, context }),
        atk: ExpressionUtil.operator_in_game_atk({ charState, context }),
        def: ExpressionUtil.operator_in_game_def({ charState, context }),
        attackSpeed: ExpressionUtil.operator_in_game_attack_speed({ charState, context }),
        cost: ExpressionUtil.operator_out_game_cost({ charState, context }),
        hpRecoveryPerSec: ExpressionUtil.operator_out_game_hp_recovery_per_sec({ charState, context }),
        spRecoveryPerSec: ExpressionUtil.operator_out_game_sp_recovery_per_sec({ charState, context }),
      };
    } else if (props.mode === "skill") {
      return {
        maxHp: ExpressionUtil.operator_skill_max_hp({ charState, context }),
        // atk: ExpressionUtil.operator_skill_atk({ charInput: props.charInput, context }),
      };
    }
    return {};
  }, [charState, context, props.mode]);

  // const color = key === "maxHp" ? "text-ak-blue" : key === "atk" ? "text-ak-red" : "";
  // const className = "text-sm h-4 px-2 " + color;
  return (
    <StyledAttributeWrapper>
      {result && (
        <>
          <div>
            <span>最大生命值</span>
            <ExpressionDisplay expression={enemyExpression.maxHp} className="text-sm h-4 px-2 text-ak-blue" />
          </div>

          <div>
            <span>攻击力</span>
            <ExpressionDisplay expression={enemyExpression.atk} className="text-sm h-4 px-2 text-ak-red" />
          </div>
          <div>
            <span>防御</span>
            <ExpressionDisplay expression={enemyExpression.def} className="text-sm h-4 px-2" />
          </div>
          <div>
            <span>法术抗性</span>
            <div>{result.magicResistance}</div>
          </div>
          <div>
            <span>费用</span>
            <ExpressionDisplay expression={enemyExpression.cost} className="text-sm h-4 px-2" />
          </div>
          <div>
            <span>阻挡数</span>
            <div>{result.blockCnt}</div>
          </div>
          <div>
            <span>攻击速度</span>
            <ExpressionDisplay expression={enemyExpression.attackSpeed} className="text-sm h-4 px-2" />
          </div>
          <div>
            <span>攻击间隔</span>
            <div>{result.baseAttackTime}</div>
          </div>
          <div>
            <span>再部署</span>
            <div>{result.respawnTime}</div>
          </div>
          <div>
            <span>每秒生命回复</span>
            <ExpressionDisplay expression={enemyExpression.hpRecoveryPerSec} className="text-sm h-4 px-2" />
          </div>
          <div>
            <span>每秒技力回复</span>
            <ExpressionDisplay expression={enemyExpression.spRecoveryPerSec} className="text-sm h-4 px-2" />
          </div>
          <div>
            <span>伤害倍率</span>
            <div>{result.damageScale}</div>
          </div>
        </>
      )}
    </StyledAttributeWrapper>
  );
}
