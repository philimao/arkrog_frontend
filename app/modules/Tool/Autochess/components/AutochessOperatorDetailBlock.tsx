import type { AutochessOperator } from "~/types/autochess";
import { parseAutochessDesc } from "../utils/autochess";

export default function AutochessOperatorDetailBlock({
  operator,
  bondNameMap,
  className,
}: {
  operator: AutochessOperator;
  bondNameMap: Record<string, string>;
  className?: string;
}) {
  return (
    <div className={`max-w-80 text-sm ${className ?? "p-3"}`}>
      <div className="font-semibold mb-1">{operator.name}</div>
      <div>位阶：{operator.chessLevel}</div>
      <div>进阶数量：{operator.upgradeNum}</div>
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
              <div className="text-light-gray">{garrison.eventTypeDesc}</div>
              <div>{parseAutochessDesc(garrison.garrisonDesc)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
