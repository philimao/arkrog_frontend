import { useEffect, useMemo, useState } from "react";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import type { AutochessEnemyGroup } from "~/types/autochess";
import { StyledTitle } from "~/modules/Tool/components/Shared";
import { getPath, imageHost } from "~/utils/tools";

export default function EnemyPicker({
  groups,
  matchedActiveTypes,
}: {
  groups: AutochessEnemyGroup[];
  matchedActiveTypes?: AutochessEnemyGroup["type"][];
}) {
  const [mode, setMode] = useState("本场敌人");
  const [activeType, setActiveType] = useState(groups[0]?.type || "");
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const activeGroup =
    groups.find((group) => group.type === activeType) || groups[0];
  const activeGroups = useMemo(
    () => groups.filter((group) => activeTypes.includes(group.type)),
    [activeTypes, groups],
  );

  useEffect(() => {
    if (!matchedActiveTypes || matchedActiveTypes.length === 0) return;
    setMode("本场敌人");
    setActiveTypes(matchedActiveTypes);
    setActiveType(matchedActiveTypes[0]);
  }, [matchedActiveTypes]);

  return (
    <section className="mb-4">
      <StyledTitle
        modes={["本场敌人", "显示全部"]}
        activeMode={mode}
        setActiveMode={setMode}
      >
        敌人一览
      </StyledTitle>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] mb-4 gap-[1px] bg-mid-gray">
        {groups.map((group) => {
          const active =
            mode === "显示全部"
              ? group.type === activeType
              : activeTypes.includes(group.type);
          return (
            <button
              key={group.type}
              className={
                "text-center font-bold leading-[2.5rem] text-sm " +
                `${active ? "bg-ak-blue text-black" : "bg-black-gray text-white"}`
              }
              onClick={() => {
                if (mode === "显示全部") {
                  setActiveType(group.type);
                  return;
                }
                setActiveTypes((prev) => {
                  if (prev.includes(group.type)) {
                    return prev.filter((type) => type !== group.type);
                  }
                  return [...prev, group.type];
                });
              }}
            >
              {group.typeName}
            </button>
          );
        })}
      </div>

      {mode === "显示全部" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
          {(activeGroup?.enemies || []).map((enemy) => (
            <div
              key={enemy.enemyId}
              className="flex items-center gap-2 border border-mid-gray p-2 bg-black-gray"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border border-mid-gray">
                <EnemyAvatar
                  name={enemy.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-sm text-left">{enemy.name}</span>
            </div>
          ))}
        </div>
      )}

      {mode === "本场敌人" && (
        <div className="flex flex-col gap-4 mb-4">
          {activeGroups.map((group) => {
            const typeName = group.typeName.split("·").pop() || group.typeName;
            return (
              <div
                key={group.type}
                className="grid grid-cols-[8rem,1fr] gap-3 border border-mid-gray p-3 bg-black-gray"
              >
                <div className="flex flex-col justify-center items-center gap-2">
                  <img
                    src={imageHost + getPath(`特训敌人_${typeName}.png`)}
                    alt={group.typeName}
                    loading="lazy"
                    className="w-16 h-16 object-cover"
                    onError={(evt) => {
                      (evt.target as HTMLImageElement).onerror = null;
                      (evt.target as HTMLImageElement).src =
                        "/images/logo/logo.png";
                    }}
                  />
                  <div className="font-semibold">{group.typeName}</div>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
                  {group.enemies.map((enemy) => (
                    <div
                      key={enemy.enemyId}
                      className="flex items-center gap-2 border border-mid-gray p-2 bg-black-gray-70"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-mid-gray">
                        <EnemyAvatar
                          name={enemy.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-sm text-left">{enemy.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
