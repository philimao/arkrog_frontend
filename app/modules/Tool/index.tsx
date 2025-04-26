import { useGameDataStore } from "~/stores/gameDataStore";
import React, { act, useEffect, useMemo, useState } from "react";
import Loading from "~/components/Loading";
import OperatorDisplay from "~/modules/Tool/DamageCalculator/OperatorDisplay";
import RelicSelector from "~/modules/Tool/DamageCalculator/RelicSelector";
import type { CharData, EnemyData, RogueKey } from "~/types/gameData";
import TopicSelector from "~/modules/Tool/DamageCalculator/TopicSelector";
import StageSelector from "~/modules/Tool/DamageCalculator/StageSelector";
import OperatorSelector from "~/modules/Tool/DamageCalculator/OperatorSelector";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import FooterPanel from "~/modules/Tool/DamageCalculator/FooterPanel";
import { ResultDisplay } from "~/modules/Tool/DamageCalculator/ResultDisplay";

export default function ToolIndex() {
  const { fetchGameDataExt, fetchCharacterRaw } = useGameDataStore();
  const { charList, activeCharName } = useDamageCalculatorStore();
  const [loading, setLoading] = useState(true);

  const [charData, setCharData] = useState<CharData>();
  const [enemyData, setEnemyData] = useState<EnemyData | undefined>();

  const [rogueKey, setRogueKey] = useState<RogueKey>("rogue_4");
  const [difficulty, setDifficulty] = useState<string>("N15");

  const activeCharData = useMemo(() => {
    return charList.find((charData) => charData?.name === activeCharName);
  }, [activeCharName, charList]);

  useEffect(() => {
    Promise.all([fetchCharacterRaw(), fetchGameDataExt()]).then(() =>
      setLoading(false),
    );
  }, [fetchCharacterRaw, fetchGameDataExt]);

  if (loading) return <Loading />;

  return (
    <div>
      <OperatorSelector />
      {activeCharData && (
        <>
          <OperatorDisplay charData={activeCharData} />
          <ResultDisplay />
          <TopicSelector />
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
        </>
      )}
      <FooterPanel />
    </div>
  );
}
