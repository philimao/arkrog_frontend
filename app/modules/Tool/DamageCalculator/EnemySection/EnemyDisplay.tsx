import { styled } from "styled-components";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { GridContainer } from "~/modules/Tool/components/Shared";
import { allowedBlackboardKeyMap, camelToSnake } from "~/modules/Tool/DamageCalculator/utils";
import { useEffect, useRef, useState } from "react";
import ToolInput from "~/modules/Tool/components/ToolInput";
import type { EnemyInput, RelicWrapper } from "~/types/gameData";
import EnemySpecSelector, { type EnemySpec } from "./EnemySpecSelector";
import { BuffContext, CalculatorHelper } from "../calculator";
import { useGameDataStore } from "~/stores/gameDataStore";
import EnemyAttribute from "./EnemyAttributes";

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

const StyledName = styled.div`
  font-size: 1.5rem;
  color: white;
  font-weight: bold;
  white-space: nowrap;
  margin-bottom: 0.25rem;
`;

const StyledEnemyAvatar = styled(EnemyAvatar)`
  width: 8.75rem;
  height: 8.75rem;
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

const displayAttrKeys = [
  "maxHp",
  "atk",
  "def",
  "magicResistance",
  "attackSpeed",
  "baseAttackTime",
  "epDamageResistance",
  "epResistance",
  "damageResistance",
];

export default function EnemyDisplay({
  assignToDummy,
  setIllust,
}: {
  assignToDummy: (parsedEnemyData: EnemyInput) => void;
  setIllust: (illust: React.ReactNode) => void;
}) {
  const { items, relics } = useGameDataStore();
  const {
    rogueInput,
    topicSpecItems,
    selectedIds,
    relicsMap,
    rogueKey,
    enemyData,
    stageData,
    levelData,
    enemyDataParsed,
    setEnemyDataParsed,
  } = useDamageCalculatorStore();
  // const [phase, setPhase] = useState<number>(1);

  /** 缓存用户修改后的敌人数据，在blur时应用到store中 */
  const [_enemyDataParsed, _setEnemyDataParsed] = useState<EnemyInput | null>(null);
  /** 缓存初始敌人数据，在恢复初始值时应用 */
  const enemyRef = useRef<EnemyInput | null>(null);

  const [enemySpec, setEnemySpec] = useState<EnemySpec[]>([]);
  const [enemyContext, setEnemyContext] = useState<BuffContext>();

  useEffect(() => {
    const relicList = Object.values(items![rogueKey])
      .filter((item) => item.type === "RELIC")
      .map((item) => ({
        ...item,
        ...relics![rogueKey][item.id],
        show: true,
      }));
    const selectedRelics = selectedIds
      .map((id) => relicsMap[rogueKey]?.find((relic) => relic.id === id))
      .filter((r) => r?.userActive)
      .map((r) => ({
        relicData: relicList.find((relic) => relic.id === r?.id),
        ...r,
      })) as RelicWrapper[];

    let enemyContext = CalculatorHelper.analyzeRelics({
      relics: selectedRelics,
      enemyData: enemyData,
      stageData,
    });
    enemyContext = CalculatorHelper.analyzeRogueDifficulty({ rogueInput: rogueInput }, enemyContext);
    enemyContext = CalculatorHelper.analyzeTopicSpec({ topicSpecItems: topicSpecItems }, enemyContext);
    enemyContext = CalculatorHelper.analyzeEnemySpec({ enemySpec }, enemyContext);
    CalculatorHelper.printAdditionContext(enemyContext, selectedRelics);
    setEnemyContext(enemyContext);
  }, [enemyData, enemySpec, items, relics, relicsMap, rogueInput, rogueKey, selectedIds, stageData, topicSpecItems]);

  /** 计算敌人属性 */
  useEffect(() => {
    if (!enemyContext) return;
    const parsedEnemyData = CalculatorHelper.calculateEnemyAttr({
      enemyData: enemyData,
      stageData: stageData!,
      levelData: levelData!,
      context: enemyContext,
    });
    setEnemyDataParsed(parsedEnemyData);
  }, [enemyContext, enemyData, levelData, stageData, setEnemyDataParsed, _setEnemyDataParsed]);

  /** 当store中的敌人数据更新时，更新缓存 */
  useEffect(() => {
    if (!enemyDataParsed) return;
    _setEnemyDataParsed(enemyDataParsed);
  }, [enemyDataParsed]);

  if (!_enemyDataParsed) return null;

  return (
    <StyledEnemyDisplayWrapper>
      <StyledEnemyDisplayTop>
        <div>
          <StyledName>{_enemyDataParsed.name}</StyledName>
          <StyledEnemyAvatar name={_enemyDataParsed.name} />
        </div>
        <EnemySpecSelector setIllust={setIllust} setEnemySpec={setEnemySpec} />
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
        {_enemyDataParsed.name !== "木桩" ? (
          <StyledAttrFuncButton onClick={() => assignToDummy(_enemyDataParsed)}>复制到木桩</StyledAttrFuncButton>
        ) : (
          <StyledAttrFuncButton onClick={() => setEnemyDataParsed(enemyRef.current as EnemyInput)}>
            恢复初始值
          </StyledAttrFuncButton>
        )}
      </StyledControl>
      <StyledGridContainer>
        {displayAttrKeys.map((key) => {
          const color = key === "maxHp" ? "text-ak-blue" : key === "atk" ? "text-ak-red" : "";
          return (
            <StyledInputWrapper key={key}>
              <div>{allowedBlackboardKeyMap[camelToSnake(key)]}</div>
              {_enemyDataParsed.name !== "木桩" ? (
                <EnemyAttribute attrKey={key} color={color} />
              ) : (
                <ToolInput
                  className={"h-8 font-bold text-xl " + color}
                  value={_enemyDataParsed.attributes[key as never]}
                  setValue={(value: string) => {
                    // TODO parse float
                    const number = parseFloat(value) || 0;
                    const updated = {
                      ..._enemyDataParsed,
                      attributes: {
                        ..._enemyDataParsed.attributes,
                        [key]: number,
                      },
                    };
                    _setEnemyDataParsed(updated);
                  }}
                  onBlur={() => setEnemyDataParsed(_enemyDataParsed)}
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
