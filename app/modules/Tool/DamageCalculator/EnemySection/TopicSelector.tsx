import type { RogueKey } from "~/types/gameData";
import { useGameDataStore } from "~/stores/gameDataStore";
import { useEffect, useMemo } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import ToolSelect from "~/modules/Tool/components/ToolSelect";
import { outBuffMap } from "~/modules/Tool/DamageCalculator/utils";
import { styled } from "styled-components";
import { StyledTitle } from "~/modules/Tool/components/Shared";

const StyledTopicSelector = styled.div`
  margin-bottom: 1rem;
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
    return array;
  }, [rogueKey]);

  useEffect(() => {
    setDifficulty(difficulties[difficulties.length - 1]);
  }, [difficulties, setDifficulty]);

  useEffect(() => {
    const outBuffs = outBuffMap[rogueKey];
    setOutBuff(outBuffs![outBuffs!.length - 1]);
  }, [rogueKey, setOutBuff]);

  return (
    <StyledTopicSelector>
      <StyledTitle>选择主题</StyledTitle>
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
