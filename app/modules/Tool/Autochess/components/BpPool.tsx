import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import type { AutochessBond, AutochessOperator } from "~/types/autochess";
import { Switch, Tooltip } from "@heroui/react";
import AutochessOperatorDetailBlock from "./AutochessOperatorDetailBlock";

interface BpPoolProps {
  title: string;
  operators: AutochessOperator[];
  onDropOperator: (
    chessId: string,
  ) => void | { success: boolean; reason: string };
  onRemoveOperator: (chessId: string) => void;
  bonds: AutochessBond[];
  limit?: number;
  batchModifyActive?: boolean;
  onBatchModifyChange?: (active: boolean) => void;
}

export default function BpPool({
  title,
  operators,
  onDropOperator,
  onRemoveOperator,
  bonds,
  limit,
  batchModifyActive = false,
  onBatchModifyChange,
}: BpPoolProps) {
  const bondNameMap = bonds.reduce(
    (acc, bond) => {
      acc[bond.bondId] = bond.name;
      return acc;
    },
    {} as Record<string, string>,
  );

  return (
    <section className="mb-8">
      <div className="text-lg font-bold mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3>{title}</h3>
          {typeof limit === "number" && (
            <span
              className={
                "text-sm font-normal " +
                (operators.length > limit
                  ? "text-ak-red"
                  : "text-light-gray")
              }
            >
              {operators.length}/{limit}
            </span>
          )}
        </div>
        {(operators.length > 0 || onBatchModifyChange) && (
          <div className="flex items-center gap-3">
            {operators.length > 0 && (
              <button
                type="button"
                className="text-sm text-default-500 hover:text-default-700"
                onClick={() => operators.forEach((op) => onRemoveOperator(op.chessId))}
              >
                清空
              </button>
            )}
            {onBatchModifyChange && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-normal">批量修改</label>
                <Switch
                  isSelected={batchModifyActive}
                  onValueChange={onBatchModifyChange}
                  size="sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div
        className="min-h-20 border border-dashed border-mid-gray p-3 bg-black-gray-70 flex flex-wrap gap-3"
        onDragOver={(evt) => {
          evt.preventDefault();
          evt.dataTransfer.dropEffect = "move";
        }}
        onDrop={(evt) => {
          evt.preventDefault();
          const chessId = evt.dataTransfer.getData("text/plain");
          if (chessId) onDropOperator(chessId);
        }}
      >
        {operators.map((operator) => (
          <div key={operator.chessId} className="relative w-14 h-14">
            <Tooltip
              content={
                <AutochessOperatorDetailBlock
                  operator={operator}
                  bondNameMap={bondNameMap}
                />
              }
            >
              <div
                className="w-14 h-14 rounded-full overflow-hidden border border-mid-gray cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(evt) => {
                  evt.dataTransfer.setData("text/plain", operator.chessId);
                  evt.dataTransfer.effectAllowed = "move";
                }}
              >
                <OperatorAvatar
                  name={operator.name}
                  className="w-full h-full"
                  loading="lazy"
                />
              </div>
            </Tooltip>
            <button
              className="absolute -top-1 -right-1 rounded-full w-5 h-5 text-xs bg-ak-red text-white"
              onClick={() => onRemoveOperator(operator.chessId)}
              aria-label={`remove-${operator.name}`}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
