import type { RogueKey } from "~/types/gameData";
import { useGameDataStore } from "~/stores/gameDataStore";
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
  const { setRogueKey, setRogueDifficulty, setRogueTech: setRougeTech, rogueInput } = useDamageCalculatorStore();

  const rogueKey = rogueInput.topic;

  // 难度选择
  const difficulties = (() => {
    let array;
    // if (rogueKey === "rogue_1") array = ["王冠", "乌萨斯弯刀"];
    if (rogueKey === "rogue_1")
      array = [
        { label: "游玩", value: 0 },
        { label: "王冠", value: 1 },
        { label: "乌萨斯弯刀", value: 2 },
      ];
    else if (rogueKey === "rogue_4" || rogueKey === "rogue_2")
      // 水月有N18了
      array = Array(19)
        .fill(0)
        .map((_, i) => ({ label: "N" + i, value: i }));
    else
      array = Array(16)
        .fill(0)
        .map((_, i) => ({ label: "N" + i, value: i }));
    return array;
  })();

  return (
    <StyledTopicSelector>
      <StyledTitle>选择主题</StyledTitle>
      <div className="grid gap-x-4 gap-y-1" style={{ gridTemplateColumns: "repeat(auto-fill, 15rem)" }}>
        <ToolSelect<{ id: string; name: string }>
          disallowEmptySelection={true}
          label="肉鸽主题"
          array={Object.values(topics!)}
          getKey={(item) => item.id}
          getValue={(item) => item.name}
          selectedKeys={[rogueKey]}
          onChange={(evt) => setRogueKey(evt.target.value as RogueKey)}
          isDisabled
        />
        <ToolSelect
          disallowEmptySelection={true}
          label="难度选择"
          array={difficulties}
          getKey={(levelItem) => levelItem.value.toString()}
          getValue={(levelItem) => levelItem.label}
          selectedKeys={[rogueInput[rogueKey].difficulty.toString()]}
          onChange={(evt) => setRogueDifficulty(parseInt(evt.target.value))}
        />
        {rogueKey === "rogue_4" && (
          <ToolSelect
            disallowEmptySelection={true}
            label="科技树加成"
            array={outBuffMap[rogueKey]!}
            selectedKeys={[rogueInput[rogueKey].tech]}
            onChange={(evt) => setRougeTech(evt.target.value)}
          />
        )}
      </div>
    </StyledTopicSelector>
  );
}
