import { useGameDataStore } from "~/stores/gameDataStore";
import { useEffect, useState } from "react";
import Loading from "~/components/Loading";
import OperatorSelector from "~/modules/Tool/DamageCalculator/OperatorSelector";
import RelicSelector from "~/modules/Tool/DamageCalculator/RelicSelector";
import type { CharData } from "~/types/gameData";

export default function ToolIndex() {
  const { fetchGameDataExt, fetchCharacterRaw } = useGameDataStore();
  const [loading, setLoading] = useState(true);

  const [charData, setCharData] = useState<CharData>();

  useEffect(() => {
    Promise.all([fetchCharacterRaw(), fetchGameDataExt()]).then(() =>
      setLoading(false),
    );
  }, [fetchCharacterRaw, fetchGameDataExt]);

  if (loading) return <Loading />;

  return (
    <div>
      <OperatorSelector charData={charData} setCharData={setCharData} />
      <RelicSelector charData={charData} />
    </div>
  );
}
