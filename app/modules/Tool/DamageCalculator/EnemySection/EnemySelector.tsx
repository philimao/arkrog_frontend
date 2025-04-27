import { StyledTitle } from "~/modules/Tool/components/Shared";
import { styled } from "styled-components";
import { useState } from "react";
import StageSelector from "~/modules/Tool/DamageCalculator/EnemySection/StageSelector";

const StyledEnemySelector = styled.div`
  margin-bottom: 2rem;
`;

export default function EnemySelector() {
  const [activeMode, setActiveMode] = useState("关卡模式");
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
`;

function QuickSelector() {
  return (
    <QuickSelectorWrapper>
      {["1", "2", "3"].map((e) => (
        <div key={e}>{e}</div>
      ))}
    </QuickSelectorWrapper>
  );
}
