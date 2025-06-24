import { useGameDataStore } from "~/stores/gameDataStore";
import React, { useEffect, useState } from "react";
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
import CalcCenter from "./DamageCalculator/calculator/CalcCenter";

export default function ToolIndexWrapper() {
  const { fetchGameDataBasic, fetchGameDataExt } = useGameDataStore();
  const { initStore, resetStore } = useDamageCalculatorStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([fetchGameDataBasic(), fetchGameDataExt()])
      .then(([, gameDataStore]) => initStore(gameDataStore))
      .then(() => setLoaded(true));
    return () => {
      setLoaded(false);
      resetStore();
    };
  }, [fetchGameDataBasic, fetchGameDataExt, initStore, resetStore]);

  if (!loaded) return <Loading />;

  return <ToolIndex />;
}

function ToolIndex() {
  const { activeCharName } = useDamageCalculatorStore();

  return (
    <div className="min-h-screen">
      <CalcCenter />
      <OperatorSelector />
      {activeCharName && (
        <>
          <OperatorDisplay />
          <ResultDisplay />
          <div className="text-xs mt-2 mb-4">
            伤害计算器仍在内测快速迭代阶段，可能出现错误，请结合伤害加成面板进行数据验证
          </div>
        </>
      )}
      <TopicSelector />
      <EnemySelector />
      <FooterPanel />
      <RelicSelector />
      <TopicSpecSelector />
      <svg width="0" height="0">
        <defs>
          <symbol id="question_circle" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 17V16.9929M12 14.8571C12 11.6429 15 12.3571 15 9.85714C15 8.27919 13.6568 7 12 7C10.6567 7 9.51961 7.84083 9.13733 9M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </symbol>
          <symbol id="chevron-up" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M106.666667 659.2L172.8 725.333333 512 386.133333 851.2 725.333333l66.133333-66.133333L512 256z"></path>
          </symbol>
        </defs>
      </svg>
    </div>
  );
}
