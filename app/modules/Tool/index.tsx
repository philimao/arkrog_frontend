import { useGameDataStore } from "~/stores/gameDataStore";
import React, { useEffect, useMemo, useState } from "react";
import Loading from "~/components/Loading";
import OperatorDisplay from "~/modules/Tool/DamageCalculator/OperatorSection/OperatorDisplay";
import RelicSelector from "~/modules/Tool/DamageCalculator/RelicSection/RelicSelector";
import TopicSelector from "~/modules/Tool/DamageCalculator/EnemySection/TopicSelector";
import OperatorSelector from "~/modules/Tool/DamageCalculator/OperatorSection/OperatorSelector";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import FooterPanel from "~/modules/Tool/DamageCalculator/RelicSection/FooterPanel";
import { ResultDisplay } from "~/modules/Tool/DamageCalculator/OperatorSection/ResultDisplay";
import EnemySelector from "~/modules/Tool/DamageCalculator/EnemySection/EnemySelector";
import TopicSpecSelector from "./DamageCalculator/TopicSpecSection/TopicSpecSelector";

export default function ToolIndex() {
  const { fetchGameDataExt, fetchCharacterRaw } = useGameDataStore();
  const { charList, activeCharName, resetStore } = useDamageCalculatorStore();
  const [loading, setLoading] = useState(true);

  const activeCharData = useMemo(() => {
    return charList.find((charData) => charData?.name === activeCharName);
  }, [activeCharName, charList]);

  useEffect(() => {
    Promise.all([fetchCharacterRaw(), fetchGameDataExt()]).then(() => setLoading(false));
  }, [fetchCharacterRaw, fetchGameDataExt]);

  // 组件卸载时重置 DamageCalculatorStore
  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [resetStore]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen">
      <OperatorSelector />
      {activeCharData && (
        <>
          <OperatorDisplay charData={activeCharData} />
          <ResultDisplay />
        </>
      )}
      <TopicSelector />
      <EnemySelector />
      <FooterPanel />
      <RelicSelector charData={activeCharData} />
      <TopicSpecSelector />
    </div>
  );
}
