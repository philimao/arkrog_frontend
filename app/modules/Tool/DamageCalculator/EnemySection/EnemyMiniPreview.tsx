import { styled } from "styled-components";
import { GridContainer } from "../../components/Shared";
import { StyledEnemyTag, StyledEnmeyLevelBadge } from "./EnemyDisplay";
import { displayAttrKeys } from "~/stores/damageCalculator/calcUtils/enemyUtils";
import { allowedBlackboardKeyMap, camelToSnake } from "../utils";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { enemyTagMap, levelTypeMap } from "./enemyUtils";
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
  const { enemyExpression, enemyBase } = useDamageCalculatorStore();

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
              {enemyExpression[key] ? (
                <ExpressionDisplay
                  mode="out_game"
                  className={className}
                  expression={enemyExpression[key]}
                ></ExpressionDisplay>
              ) : (
                <div className={className}>{enemyBase.attributes[key as never]}</div>
              )}
            </StyledInputWrapper>
          );
        })}
      </StyledGridContainer>
    </div>
  );
}
