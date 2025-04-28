import { StyledTitle } from "~/modules/Tool/components/Shared";
import { styled } from "styled-components";
import React, { useState } from "react";
import StageSelector from "~/modules/Tool/DamageCalculator/EnemySection/StageSelector";
import enemies from "~/modules/Tool/DamageCalculator/EnemySection/popularEnemies";
import EnemyDisplay from "~/modules/Tool/DamageCalculator/EnemySection/EnemyDisplay";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";

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

function QuickSelector() {
  const { enemyDataParsed, setEnemyDataParsed } = useDamageCalculatorStore();
  return (
    <QuickSelectorWrapper>
      <QuickSelectorEnemies>
        {enemies.map((enemy) => (
          <QuickSelectorEnemy
            className={enemy.name === enemyDataParsed?.name ? "active" : ""}
            key={enemy.id}
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
