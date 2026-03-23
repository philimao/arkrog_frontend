import { useMemo, useState } from "react";
import type {
  AutochessEffectInfo,
  AutochessEnemyGainGroup,
} from "~/types/autochess";
import { StyledTitle } from "~/modules/Tool/components/Shared";
import { parseAutochessDesc } from "../utils/autochess";
import AutochessEnemyGainSelectorLayout from "./AutochessEnemyGainSelectorLayout";

function sortByNameThenId(a: AutochessEffectInfo, b: AutochessEffectInfo) {
  const c = a.effectName.localeCompare(b.effectName, "zh-Hans-CN");
  if (c !== 0) return c;
  return a.effectId.localeCompare(b.effectId);
}

function sortEnemyGainGroups(
  a: AutochessEnemyGainGroup,
  b: AutochessEnemyGainGroup,
) {
  const na = a.enemyData.enemyName?.trim() || "";
  const nb = b.enemyData.enemyName?.trim() || "";
  const c = na.localeCompare(nb, "zh-Hans-CN");
  if (c !== 0) return c;
  return a.id.localeCompare(b.id);
}

export default function DecisionPhaseSection({
  effectInfoDataDict,
  enemyGains,
}: {
  effectInfoDataDict: Record<string, AutochessEffectInfo>;
  enemyGains: AutochessEnemyGainGroup[];
}) {
  const [mode, setMode] = useState("敌人悬赏");

  const sortedEnemyGains = useMemo(
    () => [...enemyGains].sort(sortEnemyGainGroups),
    [enemyGains],
  );

  const { buffRows, enemyModRows } = useMemo(() => {
    const list = Object.values(effectInfoDataDict || {});
    return {
      buffRows: list
        .filter((e) => e.effectType === "BUFF_GAIN")
        .sort(sortByNameThenId),
      enemyModRows: list
        .filter((e) => e.effectType === "ENEMY")
        .sort(sortByNameThenId),
    };
  }, [effectInfoDataDict]);

  return (
    <section className="mb-8">
      <StyledTitle
        modes={["敌人悬赏", "联合增益", "联合减益"]}
        activeMode={mode}
        setActiveMode={setMode}
      >
        机变阶段
      </StyledTitle>
      <div className="max-h-[85vh] overflow-auto">
        {mode === "敌人悬赏" ? (
          <AutochessEnemyGainSelectorLayout rows={sortedEnemyGains} />
        ) : mode === "联合增益" ? (
          <table className="w-full table-auto border border-mid-gray bg-black-gray-70">
            <thead className="sticky top-0 z-10 bg-black-gray">
              <tr className="text-left border-b border-mid-gray">
                <th className="p-3 whitespace-nowrap">决策名称</th>
                <th className="p-3 whitespace-nowrap">决策效果</th>
              </tr>
            </thead>
            <tbody>
              {buffRows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-3 text-light-gray">
                    暂无数据
                  </td>
                </tr>
              ) : (
                buffRows.map((row) => (
                  <tr key={row.effectId} className="border-b border-mid-gray">
                    <td className="p-3">{row.effectName}</td>
                    <td className="p-3 text-sm whitespace-pre-line">
                      {parseAutochessDesc(row.effectDesc)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full table-auto border border-mid-gray bg-black-gray-70">
            <thead className="sticky top-0 z-10 bg-black-gray">
              <tr className="text-left border-b border-mid-gray">
                <th className="p-3 whitespace-nowrap">决策名称</th>
                <th className="p-3 whitespace-nowrap">决策效果</th>
              </tr>
            </thead>
            <tbody>
              {enemyModRows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-3 text-light-gray">
                    暂无数据
                  </td>
                </tr>
              ) : (
                enemyModRows.map((row) => (
                  <tr key={row.effectId} className="border-b border-mid-gray">
                    <td className="p-3">{row.effectName}</td>
                    <td className="p-3 text-sm whitespace-pre-line">
                      {parseAutochessDesc(row.effectDesc)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
