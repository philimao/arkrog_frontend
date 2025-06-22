import { StyledTitle } from "~/modules/Tool/components/Shared";
import { styled } from "styled-components";
import React, { useState } from "react";
import StageSelector from "~/modules/Tool/DamageCalculator/EnemySection/StageSelector";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";

const StyledEnemySelector = styled.div`
  margin-bottom: 2rem;
`;

export default function EnemySelector() {
  const [activeMode, setActiveMode] = useState("关卡模式");
  const { enemyIllust } = useDamageCalculatorStore();
  return (
    <StyledEnemySelector>
      <StyledTitle modes={["关卡模式"]} activeMode={activeMode} setActiveMode={setActiveMode}>
        {/* <StyledTitle modes={["快速选择", "关卡模式"]} activeMode={activeMode} setActiveMode={setActiveMode}> */}
        选择敌人
      </StyledTitle>

      {/* {activeMode === "快速选择" && <QuickSelector />} */}

      {activeMode === "关卡模式" && <StageSelector />}

      {enemyIllust}
    </StyledEnemySelector>
  );
}

// const QuickSelectorWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 1rem;
// `;

// const QuickSelectorEnemies = styled.div`
//   display: flex;
//   flex-wrap: wrap;
//   gap: 1rem;
// `;

// const QuickSelectorEnemy = styled.button`
//   width: 4rem;
//   height: 4rem;
//   border: 2px solid transparent;
//   &.active {
//     border: 2px solid white;
//     box-shadow: 0 0 10px 2px #fff;
//   }
// `;

// function uniqueByProperty(arr: never[], prop: string) {
//   return [...new Map(arr.map((item) => [item[prop], item])).values()];
// }

// function QuickSelector() {
//   const { stageEnemies } = useGameDataStore();
//   const { rogueInput, enemyInput, setEnemyInput } = useDamageCalculatorStore();

//   const popularEnemies = useMemo(() => {
//     return uniqueByProperty(
//       Object.values(stageEnemies![rogueInput.topic])
//         .map((enemies) => enemies.filter((enemyInput) => enemyInput.levelType === "BOSS"))
//         .flat() as never,
//       "id",
//     );
//   }, [rogueInput.topic, stageEnemies]);

//   useEffect(() => {
//     setEnemyInput(dummy);
//   }, [setEnemyInput]);

//   return (
//     <QuickSelectorWrapper>
//       <QuickSelectorEnemies>
//         {[dummy, ...popularEnemies].map((enemy) => (
//           <QuickSelectorEnemy
//             key={enemy.id}
//             className={enemy.id === enemyInput?.id ? "active" : ""}
//             onClick={() => {
//               console.log(enemy);
//               setEnemyInput(enemy);
//             }}
//           >
//             <EnemyAvatar name={enemy.name} />
//           </QuickSelectorEnemy>
//         ))}
//       </QuickSelectorEnemies>
//       <div>{enemyInput && <EnemyDisplay setIllust={() => {}} />}</div>
//     </QuickSelectorWrapper>
//   );
// }
