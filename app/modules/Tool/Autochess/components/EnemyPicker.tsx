import { useState } from "react";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import type { AutochessEnemyGroup } from "~/types/autochess";
import { StyledTitle } from "~/modules/Tool/components/Shared";

export default function EnemyPicker({ groups }: { groups: AutochessEnemyGroup[] }) {
  const [activeType, setActiveType] = useState(groups[0]?.type || "");
  const activeGroup = groups.find((group) => group.type === activeType) || groups[0];

  return (
    <section className="mb-8">
      <StyledTitle>敌人一览</StyledTitle>
      <div className="flex gap-2 mb-4 flex-wrap">
        {groups.map((group) => {
          const active = group.type === activeType;
          return (
            <button
              key={group.type}
              className={`px-3 py-1 border text-sm ${active ? "border-ak-blue text-ak-blue" : "border-mid-gray text-white"}`}
              onClick={() => setActiveType(group.type)}
            >
              {group.typeName}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
        {(activeGroup?.enemies || []).map((enemy) => (
          <div key={enemy.enemyId} className="flex items-center gap-2 border border-mid-gray p-2 bg-black-gray">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-mid-gray">
              <EnemyAvatar name={enemy.name} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm text-left">{enemy.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

