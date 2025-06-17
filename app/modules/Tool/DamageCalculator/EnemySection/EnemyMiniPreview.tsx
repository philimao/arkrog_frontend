import { styled } from "styled-components";
import { GridContainer } from "../../components/Shared";
import { displayAttrKeys, StyledEnemyTag, StyledEnmeyLevelBadge } from "./EnemyDisplay";
import EnemyAttribute from "./EnemyAttributes";
import { allowedBlackboardKeyMap, camelToSnake } from "../utils";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { enemyTagMap, levelTypeMap } from "./enemyUtils";

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
  const { enemyDataParsed, enemyContext } = useDamageCalculatorStore();

  if (!enemyContext) return null;

  return (
    <div className="flex flex-col">
      <StyledEnemyHeader>
        <StyledName>{enemyDataParsed.name}</StyledName>
        <div className="flex gap-2">
          <StyledEnmeyLevelBadge $levelType={enemyDataParsed.levelType}>
            {levelTypeMap[enemyDataParsed.levelType]}
          </StyledEnmeyLevelBadge>
          {enemyDataParsed.enemyTags.length > 0 && (
            <StyledEnemyTag>{enemyTagMap[enemyDataParsed.enemyTags[0]]}</StyledEnemyTag>
          )}
        </div>
      </StyledEnemyHeader>
      <StyledGridContainer>
        {Object.keys(displayAttrKeys).map((key) => {
          const color = key === "maxHp" ? "text-ak-blue" : key === "atk" ? "text-ak-red" : "";
          const className = "text-sm h-4 px-2 " + color;
          return (
            <StyledInputWrapper key={key}>
              <div className="ps-3 me-auto">{allowedBlackboardKeyMap[camelToSnake(key)]}</div>
              <EnemyAttribute
                attrKey={key}
                baseValue={enemyDataParsed.attributes[key as never]}
                className={className}
                context={enemyContext}
              />
            </StyledInputWrapper>
          );
        })}
      </StyledGridContainer>
    </div>
  );
}
