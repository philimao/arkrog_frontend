import { useGameDataStore } from "~/stores/gameDataStore";
import { useEffect, useState } from "react";
import Loading from "~/components/Loading";
import OperatorSelector from "~/modules/Tool/DamageCalculator/OperatorSelector";
import RelicSelector from "~/modules/Tool/DamageCalculator/RelicSelector";

export default function ToolIndex() {
  const { fetchGameDataExt, fetchCharacterRaw } = useGameDataStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCharacterRaw(), fetchGameDataExt()]).then(() =>
      setLoading(false),
    );
  }, [fetchCharacterRaw, fetchGameDataExt]);

  if (loading) return <Loading />;

  return (
    <div>
      <OperatorSelector />
      <RelicSelector />
    </div>
  );
}
