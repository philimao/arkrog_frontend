import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import ToolSelect from "~/modules/Tool/components/ToolSelect";
import ToolButton from "~/modules/Tool/components/ToolButton";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { styled } from "styled-components";
import EnemyDisplay from "~/modules/Tool/DamageCalculator/EnemySection/EnemyDisplay";
import { GridContainer } from "~/modules/Tool/components/Shared";
import { getNavOfZone } from "./enemyUtils";
import { parseBlackboardEntry } from "../utils";
import { cosHost } from "~/utils/tools";
import type { StageData } from "~/types/gameData";
import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";

const StyledStageSelector = styled.div`
  margin-bottom: 1rem;
`;

const StyledControlLabel = styled.div`
  height: calc(0.875rem + 10px);
  line-height: calc(0.875rem + 10px);
  font-size: 0.8rem;
  color: rgb(236, 237, 238);
  user-select: none;
`;

const StyledStageSelectorBody = styled.div`
  display: flex;
  height: 34rem;
  align-items: stretch;
  & > div:first-child {
    flex-grow: 1;
    max-height: 100%;
    max-width: 35rem;
    margin-right: 1.5rem;
    position: relative;
  }
  & > div:last-child {
    flex-shrink: 0;
    width: 33rem;
  }
`;

const StyledEnemiesLabel = styled.div`
  height: 1.25rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  & > span:first-child {
    color: var(--light-gray);
  }
  & > span.parasitic-hint {
    color: var(--ak-red);
  }
`;

const StyledEnemies = styled.div`
  height: calc(100% - 1.75rem);
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, 4rem);
  gap: 0.5rem;
  align-content: start;
  align-items: start;
  justify-content: center;
  padding: 0.5rem;
  background: rgba(78, 78, 78, 0.5);
  box-shadow: 4px 4px 6px 0 rgba(0, 0, 0, 0.25);
  user-select: none;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--light-gray);
  }
  &::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0.3);
  }
  &::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 4rem;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(36, 36, 36, 0.8) 100%);
    background-blend-mode: darken;
  }
`;

const StyledEnemy = styled.div<{ $selected: boolean }>`
  box-shadow: ${({ $selected }) => ($selected ? "0px 0px 10px 2px #FFF" : "none")};
  width: 4rem;
`;

const ignoreEnemyNames = ["温迪戈大盾", "年代印痕", "昔日道标", "仅剩的创意", "受符"];
const ignoreEnemyIds = [
  "enemy_1324_wdsdw", //萨卡兹悖谬裂变学徒（虚像）
];

export default function StageSelector() {
  const {
    renderStages,
    setRogueStageId,
    levelData,
    enemyData,
    rogueInput,
    zones,
    stageId,
    stageData,
    setEnemyData,
    setRogueZone,
    setRogueLayer,
  } = useDamageCalculatorStore();

  const [stageQuickSelectorVisible, setStageQuickSelectorVisible] = useState(false);

  const clickHandlerRef = useRef<(evt: MouseEvent) => void>((evt: MouseEvent) => {
    if (!(evt.target as HTMLElement).closest(".stage-quick-selector")) {
      // 点击外部区域关闭快速选择器
      document.removeEventListener("click", clickHandlerRef.current);
      setStageQuickSelectorVisible(false);
    }
  });

  // 用于渲染区域选择器
  const zoneList = getNavOfZone(rogueInput.topic, zones);

  // 快速切换紧急/普通
  const switchDifficultyTarget = renderStages.find(
    (stage) => stage.name === stageData.name && stage.isElite !== stageData.isElite,
  )?.id;

  return (
    <StyledStageSelector>
      <GridContainer className="relative">
        <ToolSelect
          disallowEmptySelection={true}
          label="选择区域"
          array={zoneList}
          getKey={(zone) => zone.id}
          getValue={(zone) => zone.name}
          selectedKeys={[rogueInput[rogueInput.topic].zone]}
          onChange={(evt) => setRogueZone(evt.target.value)}
        />
        <div>
          <StyledControlLabel>选择关卡</StyledControlLabel>
          <ToolButton
            className="font-bold justify-start"
            onPress={() =>
              setStageQuickSelectorVisible((prev) => {
                if (!prev) document.addEventListener("click", clickHandlerRef.current);
                return !prev;
              })
            }
          >
            {stageData?.stageName || stageData?.name || "未选择"}
          </ToolButton>
        </div>
        <StageQuickSelector
          visible={stageQuickSelectorVisible}
          setVisible={setStageQuickSelectorVisible}
          renderStages={renderStages}
          stageId={stageId}
          handlerRef={clickHandlerRef}
        />
        <ToolSelect
          disallowEmptySelection={true}
          label="选择层数"
          array={[
            { id: "layer_1", name: "第一层" },
            { id: "layer_2", name: "第二层" },
            { id: "layer_3", name: "第三层" },
            { id: "layer_4", name: "第四层" },
            { id: "layer_5", name: "第五层" },
            { id: "layer_6", name: "第六层" },
            { id: "layer_7", name: "第七层" },
          ]}
          getKey={(layer) => layer.id}
          getValue={(layer) => layer.name}
          selectedKeys={[rogueInput[rogueInput.topic].layer]}
          onChange={(evt) => setRogueLayer(evt.target.value)}
        />
        {stageData.eliteDesc && (
          <div className="flex flex-col whitespace-nowrap" style={{ color: "rgb(236, 237, 238)", fontSize: "0.8rem" }}>
            <StyledControlLabel>紧急条件</StyledControlLabel>
            <div className="relative h-12">
              <div className="absolute top-0 left-0 flex flex-col justify-center bg-dark-gray h-12 px-2">
                <div>{stageData.eliteDesc}</div>
                <div>
                  {levelData.runes
                    .find((rune) => rune.key === "enemy_attribute_mul")
                    ?.blackboard.map((bb) => parseBlackboardEntry(bb, true))
                    .join(", ")}
                </div>
              </div>
            </div>
          </div>
        )}
      </GridContainer>
      {levelData && (
        <StyledStageSelectorBody>
          <div>
            <StyledEnemiesLabel>
              <span>点击选择敌人</span>
              {switchDifficultyTarget && (
                <span
                  className={"cursor-pointer " + (stageData.isElite ? "" : "text-ak-red")}
                  onClick={() => setRogueStageId(switchDifficultyTarget)}
                >
                  点击跳转至{stageData.isElite ? "普通" : "紧急"}
                </span>
              )}
              {rogueInput.topic === "rogue_4" && <span className="parasitic-hint">红点代表死亡后会生成恐卡兹</span>}
            </StyledEnemiesLabel>
            <StyledEnemies>
              {levelData.enemies
                .filter(
                  (enemy) => !ignoreEnemyNames.includes(enemy.name.m_value!) && !ignoreEnemyIds.includes(enemy.id),
                )
                .map((_enemyData) => {
                  // 被恐卡兹寄生（小红点）
                  const parasitized = !!_enemyData.talentBlackboard?.find(
                    (bb) => bb.key === "parasitic" && bb.valueStr === "true",
                  );
                  const displayName = _enemyData.displayName?.m_value || _enemyData.name.m_value;
                  return (
                    <StyledEnemy
                      key={_enemyData.id}
                      $selected={_enemyData.id === enemyData?.id}
                      onClick={() => {
                        setEnemyData(_enemyData);
                      }}
                    >
                      <EnemyAvatar
                        name={_enemyData.name.m_value}
                        displayName={displayName!}
                        fontSize="0.65rem"
                        parasitized={parasitized}
                      />
                    </StyledEnemy>
                  );
                })}
            </StyledEnemies>
          </div>
          <div>{enemyData && <EnemyDisplay />}</div>
        </StyledStageSelectorBody>
      )}
    </StyledStageSelector>
  );
}

const StyledStageQuickSelector = styled.div<{ $visible: boolean }>`
  display: ${(props) => (props.$visible ? "grid" : "none")};
  position: absolute;
  top: 5rem;
  left: 0;
  max-width: 100%;
  background: var(--black-gray);
  z-index: 50;
  gap: 0.5rem 1rem;
  grid-template-columns: repeat(auto-fit, 15rem);
  padding: 1rem 0;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -1rem;
    width: calc(100% + 2rem);
    height: 100%;
    background: var(--black-gray);
    border-radius: 0.5rem;
  }
`;

const StyledStageItem = styled.div<{ $active: boolean }>`
  position: relative;
  padding: 0.5rem;
  margin: 0.25rem;
  background: ${({ $active }) => ($active ? "var(--ak-blue)" : "var(--dark-gray)")};
  color: ${({ $active }) => ($active ? "black" : "inherit")};
  font-size: 0.9rem;
  font-weight: ${({ $active }) => ($active ? "bold" : "normal")};
  text-align: center;
  cursor: pointer;
`;

const StyledMainEnemies = styled.div<{ $visible: string }>`
  position: absolute;
  display: ${({ $visible }) => ($visible ? "flex" : "none")};
  top: 50%;
  right: 0.5rem;
  box-shadow: 0px 0px 2px 1px #ffffff40;
  transform: translateY(-50%);
  z-index: 100;
`;

function StageQuickSelector({
  visible,
  setVisible,
  handlerRef,
  renderStages,
  stageId,
}: {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  handlerRef: RefObject<(evt: MouseEvent) => void>;
  renderStages: StageData[];
  stageId: string;
}) {
  const { setRogueStageId } = useDamageCalculatorStore();

  return (
    <StyledStageQuickSelector $visible={visible} className="stage-quick-selector">
      {renderStages.map((stage) => {
        return (
          <StyledStageItem
            key={stage.id}
            $active={stage.id === stageId}
            onClick={() => {
              setRogueStageId(stage.id);
              setVisible(false);
              document.removeEventListener("click", handlerRef.current);
            }}
          >
            {stage.stageName}
            <StyledMainEnemies $visible={stage.mainEnemy}>
              <EnemyAvatar name={stage.mainEnemy} className="w-8 h-8" />
            </StyledMainEnemies>
          </StyledStageItem>
        );
      })}
    </StyledStageQuickSelector>
  );
}
