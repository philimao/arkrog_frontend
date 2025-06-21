import { styled } from "styled-components";
import { GridContainer } from "../../components/Shared";
import { displayAttrKeys, StyledEnemyTag, StyledEnmeyLevelBadge } from "./EnemyDisplay";
import { allowedBlackboardKeyMap, camelToSnake } from "../utils";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { enemyTagMap, levelTypeMap } from "./enemyUtils";
import { CalculatorHelper } from "../calculator/helper";
import { useEffect, useState } from "react";
import { ExpressionUtil } from "../calculator/expression-util";
import { ExpressionGroupNode, NumericLiteralNode } from "../calculator/ast";
import ExpressionDisplay from "../../components/ExpressionDisplay";

const StyledEnemyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(24, 24, 24, 0.7);
  padding: 1rem 1.5rem 0 1.5rem;
`;

const StyledName = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
`;

const StyledInputWrapper = styled.div`
  display: flex;
  align-items: center;
  background: var(--black-gray);
  font-weight: bold;
  & > *:last-child {
    font-family: "NovecentoWide", sans-serif;
  }
`;

const StyledGridContainer = styled(GridContainer)`
  flex-grow: 1;
  background: rgba(24, 24, 24, 0.7);
  padding: 1rem 1.5rem;
  margin-bottom: 0;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem 2rem;
  font-size: 0.8rem;
`;

export default function EnemyMiniPreview() {
  const { enemyBase, globalAnalysisResult } = useDamageCalculatorStore();
  const [enemyExpression, setEnemyExpression] = useState<Record<string, ExpressionGroupNode>>({});

  useEffect(() => {
    if (enemyBase.name === "木桩") {
      return;
    }
    const enemyInput = CalculatorHelper.calculateEnemyAttr({
      enemyBase,
      context: globalAnalysisResult,
    });
    setEnemyExpression({
      maxHp: ExpressionUtil.enemy_final_max_hp({ enemyBase, context: globalAnalysisResult }),
      atk: ExpressionUtil.enemy_final_atk({ enemyBase, context: globalAnalysisResult }),
      def: ExpressionUtil.enemy_final_def({ enemyBase, context: globalAnalysisResult }),
      magicResistance: new ExpressionGroupNode("+", "法术抗性").addChild(
        new NumericLiteralNode(enemyInput.attributes.magicResistance, "法术抗性"),
      ),
      epResistance: new ExpressionGroupNode("+", "损伤抵抗").addChild(
        new NumericLiteralNode(enemyInput.attributes.epResistance, "损伤抵抗"),
      ),
      epDamageResistance: new ExpressionGroupNode("+", "元素伤害抗性").addChild(
        new NumericLiteralNode(enemyInput.attributes.epDamageResistance, "元素伤害抗性"),
      ),
      damageResistance: ExpressionUtil.enemy_final_physical_magic_resistance({
        enemyBase,
        context: globalAnalysisResult,
      }),
    });
  }, [enemyBase, globalAnalysisResult]);

  return (
    <div className="flex flex-col">
      <StyledEnemyHeader>
        <StyledName>{enemyBase.name}</StyledName>
        <div className="flex gap-2">
          <StyledEnmeyLevelBadge $levelType={enemyBase.levelType}>
            {levelTypeMap[enemyBase.levelType]}
          </StyledEnmeyLevelBadge>
          {enemyBase.enemyTags.length > 0 && <StyledEnemyTag>{enemyTagMap[enemyBase.enemyTags[0]]}</StyledEnemyTag>}
        </div>
      </StyledEnemyHeader>
      <StyledGridContainer>
        {Object.keys(displayAttrKeys).map((key) => {
          const color = key === "maxHp" ? "text-ak-blue" : key === "atk" ? "text-ak-red" : "";
          const className = "text-sm h-4 px-2 " + color;
          return (
            <StyledInputWrapper key={key}>
              <div className="ps-3 me-auto">{allowedBlackboardKeyMap[camelToSnake(key)]}</div>
              <ExpressionDisplay className={className} expression={enemyExpression[key]}></ExpressionDisplay>
            </StyledInputWrapper>
          );
        })}
      </StyledGridContainer>
    </div>
  );
}
