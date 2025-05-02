import { StyledTitle } from "~/modules/Tool/components/Shared";
import { styled } from "styled-components";
import React, { useEffect, useMemo, useState } from "react";
import StageSelector from "~/modules/Tool/DamageCalculator/EnemySection/StageSelector";
import EnemyDisplay from "~/modules/Tool/DamageCalculator/EnemySection/EnemyDisplay";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import { useGameDataStore } from "~/stores/gameDataStore";
import type { EnemyDataParsed } from "~/types/gameData";

const StyledEnemySelector = styled.div`
  margin-bottom: 2rem;
`;

export default function EnemySelector() {
  const [activeMode, setActiveMode] = useState("快速选择");
  return (
    <StyledEnemySelector>
      <StyledTitle
        modes={["快速选择", "关卡模式"]}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
      >
        选择敌人
      </StyledTitle>

      {activeMode === "快速选择" && <QuickSelector />}

      {activeMode === "关卡模式" && <StageSelector />}
    </StyledEnemySelector>
  );
}

const QuickSelectorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const QuickSelectorEnemies = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const QuickSelectorEnemy = styled.button`
  width: 4rem;
  height: 4rem;
  border: 2px solid transparent;
  &.active {
    border: 2px solid white;
    box-shadow: 0 0 10px 2px #fff;
  }
`;

const dummy: EnemyDataParsed = {
  id: "dummy",
  level: 0,
  name: "木桩",
  description: "请任意调整木桩数值",
  attributes: {
    maxHp: 0,
    atk: 0,
    def: 0,
    magicResistance: 0,
    blockCnt: 0,
    moveSpeed: 0,
    attackSpeed: 0,
    baseAttackTime: 0,
    epDamageResistance: 0,
    epResistance: 0,
  },
  levelType: "NORMAL",
  rangedRadius: 0,
};

function uniqueByProperty(arr: never[], prop: string) {
  return [...new Map(arr.map((item) => [item[prop], item])).values()];
}

function QuickSelector() {
  const { stageEnemies } = useGameDataStore();
  const { rogueKey, enemyDataParsed, setEnemyDataParsed } =
    useDamageCalculatorStore();

  const popularEnemies = useMemo(() => {
    return uniqueByProperty(
      Object.values(stageEnemies![rogueKey])
        .map((enemies) =>
          enemies.filter(
            (enemyDataParsed) => enemyDataParsed.levelType === "BOSS",
          ),
        )
        .flat() as never,
      "id",
    );
  }, [rogueKey, stageEnemies]);

  useEffect(() => {
    setEnemyDataParsed(dummy);
  }, []);

  return (
    <QuickSelectorWrapper>
      <QuickSelectorEnemies>
        {[dummy, ...popularEnemies].map((enemy) => (
          <QuickSelectorEnemy
            key={enemy.id}
            className={enemy.id === enemyDataParsed?.id ? "active" : ""}
            onClick={() => setEnemyDataParsed(enemy)}
          >
            <EnemyAvatar name={enemy.name} />
          </QuickSelectorEnemy>
        ))}
      </QuickSelectorEnemies>
      <div>{enemyDataParsed && <EnemyDisplay />}</div>
    </QuickSelectorWrapper>
  );
}
