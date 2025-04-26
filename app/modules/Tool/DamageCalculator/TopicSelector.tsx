import type { RogueKey } from "~/types/gameData";
import { useGameDataStore } from "~/stores/gameDataStore";
import { useMemo } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import ToolSelect from "~/modules/Tool/components/ToolSelect";
import { outBuffMap } from "~/modules/Tool/DamageCalculator/utils";
import { styled } from "styled-components";

const StyledTopicSelector = styled.div`
  margin-bottom: 1rem;
`;

const StyledTitle = styled.div`
  height: 3rem;
  font-weight: bold;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  border-bottom: var(--ak-blue) 1px solid;
`;

export default function TopicSelector() {
  const { topics } = useGameDataStore();
  const {
    rogueKey,
    setRogueKey,
    difficulty,
    setDifficulty,
    outBuff,
    setOutBuff,
  } = useDamageCalculatorStore();

  // 难度选择
  const difficulties = useMemo(() => {
    let array;
    if (rogueKey === "rogue_1") array = ["王冠", "乌萨斯弯刀"];
    else if (rogueKey === "rogue_4" || rogueKey === "rogue_2")
      // 水月有N18了
      array = Array(19)
        .fill(0)
        .map((_, i) => "N" + i);
    else
      array = Array(16)
        .fill(0)
        .map((_, i) => "N" + i);
    setDifficulty(array.slice(-1)[0]);
    return array;
  }, [rogueKey, setDifficulty]);

  return (
    <StyledTopicSelector>
      <StyledTitle>选择肉鸽</StyledTitle>
      <div
        className="grid gap-x-4 gap-y-1"
        style={{ gridTemplateColumns: "repeat(auto-fill, 15rem)" }}
      >
        <ToolSelect<{ id: string; name: string }>
          disallowEmptySelection={true}
          label="肉鸽主题"
          array={Object.values(topics!)}
          getKey={(item) => item.id}
          getValue={(item) => item.name}
          selectedKeys={[rogueKey]}
          onChange={(evt) => setRogueKey(evt.target.value as RogueKey)}
        />
        <ToolSelect<string>
          disallowEmptySelection={true}
          label="难度选择"
          array={difficulties}
          selectedKeys={[difficulty]}
          onChange={(evt) => setDifficulty(evt.target.value)}
        />
        <ToolSelect
          disallowEmptySelection={true}
          label="科技树加成"
          array={outBuffMap[rogueKey]!}
          selectedKeys={[outBuff]}
          onChange={(evt) => setOutBuff(evt.target.value)}
        />
      </div>
    </StyledTopicSelector>
  );
}
