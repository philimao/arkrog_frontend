import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import type { AutochessOperator } from "~/types/autochess";

interface BpPoolProps {
  title: string;
  operators: AutochessOperator[];
  onDropOperator: (chessId: string) => void | { success: boolean; reason: string };
  onRemoveOperator: (chessId: string) => void;
  limit?: number;
}

export default function BpPool({
  title,
  operators,
  onDropOperator,
  onRemoveOperator,
  limit,
}: BpPoolProps) {
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
            <div className="w-14 h-14 rounded-full overflow-hidden border border-mid-gray">
              <OperatorAvatar name={operator.name} className="w-full h-full" />
            </div>
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

