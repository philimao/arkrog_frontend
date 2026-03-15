import { useMemo, useState } from "react";
import { intToRoman } from "~/utils/tools";
import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import type { AutochessBond, AutochessOperator } from "~/types/autochess";
import { StyledTitle } from "~/modules/Tool/components/Shared";
import {
  getAvailableOperatorCountByBond,
  splitBondsByCore,
} from "../utils/autochess";

interface OperatorPickerProps {
  operatorsByLevel: Record<string, AutochessOperator[]>;
  operatorsByBond: Record<string, AutochessOperator[]>;
  bonds: AutochessBond[];
  banOperatorIds: string[];
  selectedIds: string[];
  onPickToPick: (chessId: string) => void;
}

type Mode = "按位阶" | "按盟约";

export default function OperatorPicker({
  operatorsByLevel,
  operatorsByBond,
  bonds,
  banOperatorIds,
  selectedIds,
  onPickToPick,
}: OperatorPickerProps) {
  const [mode, setMode] = useState<Mode>("按盟约");
  const [level, setLevel] = useState("1");
  const [bondId, setBondId] = useState(bonds[0]?.bondId || "");
  const { core, extra } = useMemo(() => splitBondsByCore(bonds), [bonds]);

  const activeOperators = useMemo(() => {
    if (mode === "按位阶") return operatorsByLevel[level] || [];
    return operatorsByBond[bondId] || [];
  }, [bondId, level, mode, operatorsByBond, operatorsByLevel]);

  return (
    <section className="mb-8">
      <StyledTitle
        modes={["按盟约", "按位阶"]}
        activeMode={mode}
        setActiveMode={(value) => setMode(value as Mode)}
      >
        干员选择
      </StyledTitle>

      {mode === "按位阶" ? (
        <div className="grid grid-cols-6 mb-4 gap-[1px] bg-mid-gray">
          {Array.from({ length: 6 }, (_, idx) => {
            const key = String(idx + 1);
            const active = key === level;
            return (
              <button
                key={key}
                className={
                  "text-center font-bold leading-[3rem] " +
                  `${active ? "bg-ak-blue text-black" : "bg-black-gray text-white"}`
                }
                onClick={() => setLevel(key)}
              >
                {intToRoman(idx + 1)}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          <div className="text-xs text-light-gray">核心盟约</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-[1px] bg-mid-gray">
            {core.map((bond) => {
              const active = bond.bondId === bondId;
              const available = getAvailableOperatorCountByBond(
                bond.bondId,
                operatorsByBond,
                banOperatorIds,
              );
              return (
                <button
                  key={bond.bondId}
                  className={
                    "text-center font-bold leading-[2.5rem] text-sm " +
                    `${active ? "bg-ak-blue text-black" : "bg-black-gray text-white"}`
                  }
                  onClick={() => setBondId(bond.bondId)}
                >
                  {bond.name}（{available}）
                </button>
              );
            })}
          </div>
          <div className="text-xs text-light-gray mt-2">附加盟约</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-[1px] bg-mid-gray">
            {extra.map((bond) => {
              const active = bond.bondId === bondId;
              const available = getAvailableOperatorCountByBond(
                bond.bondId,
                operatorsByBond,
                banOperatorIds,
              );
              return (
                <button
                  key={bond.bondId}
                  className={
                    "text-center font-bold leading-[2.5rem] text-sm " +
                    `${active ? "bg-ak-blue text-black" : "bg-black-gray text-white"}`
                  }
                  onClick={() => setBondId(bond.bondId)}
                >
                  {bond.name}（{available}）
                </button>
              );
            })}
          </div>
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
                <OperatorAvatar
                  name={operator.name}
                  className="w-full h-full"
                  loading="lazy"
                />
              </div>
              <span className="text-sm text-left">{operator.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
