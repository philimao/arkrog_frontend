import { useGameDataStore } from "~/stores/gameDataStore";
import React, { useMemo, useState, useEffect } from "react";
import { navOfZone } from "~/utils/stageSelector";
import type { EnemyInput, LevelData } from "~/types/gameData";
import { _get } from "~/utils/tools";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import ToolSelect from "~/modules/Tool/components/ToolSelect";
import { dummy, useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { styled } from "styled-components";
import EnemyDisplay from "~/modules/Tool/DamageCalculator/EnemySection/EnemyDisplay";
import { GridContainer } from "~/modules/Tool/components/Shared";
import { debounce } from "@heroui/shared-utils";

const StyledStageSelector = styled.div`
  margin-bottom: 1rem;
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
    left: 0;
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

export default function StageSelector({ setIllust }: { setIllust: (illust: React.ReactNode) => void }) {
  const { stages } = useGameDataStore();
  const {
    stageData,
    levelData,
    setLevelData,
    rogueKey,
    enemyData,
    rogueInput,
    setEnemyData,
    setEnemyDataParsed,
    setRogueZone,
    setStageData,
  } = useDamageCalculatorStore();
  const [stageId, setStageId] = useState<string>("");

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
        const softMap: Record<string, number> = {
          b: 1,
          duel: 2,
          e: 4,
          n: 4,
        };
        if (softMap[argsA[1]] !== softMap[argsB[1]]) return softMap[argsA[1]] - softMap[argsB[1]];
        return parseInt(argsA[3]) - parseInt(argsB[3]);
      });
    // 防止heroui select报错array与key不匹配
    setStageId("");
    return result;
  }, [rogueKey, stages, rogueInput]);

  // 处理区域选择变化后，renderStages的副作用
  useEffect(() => {
    if (renderStages.length > 0) {
      setStageId(renderStages[0].id);
      setStageData(renderStages[0]);
    }
  }, [renderStages, setEnemyData, setEnemyDataParsed, setStageData]);

  // 处理关卡选择变化后，加载stageData的副作用
  useEffect(() => {
    async function handleLoadLevelData() {
      if (!stageData) {
        setLevelData(undefined as never);
        return;
      }
      const stageRawData = await _get<LevelData>(
        `/gamedata/level/${encodeURIComponent(stageData.levelId.toLowerCase())}`,
      );
      setLevelData(stageRawData);
    }
    setEnemyData(undefined as never);
    setEnemyDataParsed(dummy);
    debounce(() => {
      handleLoadLevelData();
    }, 500)();
  }, [setEnemyData, setEnemyDataParsed, setLevelData, stageData]);

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
            if (stage.id.includes("duel")) return `狭路 · ${stage.name}`;
            return `${stage.isElite ? "紧急 · " : "普通 · "}${stage.name}`;
          }}
          selectedKeys={[stageId]}
          onChange={(evt) => {
            setStageId(evt.target.value);
            setStageData(stages![rogueKey][evt.target.value]);
          }}
        />

        {/* {stageId && (
          <div className="flex items-end">
            <Button
              radius="none"
              className="h-12 bg-black-gray hover:bg-mid-gray w-full font-bold"
              onPress={handleLoadLevelData}
            >
              加载
            </Button>
          </div>
        )} */}
      </GridContainer>
      {levelData && (
        <StyledStageSelectorBody>
          <div>
            <StyledEnemiesLabel>
              <span>点击选择敌人</span>
              {/* <span>红名代表死亡后会生成恐卡兹</span> TODO */}
            </StyledEnemiesLabel>
            <StyledEnemies>
              {levelData.enemies
                .filter((enemy) => !["年代印痕", "昔日道标"].includes(enemy.name.m_value))
                .map((enemyData) => {
                  return (
                    <StyledEnemy
                      key={enemyData.id}
                      onClick={() => {
                        setEnemyData(enemyData);
                      }}
                    >
                      <EnemyAvatar name={enemyData.name.m_value} />
                      <StyledEnemyName>{enemyData.name.m_value}</StyledEnemyName>
                    </StyledEnemy>
                  );
                })}
            </StyledEnemies>
          </div>
          <div>{enemyData && <EnemyDisplay setIllust={setIllust} />}</div>
        </StyledStageSelectorBody>
      )}
    </StyledStageSelector>
  );
}
