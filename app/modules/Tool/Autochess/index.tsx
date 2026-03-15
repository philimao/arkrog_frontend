import { useEffect, useMemo, useState } from "react";
import Loading from "~/components/Loading";
import { useGameDataStore } from "~/stores/gameDataStore";
import { toast } from "react-toastify";
import OperatorPicker from "./components/OperatorPicker";
import BpPool from "./components/BpPool";
import BondList from "./components/BondList";
import BondTable from "./components/BondTable";
import EnemyPicker from "./components/EnemyPicker";
import BandTable from "./components/BandTable";
import { useAutochessDeck } from "./hooks/useAutochessDeck";

export default function AutochessPage() {
  const { autochess, fetchAutochessData } = useGameDataStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAutochessData().finally(() => setLoading(false));
  }, [fetchAutochessData]);

  const deck = useAutochessDeck(
    autochess?.operators || [],
    autochess?.bonds || [],
  );

  const pickedBonds = useMemo(
    () => deck.bondsWithState.filter((bond) => bond.count > 0),
    [deck.bondsWithState],
  );

  const handlePick = (chessId: string) => {
    const result = deck.addToPick(chessId);
    if (!result.success && result.reason === "limit") {
      toast.warning("Pick 池最多 9 名干员");
    }
  };

  if (loading || !autochess) return <Loading />;

  return (
    <div className="min-h-screen">
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">队伍构建</h2>
        <OperatorPicker
          operatorsByLevel={autochess.operatorsByLevel}
          operatorsByBond={autochess.operatorsByBond}
          bonds={autochess.bonds}
          selectedIds={deck.selectedIds}
          onPickToPick={handlePick}
        />
        <BpPool
          title="Pick 池"
          operators={deck.pickOperators}
          onDropOperator={handlePick}
          onRemoveOperator={deck.removeFromPick}
          limit={deck.pickLimit}
        />
        <BpPool
          title="Ban 池"
          operators={deck.banOperators}
          onDropOperator={deck.addToBan}
          onRemoveOperator={deck.removeFromBan}
        />
        <BondList bonds={pickedBonds} />
      </section>

      <BondTable bonds={autochess.bonds} />
      <EnemyPicker groups={autochess.enemyGroups} />
      <BandTable bands={autochess.bands} />
    </div>
  );
}
