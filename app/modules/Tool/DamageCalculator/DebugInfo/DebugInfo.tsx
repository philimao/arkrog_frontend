import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { useState } from "react";
import { styled } from "styled-components";
import { Button } from "@heroui/react";

const StyledDebugInfo = styled.div`
  font-size: 0.8rem;
  color: var(--light-mid-gray);
  white-space: pre-wrap;
`;

export default function DebugInfo() {
  const { enemyBase } = useDamageCalculatorStore();
  const [showEnemyBase, setShowEnemyBase] = useState(false);

  return (
    <div className="flex gap-2">
      <div>
        <Button onPress={() => setShowEnemyBase(!showEnemyBase)}>显示敌人解包数据</Button>
        {showEnemyBase && <StyledDebugInfo>{JSON.stringify(enemyBase, null, 2)}</StyledDebugInfo>}
      </div>
    </div>
  );
}
