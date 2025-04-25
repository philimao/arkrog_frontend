import { useGameDataStore } from "~/stores/gameDataStore";
import React, { useEffect, useState } from "react";
import Loading from "~/components/Loading";
import OperatorSelector from "~/modules/Tool/DamageCalculator/OperatorSelector";
import RelicSelector from "~/modules/Tool/DamageCalculator/RelicSelector";
import type { CharData, EnemyData, RogueKey } from "~/types/gameData";
import TopicSelector from "~/modules/Tool/DamageCalculator/TopicSelector";
import StageSelector from "~/modules/Tool/DamageCalculator/StageSelector";

export default function ToolIndex() {
  const { fetchGameDataExt, fetchCharacterRaw } = useGameDataStore();
  const [loading, setLoading] = useState(true);

  const [charData, setCharData] = useState<CharData>();
  const [enemyData, setEnemyData] = useState<EnemyData | undefined>();

  const [rogueKey, setRogueKey] = useState<RogueKey>("rogue_4");
  const [difficulty, setDifficulty] = useState<string>("N15");

  useEffect(() => {
    Promise.all([fetchCharacterRaw(), fetchGameDataExt()]).then(() =>
      setLoading(false),
    );
  }, [fetchCharacterRaw, fetchGameDataExt]);

  if (loading) return <Loading />;

  return (
    <div>
      <OperatorSelector
        rogueKey={rogueKey}
        charData={charData}
        setCharData={setCharData}
      />
      <TopicSelector
        rogueKey={rogueKey}
        setRogueKey={setRogueKey}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
      />
      <StageSelector
        rogueKey={rogueKey}
        enemyData={enemyData}
        setEnemyData={setEnemyData}
      />
      <RelicSelector
        rogueKey={rogueKey}
        difficulty={difficulty}
        charData={charData}
      />
    </div>
  );
}
