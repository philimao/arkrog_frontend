import { useGameDataStore } from "~/stores/gameDataStore";
import React, { useMemo, useState } from "react";
import { navOfZone } from "~/utils/stageSelector";
import { Button } from "@heroui/react";
import type { LevelData, StageData } from "~/types/gameData";
import { _post } from "~/utils/tools";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import ToolSelect from "~/modules/Tool/components/ToolSelect";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { styled } from "styled-components";
import EnemyDisplay from "~/modules/Tool/DamageCalculator/EnemySection/EnemyDisplay";
import { GridContainer } from "~/modules/Tool/components/Shared";
import { parseEnemyData } from "~/modules/Tool/DamageCalculator/utils";

const StyledStageSelector = styled.div`
  margin-bottom: 1rem;
`;

const StyledStageSelectorBody = styled.div`
  display: flex;
  height: 30rem;
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
    height: 30rem;
  }
`;

const StyledEnemiesLabel = styled.div`
  height: 1.25rem;
  display: flex;
  font-size: 0.75rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  & > span:first-child {
    margin-right: auto;
    color: var(--light-gray);
  }
  & > span:last-child {
    color: var(--ak-red);
  }
`;

const StyledEnemies = styled.div`
  height: calc(100% - 1.75rem);
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, 4rem);
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(78, 78, 78, 0.5);
  box-shadow: 4px 4px 6px 0 rgba(0, 0, 0, 0.25);
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
    bottom: 0;
    width: 100%;
    height: 4rem;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(36, 36, 36, 0.8) 100%);
    background-blend-mode: darken;
  }
`;

const StyledEnemy = styled.div`
  width: 4rem;
`;

const StyledEnemyName = styled.div`
  padding: 0.1rem 0.15rem;
  font-size: 0.65rem;
  background: var(--black-gray);
  text-align: center;
`;

export default function StageSelector() {
  const { stages } = useGameDataStore();
  const { rogueKey, enemyData, rogueInput, setEnemyData, setEnemyDataParsed, setRogueZone } =
    useDamageCalculatorStore();
  const [stageId, setStageId] = useState<string>("ro4_b_8");
  const [stageData, setStageData] = useState<StageData>();

  const renderStages = useMemo(() => {
    const stageOfRogue = stages![rogueKey];
    const zone = navOfZone.find((zone) => rogueInput[rogueInput.topic].zone === zone.id);
    const result = Object.values(stageOfRogue)
      // 过滤区域关卡
      .filter((stage) => zone!.filter(stage))
      // 排序 BOSS > 普通+紧急
      .sort((a, b) => {
        const argsA = a.id.split("_");
        const argsB = b.id.split("_");
        if (argsA[1] === "b" && argsB[1] !== "b") return -1;
        if (argsA[1] !== "b" && argsB[1] === "b") return 1;
        return parseInt(argsA[3]) - parseInt(argsB[3]);
      });
    console.log("result", result);
    setStageId(result[0].id);
    return result;
  }, [rogueKey, stages, rogueInput]);

  const [levelData, setLevelData] = useState<LevelData>();

  async function handleLoadLevelData() {
    const stageData = stages![rogueKey][stageId];
    setStageData(stageData);
    console.log("stageData", stageData);
    const stageRawData = await _post<LevelData>("/gamedata/level", {
      levelId: stageData.levelId.toLowerCase(),
    });
    console.log("stageRawData", stageRawData);
    setLevelData(stageRawData);
  }

  return (
    <StyledStageSelector>
      <GridContainer>
        <ToolSelect
          disallowEmptySelection={true}
          label="选择区域"
          array={navOfZone}
          getKey={(zone) => zone.id}
          getValue={(zone) => zone.name}
          selectedKeys={[rogueInput[rogueInput.topic].zone]}
          onChange={(evt) => setRogueZone(evt.target.value)}
        />
        <ToolSelect
          disallowEmptySelection={true}
          label="选择关卡"
          array={renderStages}
          getKey={(stage) => stage.id}
          getValue={(stage) => {
            if (stage.isBoss) return `BOSS · ${stage.name}`;
            return `${stage.isElite ? "紧急 · " : ""}${stage.name}`;
          }}
          selectedKeys={[stageId]}
          onChange={(evt) => setStageId(evt.target.value)}
        />

        {stageId && (
          <div className="flex items-end">
            <Button
              radius="none"
              className="h-12 bg-black-gray hover:bg-mid-gray w-full font-bold"
              onPress={handleLoadLevelData}
            >
              加载
            </Button>
          </div>
        )}
      </GridContainer>
      {levelData && (
        <StyledStageSelectorBody>
          <div>
            <StyledEnemiesLabel>
              <span>点击选择敌人</span>
              <span>红名代表死亡后会生成恐卡兹</span>
            </StyledEnemiesLabel>
            <StyledEnemies>
              {levelData.enemies.map((enemyData) => {
                return (
                  <StyledEnemy
                    key={enemyData.id}
                    onClick={() => {
                      setEnemyData(enemyData);
                      setEnemyDataParsed(parseEnemyData(enemyData, stageData!, levelData));
                    }}
                  >
                    <EnemyAvatar name={enemyData.name.m_value} />
                    <StyledEnemyName>{enemyData.name.m_value}</StyledEnemyName>
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
