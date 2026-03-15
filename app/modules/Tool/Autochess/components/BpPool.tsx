import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import type { AutochessBond, AutochessOperator } from "~/types/autochess";
import { Tooltip } from "@heroui/react";
import { parseBondDesc } from "../utils/autochess";

interface BpPoolProps {
  title: string;
  operators: AutochessOperator[];
  onDropOperator: (
    chessId: string,
  ) => void | { success: boolean; reason: string };
  onRemoveOperator: (chessId: string) => void;
  bonds: AutochessBond[];
  limit?: number;
}

export default function BpPool({
  title,
  operators,
  onDropOperator,
  onRemoveOperator,
  bonds,
  limit,
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
      <div className="text-lg font-bold mb-3 flex items-center gap-2">
        <h3>{title}</h3>
        {typeof limit === "number" && (
          <span className="text-sm text-light-gray font-normal">
            {operators.length}/{limit}
          </span>
        )}
      </div>
      <div
        className="min-h-24 border border-dashed border-mid-gray p-3 bg-black-gray-70 flex flex-wrap gap-3"
        onDragOver={(evt) => evt.preventDefault()}
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
                <div className="p-3 max-w-80 text-sm">
                  <div className="font-semibold mb-1">{operator.name}</div>
                  <div>位阶：{operator.chessLevel}</div>
                  <div>升阶需求：{operator.upgradeNum}</div>
                  <div className="mt-1">
                    盟约：
                    {(operator.bondIds || [])
                      .map((bondId) => bondNameMap[bondId] || bondId)
                      .join(" / ")}
                  </div>
                  {!!operator.garrisons?.length && (
                    <div className="mt-2">
                      {operator.garrisons.map((garrison) => (
                        <div key={garrison.garrisonId} className="mb-2">
                          <div className="text-light-gray">
                            {garrison.eventTypeDesc}
                          </div>
                          <div>{parseBondDesc(garrison.garrisonDesc)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              }
            >
              <div className="w-14 h-14 rounded-full overflow-hidden border border-mid-gray">
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
