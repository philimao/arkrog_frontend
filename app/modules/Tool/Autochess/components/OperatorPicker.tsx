import { useMemo, useState } from "react";
import { Switch } from "@heroui/react";
import { intToRoman } from "~/utils/tools";
import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import type { AutochessBond, AutochessOperator } from "~/types/autochess";
import { StyledTitle } from "~/modules/Tool/components/Shared";
import {
  getAvailableOperatorCountByBond,
  splitBondsByCore,
} from "../utils/autochess";
import AutochessOperatorDetailBlock from "./AutochessOperatorDetailBlock";

interface OperatorPickerProps {
  operatorsByLevel: Record<string, AutochessOperator[]>;
  operatorsByBond: Record<string, AutochessOperator[]>;
  bonds: AutochessBond[];
  banOperatorIds: string[];
  selectedIds: string[];
  batchModifyTarget: "pick" | "ban" | null;
  onOperatorClick: (chessId: string, target: "pick" | "ban") => void;
}

type Mode = "按位阶" | "按盟约";

export default function OperatorPicker({
  operatorsByLevel,
  operatorsByBond,
  bonds,
  banOperatorIds,
  selectedIds,
  batchModifyTarget,
  onOperatorClick,
}: OperatorPickerProps) {
  const [mode, setMode] = useState<Mode>("按盟约");
  const [level, setLevel] = useState("1");
  const [bondId, setBondId] = useState(bonds[0]?.bondId || "");
  const [showOperatorDetails, setShowOperatorDetails] = useState(false);
  const { core, extra } = useMemo(() => splitBondsByCore(bonds), [bonds]);

  const bondNameMap = useMemo(
    () =>
      bonds.reduce(
        (acc, bond) => {
          acc[bond.bondId] = bond.name;
          return acc;
        },
        {} as Record<string, string>,
      ),
    [bonds],
  );

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
          <div className="text-sm text-light-gray">核心盟约</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-[1px] bg-black-gray">
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
          <div className="text-sm text-light-gray mt-2">附加盟约</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-[1px] bg-black-gray">
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

      <div className="flex justify-end items-center gap-2 mb-3">
        <span className="text-sm text-light-gray">详细信息</span>
        <Switch
          isSelected={showOperatorDetails}
          onValueChange={setShowOperatorDetails}
          size="sm"
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
        {activeOperators.map((operator) => {
          const selected = selectedIds.includes(operator.chessId);
          const canClickInBatchMode = batchModifyTarget && onOperatorClick;
          const disabled = !batchModifyTarget && selected;
          return (
            <button
              key={operator.chessId}
              draggable={!selected}
              onDragStart={(evt) => {
                evt.dataTransfer.setData("text/plain", operator.chessId);
              }}
              onClick={() => {
                if (canClickInBatchMode)
                  onOperatorClick(operator.chessId, batchModifyTarget);
              }}
              disabled={disabled}
              className={`flex flex-col items-stretch gap-2 border p-2 bg-black-gray text-left ${
                disabled ? "opacity-60 cursor-not-allowed" : ""
              } ${
                selected
                  ? "border-ak-blue"
                  : "border-mid-gray hover:border-ak-blue"
              }`}
            >
              <div className="relative flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden border border-mid-gray">
                  <OperatorAvatar
                    name={operator.name}
                    className="w-full h-full"
                    loading="lazy"
                  />
                  {mode === "按盟约" && (
                    <span className="absolute top-[1px] right-[1px] z-10 text-xs leading-none font-bold text-light-gray pointer-events-none">
                      {intToRoman(operator.chessLevel)}
                    </span>
                  )}
                </div>
                <span className="text-sm text-left truncate">
                  {operator.name}
                </span>
              </div>
              {showOperatorDetails && (
                <AutochessOperatorDetailBlock
                  operator={operator}
                  bondNameMap={bondNameMap}
                  className="p-2 pb-0 max-w-none border-t border-mid-gray"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
