import { styled } from "styled-components";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { GridContainer } from "~/modules/Tool/components/Shared";
import { allowedBlackboardKeyMap, camelToSnake } from "~/modules/Tool/DamageCalculator/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import ToolInput from "~/modules/Tool/components/ToolInput";
import type { EnemyInput, RelicWrapper } from "~/types/gameData";
import EnemySpecSelector from "./EnemySpecSelector";
import { BuffContext, CalculatorHelper } from "../calculator";
import { useGameDataStore } from "~/stores/gameDataStore";
import EnemyAttribute from "./EnemyAttributes";
import { Tooltip } from "@heroui/react";
import { enemyTagMap, levelTypeMap, parseEnemyData } from "./enemyUtils";

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

const StyledEnemyTag = styled.div`
  font-size: 0.8rem;
  color: white;
  font-weight: bold;
  white-space: nowrap;
  border-radius: 0.25rem;
  padding: 0.1rem 0.5rem;
  background: var(--mid-gray);
`;

const StyledEnmeyLevelBadge = styled(StyledEnemyTag)<{ $levelType: string }>`
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

const displayAttrKeys: Record<string, { min: number; max?: number; tooltip?: React.ReactNode }> = {
  maxHp: {
    min: 0,
  },
  atk: {
    min: 0,
  },
  def: {
    min: 0,
  },
  magicResistance: {
    min: 0,
  },
  // attackSpeed: {
  //   min: 0,
  //   max: 600,
  // },
  // baseAttackTime: {
  //   min: 0,
  // },
  epResistance: {
    min: 0,
  },
  epDamageResistance: {
    min: 0,
  },
  damageResistance: {
    min: 0,
    max: 1,
    tooltip: (
      <ul className="text-sm p-2">
        <li>敌人特殊能力，例如大特的减伤</li>
        <li>年代印痕减伤</li>
        <li>以上两种类型之间取概率并集</li>
      </ul>
    ),
  },
};

export default function EnemyDisplay({ setIllust }: { setIllust: (illust: React.ReactNode) => void }) {
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
    enemySpec,
    setEnemySpec,
    setEnemyData,
    setEnemyDataParsed,
  } = useDamageCalculatorStore();
  // const [phase, setPhase] = useState<number>(1);

  /** 缓存用户修改后的敌人数据，在blur时应用到store中 */
  const [_enemyDataParsed, _setEnemyDataParsed] = useState<EnemyInput | null>(null);
  /** 缓存初始敌人数据，在恢复初始值时应用 */
  const enemyRef = useRef<EnemyInput | null>(null);

  const relicList = useMemo(
    () =>
      Object.values(items![rogueKey])
        .filter((item) => item.type === "RELIC")
        .map((item) => ({
          ...item,
          ...relics![rogueKey][item.id],
          show: true,
        })),
    [items, relics, rogueKey],
  );

  const selectedRelics = useMemo(
    () =>
      selectedIds
        .map((id) => relicsMap[rogueKey]?.find((relic) => relic.id === id))
        .filter((r) => r?.userActive)
        .map((r) => ({
          relicData: relicList.find((relic) => relic.id === r?.id),
          ...r,
        })) as RelicWrapper[],
    [relicList, relicsMap, rogueKey, selectedIds],
  );

  /** 计算敌人加成上下文 */
  const [enemyContext, setEnemyContext] = useState<BuffContext | null>(null);

  // useEffect(() => {
  //   console.log("enemyContext", enemyContext);
  // }, [enemyContext]);

  // useEffect(() => {
  //   console.log("enemyData", enemyData);
  // }, [enemyData]);

  // useEffect(() => {
  //   console.log("enemySpec", enemySpec);
  // }, [enemySpec]);

  useEffect(() => {
    // 选择敌人数据后，等待敌人特殊效果加成计算完成，减少重新渲染
    if (!enemyData || !enemySpec || enemySpec.id !== enemyData.id) return;
    // 如果是木桩，不计算敌人加成
    if (enemyData.name.m_value === "木桩") return;
    let enemyContext = CalculatorHelper.analyzeRelics({
      relics: selectedRelics,
      enemyData: enemyData,
      stageData,
    });
    enemyContext = CalculatorHelper.analyzeRogueDifficulty(
      { rogueInput: rogueInput, enemyData: enemyData },
      enemyContext,
    );
    enemyContext = CalculatorHelper.analyzeTopicSpec(
      { topicSpecItems: topicSpecItems, enemyData: enemyData },
      enemyContext,
    );
    enemyContext = CalculatorHelper.analyzeEnemySpec({ enemySpec }, enemyContext);
    CalculatorHelper.printAdditionContext(enemyContext, selectedRelics);
    setEnemyContext(enemyContext);
  }, [enemyData, enemySpec, rogueInput, selectedRelics, stageData, topicSpecItems]);

  /** 敌人数据基础值 */
  const enemyBaseRef = useRef<EnemyInput | null>(null);

  useEffect(() => {
    if (!enemyData || !stageData || !levelData) return;
    enemyBaseRef.current = parseEnemyData(enemyData, stageData, levelData);
  }, [enemyData, levelData, stageData]);

  /** 计算敌人属性 */
  useEffect(() => {
    if (!enemyContext || !enemyBaseRef.current) return;
    const parsedEnemyData = CalculatorHelper.calculateEnemyAttr({
      enemyInput: enemyBaseRef.current!,
      context: enemyContext,
    });
    // 复制到木桩时，保留初始值的减伤
    if (enemyRef.current && enemyRef.current.name !== "木桩" && parsedEnemyData.name === "木桩") {
      parsedEnemyData.attributes.damageResistance = enemyRef.current.attributes.damageResistance;
    }
    // 深拷贝初始值
    enemyRef.current = JSON.parse(JSON.stringify(parsedEnemyData));
    setEnemyDataParsed(parsedEnemyData);
  }, [enemyContext, setEnemyDataParsed, _setEnemyDataParsed]);

  /** 当store中的敌人数据更新时，更新缓存 */
  useEffect(() => {
    if (!enemyDataParsed) return;
    _setEnemyDataParsed(enemyDataParsed);
  }, [enemyDataParsed]);

  function assignToDummy() {
    setEnemyData({
      ...enemyData,
      id: "enemy_000_dummy",
      name: { m_value: "木桩", m_defined: true },
    });
    setEnemySpec({
      id: "enemy_000_dummy",
      value: [],
    });
    // 计算敌人属性需要buffContext变化，但木桩没有加成，所以需要重新创建
    setEnemyContext(CalculatorHelper.createAdditionContext());
  }

  if (!_enemyDataParsed) return null;

  return (
    <StyledEnemyDisplayWrapper>
      <StyledEnemyDisplayTop>
        <StyledEnemyLeftInfo>
          <StyledEnemyHeader>
            <StyledName>{_enemyDataParsed.name}</StyledName>
            <div className="flex gap-2">
              <StyledEnmeyLevelBadge
                $levelType={_enemyDataParsed.levelType}
                role={_enemyDataParsed.name === "木桩" ? "button" : "none"}
                onClick={() => {
                  if (_enemyDataParsed.name === "木桩") {
                    setEnemyData({
                      ...enemyData,
                      levelType: {
                        m_defined: true,
                        m_value: _enemyDataParsed.levelType === "NORMAL" ? "ELITE" : "NORMAL",
                      },
                    });
                    setEnemyContext(CalculatorHelper.createAdditionContext());
                  }
                }}
              >
                {levelTypeMap[_enemyDataParsed.levelType]}
              </StyledEnmeyLevelBadge>
              {_enemyDataParsed.enemyTags.length > 0 && (
                <StyledEnemyTag>{enemyTagMap[_enemyDataParsed.enemyTags[0]]}</StyledEnemyTag>
              )}
            </div>
          </StyledEnemyHeader>
          <StyledEnemyAvatar name={_enemyDataParsed.name} />
        </StyledEnemyLeftInfo>
        <EnemySpecSelector setIllust={setIllust} enemyData={enemyData} />
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
          <StyledAttrFuncButton onClick={() => assignToDummy()}>复制到木桩</StyledAttrFuncButton>
        ) : (
          <StyledAttrFuncButton onClick={() => setEnemyDataParsed(enemyRef.current as EnemyInput)}>
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
                  <Tooltip content={displayAttrKeys[key].tooltip}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <use href="#question_circle" />
                    </svg>
                  </Tooltip>
                )}
              </div>
              {_enemyDataParsed.name !== "木桩" ? (
                <EnemyAttribute
                  attrKey={key}
                  baseValue={enemyBaseRef.current?.attributes[key as never]}
                  color={color}
                  context={enemyContext}
                />
              ) : (
                <ToolInput
                  className={"h-8 font-bold text-xl " + color}
                  value={_enemyDataParsed.attributes[key as never]}
                  setValue={(value: string) => {
                    const updated = {
                      ..._enemyDataParsed,
                      attributes: {
                        ..._enemyDataParsed.attributes,
                        [key]: value,
                      },
                    };
                    _setEnemyDataParsed(updated);
                  }}
                  onBlur={() => {
                    // 解析浮点数，失败则设置为0
                    let number = parseFloat(_enemyDataParsed.attributes[key as never]) || 0;
                    const { min, max } = displayAttrKeys[key as never];
                    // 应用数据边界
                    if (min !== undefined && number < min) number = min;
                    if (max !== undefined && number > max) number = max;
                    const updated = {
                      ..._enemyDataParsed,
                      attributes: {
                        ..._enemyDataParsed.attributes,
                        [key]: number,
                      },
                    };
                    _setEnemyDataParsed(updated);
                    setEnemyDataParsed(updated);
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
        <StyledInputWrapper>
          <div className="flex justify-between">
            <span>局外物理法术减伤</span>
            <Tooltip
              content={
                <ul className="text-sm p-2">
                  <li>五结局藏品终结的骨架/躯体/实相（20%减伤）</li>
                  <li>N10以上精英领袖减伤（10%减伤）</li>
                  <li>算法为取最大值</li>
                </ul>
              }
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <use href="#question_circle" />
              </svg>
            </Tooltip>
          </div>
          <div>
            <EnemyAttribute
              attrKey="damageResistance"
              attributeValue={enemyContext?.relic_rune_mul.enemy_damage_resistance.calculate()}
              baseValue={enemyBaseRef.current?.attributes.damageResistance}
              color="text-ak-green"
              context={enemyContext}
            />
          </div>
        </StyledInputWrapper>
      </StyledGridContainer>
    </StyledEnemyDisplayWrapper>
  );
}
