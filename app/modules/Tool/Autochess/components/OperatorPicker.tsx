import { useMemo, useState } from "react";
import { intToRoman } from "~/utils/tools";
import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import type { AutochessBond, AutochessOperator } from "~/types/autochess";
import { StyledTitle } from "~/modules/Tool/components/Shared";

interface OperatorPickerProps {
  operatorsByLevel: Record<string, AutochessOperator[]>;
  operatorsByBond: Record<string, AutochessOperator[]>;
  bonds: AutochessBond[];
  selectedIds: string[];
  onPickToPick: (chessId: string) => void;
}

type Mode = "按位阶" | "按盟约";

export default function OperatorPicker({
  operatorsByLevel,
  operatorsByBond,
  bonds,
  selectedIds,
  onPickToPick,
}: OperatorPickerProps) {
  const [mode, setMode] = useState<Mode>("按位阶");
  const [level, setLevel] = useState("1");
  const [bondId, setBondId] = useState(bonds[0]?.bondId || "");

  const activeOperators = useMemo(() => {
    if (mode === "按位阶") return operatorsByLevel[level] || [];
    return operatorsByBond[bondId] || [];
  }, [bondId, level, mode, operatorsByBond, operatorsByLevel]);

  return (
    <section className="mb-8">
      <StyledTitle
        modes={["按位阶", "按盟约"]}
        activeMode={mode}
        setActiveMode={(value) => setMode(value as Mode)}
      >
        干员选择
      </StyledTitle>

      {mode === "按位阶" ? (
        <div className="flex gap-2 mb-4 flex-wrap">
          {Array.from({ length: 6 }, (_, idx) => {
            const key = String(idx + 1);
            const active = key === level;
            return (
              <button
                key={key}
                className={`px-3 py-1 border text-sm ${active ? "border-ak-blue text-ak-blue" : "border-mid-gray text-white"}`}
                onClick={() => setLevel(key)}
              >
                {intToRoman(idx + 1)}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-2 mb-4 flex-wrap">
          {bonds.map((bond) => {
            const active = bond.bondId === bondId;
            return (
              <button
                key={bond.bondId}
                className={`px-3 py-1 border text-sm ${active ? "border-ak-blue text-ak-blue" : "border-mid-gray text-white"}`}
                onClick={() => setBondId(bond.bondId)}
              >
                {bond.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
        {activeOperators.map((operator) => {
          const selected = selectedIds.includes(operator.chessId);
          return (
            <button
              key={operator.chessId}
              draggable={!selected}
              onDragStart={(evt) => {
                evt.dataTransfer.setData("text/plain", operator.chessId);
              }}
              onClick={() => onPickToPick(operator.chessId)}
              disabled={selected}
              className={`flex items-center gap-2 border p-2 bg-black-gray ${selected ? "opacity-60 cursor-not-allowed" : "hover:border-ak-blue border-mid-gray"}`}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border border-mid-gray">
                <OperatorAvatar name={operator.name} className="w-full h-full" />
              </div>
              <span className="text-sm text-left">{operator.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

