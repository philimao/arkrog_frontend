import JsonTree from "./JsonTree";

export interface AuditChange {
  type: "added" | "removed" | "modified" | "created" | "deleted";
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
  value?: unknown;
}

const ACTION_PREFIX: Record<AuditChange["type"], string> = {
  added: "➕ 新增",
  removed: "➖ 删除",
  modified: "📝 修改",
  created: "🆕 创建资源",
  deleted: "🗑️ 删除资源",
};

export function ChangeRow({ change }: { change: AuditChange }) {
  const prefix = ACTION_PREFIX[change.type] ?? change.type;
  if (change.type === "created" || change.type === "deleted") {
    return <div className="text-white/90">{prefix}</div>;
  }
  return (
    <div className="text-white/90">
      <div className="mb-1">
        <span>{prefix}</span>{" "}
        <span className="text-ak-blue font-semibold">{change.path}</span>
      </div>
      {change.type === "added" && (
        <div className="pl-3">
          <JsonTree data={change.value} />
        </div>
      )}
      {change.type === "removed" && (
        <div className="pl-3">
          <JsonTree data={change.oldValue} />
        </div>
      )}
      {change.type === "modified" && (
        <div className="pl-3 space-y-1">
          <div>
            <span className="text-red-300/80 mr-1">−</span>
            <JsonTree data={change.oldValue} />
          </div>
          <div>
            <span className="text-green-300/80 mr-1">+</span>
            <JsonTree data={change.newValue} />
          </div>
        </div>
      )}
    </div>
  );
}

export interface DiffViewProps {
  changes: AuditChange[];
  emptyText?: string;
}

export default function DiffView({
  changes,
  emptyText = "没有变更",
}: DiffViewProps) {
  if (!changes || changes.length === 0) {
    return <div className="text-white/50 text-sm">{emptyText}</div>;
  }
  return (
    <div className="space-y-2">
      {changes.map((change, index) => (
        <div
          key={index}
          className="text-xs font-mono bg-black/60 p-2 rounded border border-white/10 break-all whitespace-pre-wrap"
        >
          <ChangeRow change={change} />
        </div>
      ))}
    </div>
  );
}
