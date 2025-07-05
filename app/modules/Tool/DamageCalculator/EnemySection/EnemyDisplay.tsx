import { styled } from "styled-components";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { GridContainer } from "~/modules/Tool/components/Shared";
import { allowedBlackboardKeyMap, camelToSnake } from "~/modules/Tool/DamageCalculator/utils";
import { useEffect, useRef, useState } from "react";
import ToolInput from "~/modules/Tool/components/ToolInput";
import type { EnemyInput } from "~/types/gameData";
import EnemySpecSelector from "./EnemySpecSelector";
import { Tooltip } from "~/modules/Tool/components/SafeHeroPortal";
import { enemyTagMap, levelTypeMap } from "./enemyUtils";
import ExpressionDisplay from "../../components/ExpressionDisplay";
import { displayAttrKeys } from "~/stores/damageCalculator/calcUtils/enemyUtils";

const StyledEnemyDisplayWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
`;

const StyledEnemyDisplayTop = styled.div`
  display: flex;
  gap: 1rem;
  align-items: stretch;
  min-height: 0;
  & > * {
    width: 50%;
  }
`;

const StyledEnemyLeftInfo = styled.div``;

const StyledEnemyHeader = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const StyledName = styled.div`
  font-size: 1.5rem;
  color: white;
  font-weight: bold;
  white-space: nowrap;
`;

export const StyledEnemyTag = styled.div`
  font-size: 0.8rem;
  color: white;
  font-weight: bold;
  white-space: nowrap;
  border-radius: 0.25rem;
  padding: 0.1rem 0.5rem;
  background: var(--mid-gray);
`;

export const StyledEnmeyLevelBadge = styled(StyledEnemyTag)<{ $levelType: string }>`
  background: ${({ $levelType }) => {
    if ($levelType === "BOSS") return "var(--ak-purple)";
    if ($levelType === "ELITE") return "var(--ak-red)";
    return "var(--mid-gray)";
  }};
`;

const StyledEnemyAvatar = styled(EnemyAvatar)`
  width: 10rem;
  height: 10rem;
  background: rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 0 0 0.5rem white;
`;

const StyledControl = styled.div`
  display: flex;
  align-items: end;
`;

// const StyledPhase = styled.div`
//   display: flex;
//   gap: 1rem;
// `;

// const StyledPhaseItem = styled.button<{ $active: boolean }>`
//   color: ${(props) => (props.$active ? "var(--ak-blue)" : "white")};
//   font-weight: bold;
// `;

const StyledAttrFuncButton = styled.button`
  margin-left: auto;
  padding: 0 0.5rem;
  background: var(--dark-gray);
  color: white;
  font-size: 0.8rem;
`;

const StyledGridContainer = styled(GridContainer)`
  flex-grow: 1;
  background: rgba(24, 24, 24, 0.7);
  padding: 1rem;
  margin-bottom: 0;
`;

const StyledInputWrapper = styled.div`
  & > div:first-child {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
    font-weight: bold;
    padding-left: 0.75rem;
    color: var(--light-mid-gray);
  }
  & > *:last-child {
    font-family: "NovecentoWide", sans-serif;
  }
`;

export default function EnemyDisplay() {
  const { enemyData, enemyBase, setEnemyData, enemyExpression, setEnemyBase } = useDamageCalculatorStore();

  /** 输入期间缓存敌人数据，在blur时应用到store中 */
  const [enemyCache, setEnemyCache] = useState<EnemyInput | null>(null);
  /** 缓存初始敌人数据，在恢复初始值时应用 */
  const enemyRef = useRef<EnemyInput | null>(null);

  /** blur后敌人面板更新时，同步缓存 */
  useEffect(() => {
    setEnemyCache(enemyBase);
    enemyRef.current = enemyBase;
  }, [enemyBase]);

  /** 复制敌人当前面板到木桩 */
  function assignToDummy() {
    setEnemyData({
      ...enemyData,
      id: "enemy_000_dummy",
      name: { m_value: "木桩", m_defined: true },
    });
  }

  if (!enemyCache) return null;

  return (
    <StyledEnemyDisplayWrapper>
      <StyledEnemyDisplayTop>
        <StyledEnemyLeftInfo>
          <StyledEnemyHeader>
            <StyledName>{enemyBase.name}</StyledName>
            <div className="flex gap-2">
              <StyledEnmeyLevelBadge
                $levelType={enemyBase.levelType}
                role={enemyBase.name === "木桩" ? "button" : "none"}
                onClick={() => {
                  if (enemyBase.name === "木桩") {
                    setEnemyData({
                      ...enemyData,
                      levelType: {
                        m_defined: true,
                        m_value: enemyBase.levelType === "NORMAL" ? "ELITE" : "NORMAL",
                      },
                    });
                  }
                }}
              >
                {levelTypeMap[enemyBase.levelType]}
              </StyledEnmeyLevelBadge>
              {enemyBase.enemyTags.length > 0 && <StyledEnemyTag>{enemyTagMap[enemyBase.enemyTags[0]]}</StyledEnemyTag>}
            </div>
          </StyledEnemyHeader>
          <StyledEnemyAvatar name={enemyBase.name} />
        </StyledEnemyLeftInfo>
        <EnemySpecSelector />
      </StyledEnemyDisplayTop>
      <StyledControl>
        {/* <StyledPhase>
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <StyledPhaseItem $active={phase === i + 1} onClick={() => setPhase(i + 1)} key={i}>
                {i + 1 + "阶段"}
              </StyledPhaseItem>
            ))}
        </StyledPhase> */}
        {enemyBase.name !== "木桩" ? (
          <StyledAttrFuncButton onClick={() => assignToDummy()}>复制到木桩</StyledAttrFuncButton>
        ) : (
          <StyledAttrFuncButton onClick={() => setEnemyBase(enemyRef.current as EnemyInput)}>
            恢复初始值
          </StyledAttrFuncButton>
        )}
      </StyledControl>
      <StyledGridContainer>
        {Object.keys(displayAttrKeys).map((key) => {
          const color = key === "maxHp" ? "text-ak-blue" : key === "atk" ? "text-ak-red" : "";
          return (
            <StyledInputWrapper key={key}>
              <div className="flex justify-between">
                <span>{allowedBlackboardKeyMap[camelToSnake(key)]}</span>
                {displayAttrKeys[key].tooltip && (
                  <Tooltip content={displayAttrKeys[key].tooltip} closeDelay={100}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <use href="#question_circle" />
                    </svg>
                  </Tooltip>
                )}
              </div>
              {enemyCache.name !== "木桩" ? (
                <ExpressionDisplay
                  mode="in_game"
                  className={color}
                  expression={enemyExpression[key]}
                ></ExpressionDisplay>
              ) : (
                <ToolInput
                  className={"h-8 font-bold text-xl " + color}
                  value={enemyCache.attributes[key as never]}
                  setValue={(value: string) => {
                    const updated = {
                      ...enemyCache,
                      attributes: {
                        ...enemyCache.attributes,
                        [key]: value,
                      },
                    };
                    setEnemyCache(updated);
                  }}
                  onBlur={() => {
                    // 解析浮点数，失败则设置为0
                    let number = parseFloat(enemyCache.attributes[key as never]) || 0;
                    const { min, max } = displayAttrKeys[key as never];
                    // 应用数据边界
                    if (min !== undefined && number < min) number = min;
                    if (max !== undefined && number > max) number = max;
                    const updated = {
                      ...enemyCache,
                      attributes: {
                        ...enemyCache.attributes,
                        [key]: number,
                      },
                    };
                    setEnemyBase(updated);
                  }}
                  onEnter={(evt) => {
                    evt.preventDefault();
                    evt.currentTarget.querySelector("input")!.blur();
                  }}
                />
              )}
            </StyledInputWrapper>
          );
        })}
      </StyledGridContainer>
    </StyledEnemyDisplayWrapper>
  );
}
