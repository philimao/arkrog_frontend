/**
 * 渲染 jsondiffpatch delta（v0.7+ 默认 format）。
 *
 * delta 形态参考：
 *   - 基本类型新增：[newValue]
 *   - 基本类型修改：[oldValue, newValue]
 *   - 基本类型删除：[oldValue, 0, 0]
 *   - 移动数组元素（detectMove）：[ '', destIndex, 3 ]
 *   - 文本 diff（已关闭，不会出现）：[diffText, 0, 2]
 *   - 对象局部 diff：{ key1: <delta>, key2: <delta>, ... }
 *   - 数组局部 diff：{ _t: 'a',
 *       <newIndex>: <delta>,        // 在新数组中索引为 newIndex 处的元素发生变化（add 或 modify）
 *       _<oldIndex>: <delta>,       // 旧数组里索引 oldIndex 处的元素被删除/移动
 *     }
 *
 * 我们不复刻官方 HTML formatter，而是写一个与 JsonTree 风格一致的递归渲染。
 */

import JsonTree from "./JsonTree";

export type Delta = unknown;

const StyledLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-ak-blue font-semibold">{children}</span>
);

function isPrimitiveDelta(d: unknown): d is unknown[] {
  return Array.isArray(d);
}

function isArrayDiff(d: unknown): d is { _t: "a" } & Record<string, Delta> {
  return (
    !!d &&
    typeof d === "object" &&
    !Array.isArray(d) &&
    (d as { _t?: string })._t === "a"
  );
}

function isObjectDiff(
  d: unknown,
): d is Record<string, Delta> {
  return !!d && typeof d === "object" && !Array.isArray(d);
}

function PrimitiveDelta({ delta }: { delta: unknown[] }) {
  // [new] => added
  if (delta.length === 1) {
    return (
      <div className="pl-3">
        <span className="text-green-300/80 mr-1">+</span>
        <JsonTree data={delta[0]} />
      </div>
    );
  }
  // [old, new] => modified
  if (delta.length === 2) {
    return (
      <div className="pl-3 space-y-1">
        <div>
          <span className="text-red-300/80 mr-1">−</span>
          <JsonTree data={delta[0]} />
        </div>
        <div>
          <span className="text-green-300/80 mr-1">+</span>
          <JsonTree data={delta[1]} />
        </div>
      </div>
    );
  }
  // [old, 0, 0] => removed
  if (delta.length === 3 && delta[1] === 0 && delta[2] === 0) {
    return (
      <div className="pl-3">
        <span className="text-red-300/80 mr-1">−</span>
        <JsonTree data={delta[0]} />
      </div>
    );
  }
  // [_, destIndex, 3] => moved (数组内位置变化)
  if (delta.length === 3 && delta[2] === 3) {
    return (
      <div className="pl-3 text-white/60">
        ↕ 移动到索引 {String(delta[1])}
      </div>
    );
  }
  // 兜底：原样展示
  return (
    <div className="pl-3">
      <JsonTree data={delta} />
    </div>
  );
}

function ArrayDelta({ delta }: { delta: { _t: "a" } & Record<string, Delta> }) {
  // 收集 newIndex 与 _oldIndex 两类 key，按数字排序
  const newKeys: { idx: number; key: string }[] = [];
  const oldKeys: { idx: number; key: string }[] = [];
  for (const k of Object.keys(delta)) {
    if (k === "_t") continue;
    if (k.startsWith("_")) {
      const n = Number(k.slice(1));
      if (!Number.isNaN(n)) oldKeys.push({ idx: n, key: k });
    } else {
      const n = Number(k);
      if (!Number.isNaN(n)) newKeys.push({ idx: n, key: k });
    }
  }
  oldKeys.sort((a, b) => a.idx - b.idx);
  newKeys.sort((a, b) => a.idx - b.idx);

  return (
    <div className="pl-2 space-y-2">
      {oldKeys.map(({ idx, key }) => (
        <ArrayItemDelta
          key={`old-${idx}`}
          slotLabel={`[原 #${idx}] 删除/移动`}
          delta={delta[key]}
        />
      ))}
      {newKeys.map(({ idx, key }) => {
        const sub = delta[key];
        const isAdd =
          isPrimitiveDelta(sub) && sub.length === 1; // [newValue]
        return (
          <ArrayItemDelta
            key={`new-${idx}`}
            slotLabel={isAdd ? `[新增 #${idx}]` : `[#${idx}]`}
            delta={sub}
          />
        );
      })}
    </div>
  );
}

function ArrayItemDelta({
  slotLabel,
  delta,
}: {
  slotLabel: string;
  delta: Delta;
}) {
  return (
    <div>
      <div className="text-white/60 text-xs mb-1">{slotLabel}</div>
      <DeltaNode delta={delta} />
    </div>
  );
}

function ObjectDelta({ delta }: { delta: Record<string, Delta> }) {
  const entries = Object.entries(delta).filter(([k]) => k !== "_t");
  if (entries.length === 0) return null;
  return (
    <div className="pl-2 space-y-2">
      {entries.map(([key, sub]) => (
        <div key={key}>
          <div className="mb-1">
            📝 <StyledLabel>{key}</StyledLabel>
          </div>
          <DeltaNode delta={sub} />
        </div>
      ))}
    </div>
  );
}

export function DeltaNode({ delta }: { delta: Delta }) {
  if (delta == null) return null;
  if (isPrimitiveDelta(delta)) return <PrimitiveDelta delta={delta} />;
  if (isArrayDiff(delta)) return <ArrayDelta delta={delta} />;
  if (isObjectDiff(delta)) return <ObjectDelta delta={delta} />;
  return (
    <div className="pl-3 text-white/60">
      <JsonTree data={delta} />
    </div>
  );
}

export interface DeltaViewProps {
  delta: Delta;
  emptyText?: string;
}

export default function DeltaView({
  delta,
  emptyText = "没有变更",
}: DeltaViewProps) {
  if (delta == null) {
    return <div className="text-white/50 text-sm">{emptyText}</div>;
  }
  return (
    <div className="text-xs font-mono bg-black/60 p-3 rounded border border-white/10 break-all whitespace-pre-wrap">
      <DeltaNode delta={delta} />
    </div>
  );
}
