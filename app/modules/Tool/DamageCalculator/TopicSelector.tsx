import type { RogueKey } from "~/types/gameData";
import { Select, SelectItem } from "@heroui/react";
import { useGameDataStore } from "~/stores/gameDataStore";
import { type Dispatch, type SetStateAction, useMemo } from "react";

export default function TopicSelector({
  rogueKey,
  setRogueKey,
  difficulty,
  setDifficulty,
}: {
  rogueKey: RogueKey;
  setRogueKey: Dispatch<SetStateAction<RogueKey>>;
  difficulty: string;
  setDifficulty: Dispatch<SetStateAction<string>>;
}) {
  const { topics } = useGameDataStore();

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
    <div
      className="grid"
      style={{ gridTemplateColumns: "repeat(auto-fill, 15rem)" }}
    >
      <Select
        disallowEmptySelection={true}
        label="选择肉鸽主题"
        selectedKeys={[rogueKey]}
        onChange={(evt) => setRogueKey(evt.target.value as RogueKey)}
      >
        {Object.values(topics!).map((topic) => (
          <SelectItem key={topic.id}>{topic.name}</SelectItem>
        ))}
      </Select>
      <Select
        disallowEmptySelection={true}
        label="难度选择"
        selectedKeys={[difficulty]}
        onChange={(evt) => setDifficulty(evt.target.value)}
      >
        {difficulties.map((difficulty) => (
          <SelectItem key={difficulty}>{difficulty}</SelectItem>
        ))}
      </Select>
    </div>
  );
}
