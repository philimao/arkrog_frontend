/**
 * 卫戍协议「敌人悬赏」：左侧头像网格 + 右侧只读详情，布局与样式参考
 * DamageCalculator/EnemySection/StageSelector（StyledStageSelectorBody、StyledEnemies 等），
 * 不依赖 damageCalculatorStore。
 *
 * 顶部敌方标价过滤（group.enemyPrice）：样式对齐 OperatorPicker 盟约按钮网格（minmax(7rem,1fr)）。
 */
import { useEffect, useMemo, useState } from "react";
import { styled } from "styled-components";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import ToolSelect from "~/modules/Tool/components/ToolSelect";
import type { AutochessEnemyGainGroup } from "~/types/autochess";
import {
  type AutochessCalcDifficulty,
  type AutochessCalcModeType,
  computeDisplayedEnemyAttributes,
} from "../utils/calculate";
import AutochessEnemyGainReadonlyPanel from "./AutochessEnemyGainReadonlyPanel";

/** 与 StageSelector 一致 */
const StyledStageSelectorBody = styled.div`
  display: flex;
  height: 34rem;
  align-items: stretch;
  & > div:first-child {
    flex-grow: 1;
    max-height: 100%;
    max-width: 35rem;
    margin-right: 1.5rem;
    position: relative;
  }
  & > div:last-child {
    width: 33rem;
  }
`;

const StyledEnemiesLabel = styled.div`
  height: 1.25rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  & > span:first-child {
    color: var(--light-gray);
  }
`;

const StyledEnemies = styled.div`
  height: calc(100% - 1.75rem);
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, 4rem);
  gap: 0.5rem;
  align-content: start;
  align-items: start;
  justify-content: center;
  padding: 0.5rem;
  background: rgba(78, 78, 78, 0.5);
  box-shadow: 4px 4px 6px 0 rgba(0, 0, 0, 0.25);
  user-select: none;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--light-gray);
  }
  &::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0.3);
  }
  &::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 4rem;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(36, 36, 36, 0.8) 100%
    );
    background-blend-mode: darken;
  }
`;

const StyledEnemy = styled.div<{ $selected: boolean }>`
  box-shadow: ${({ $selected }) =>
    $selected ? "0px 0px 10px 2px #FFF" : "none"};
  width: 4rem;
`;

function getGroupEnemyPrice(entry: AutochessEnemyGainGroup): number {
  const p = entry.enemyPrice;
  return typeof p === "number" && !Number.isNaN(p) ? p : 0;
}

function matchesEnemyPriceFilter(
  entry: AutochessEnemyGainGroup,
  filter: number,
): boolean {
  return getGroupEnemyPrice(entry) === filter;
}

/** EnemyAvatar.name 使用敌人展示名（与手册头像文件名一致）；缺省时用首条 effect 标题兜底 */
function avatarNameForEntry(row: AutochessEnemyGainGroup) {
  const ed = row.enemyData;
  const fx = row.effects[0];
  const titleFallback =
    fx?.effectName.replace(/·.+?$/, "") || fx?.effectName || "";
  return ed?.enemyName?.trim() || titleFallback;
}

function displayNameForEntry(row: AutochessEnemyGainGroup) {
  return row.enemyData?.enemyName || row.effects[0]?.effectName || "";
}

const CALC_MODE_TYPE_OPTIONS: { id: AutochessCalcModeType; label: string }[] = [
  { id: "MULTI", label: "联机" },
  { id: "SINGLE", label: "单人" },
];

const CALC_DIFFICULTY_OPTIONS: {
  id: AutochessCalcDifficulty;
  label: string;
}[] = [
  { id: "FUNNY", label: "标准" },
  { id: "NORMAL", label: "险境" },
  { id: "HARD", label: "绝境" },
  { id: "ABYSS", label: "终极" },
];

const CALC_WAVE_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const w = i + 1;
  return { id: String(w), label: String(w) };
});

const ENEMY_GAIN_CALC_SUMMARY =
  "属性计算：先按模式与难度对生命、攻击做预处理（单人标准/险境 ×0.7、绝境/终极 ×0.8；联机标准/险境 ×0.8、绝境/终极不降低）；再按所选波次查表得强化次数 n，生命 ×1.2^n、攻击 ×1.1^n。界面数值四舍五入至两位小数；悬停生命上限与攻击力可查看分步过程。";

type Props = {
  rows: AutochessEnemyGainGroup[];
};

export default function AutochessEnemyGainSelectorLayout({ rows }: Props) {
  const [enemyPriceFilter, setEnemyPriceFilter] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [calcModeType, setCalcModeType] =
    useState<AutochessCalcModeType>("MULTI");
  const [calcDifficulty, setCalcDifficulty] =
    useState<AutochessCalcDifficulty>("HARD");
  const [calcWave, setCalcWave] = useState(3);

  const filteredRows = useMemo(
    () => rows.filter((r) => matchesEnemyPriceFilter(r, enemyPriceFilter)),
    [rows, enemyPriceFilter],
  );

  useEffect(() => {
    setSelectedGroupId((prev) => {
      const ids = filteredRows.map((r) => r.id);
      if (ids.length === 0) return null;
      if (prev && ids.includes(prev)) return prev;
      return ids[0];
    });
  }, [filteredRows]);

  const selectedRow = useMemo(
    () => filteredRows.find((r) => r.id === selectedGroupId) ?? null,
    [filteredRows, selectedGroupId],
  );

  const displayEnemyCalc = useMemo(() => {
    if (!selectedRow) return undefined;
    const base = (selectedRow.enemyData?.attributes ?? {}) as Record<
      string,
      number
    >;
    return computeDisplayedEnemyAttributes(
      calcModeType,
      calcDifficulty,
      calcWave,
      base,
    );
  }, [selectedRow, calcModeType, calcDifficulty, calcWave]);

  if (rows.length === 0) {
    return (
      <div className="px-2 pb-2">
        <p className="p-3 text-light-gray">暂无数据</p>
        <p className="mt-2 border-t border-mid-gray/50 px-3 pb-1 pt-3 text-xs leading-relaxed text-light-mid-gray">
          {ENEMY_GAIN_CALC_SUMMARY}
        </p>
      </div>
    );
  }

  return (
    <div className="px-2 pb-2">
      <div
        className="mb-3 grid min-w-0 gap-x-4 gap-y-1"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(12rem, 1fr))" }}
      >
        <ToolSelect
          disallowEmptySelection
          label="模式"
          array={CALC_MODE_TYPE_OPTIONS}
          getKey={(o) => o.id}
          getValue={(o) => o.label}
          selectedKeys={[calcModeType]}
          onChange={(e) =>
            setCalcModeType(e.target.value as AutochessCalcModeType)
          }
        />
        <ToolSelect
          disallowEmptySelection
          label="难度"
          array={CALC_DIFFICULTY_OPTIONS}
          getKey={(o) => o.id}
          getValue={(o) => o.label}
          selectedKeys={[calcDifficulty]}
          onChange={(e) =>
            setCalcDifficulty(e.target.value as AutochessCalcDifficulty)
          }
        />
        <ToolSelect
          disallowEmptySelection
          label="波次"
          array={CALC_WAVE_OPTIONS}
          getKey={(o) => o.id}
          getValue={(o) => o.label}
          selectedKeys={[String(calcWave)]}
          onChange={(e) => setCalcWave(Number(e.target.value))}
        />
      </div>
      <div className="mb-2 text-xs font-bold text-light-gray">选择赏金</div>
      {/* OperatorPicker.tsx 第 74 行盟约网格同款 */}
      <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-[1px] bg-black-gray">
        {Array.from({ length: 7 }, (_, n) => (
          <button
            key={n}
            type="button"
            className={
              "text-center font-bold leading-[2.5rem] text-sm " +
              (enemyPriceFilter === n
                ? "bg-ak-blue text-black"
                : "bg-black-gray text-white")
            }
            onClick={() => setEnemyPriceFilter(n)}
          >
            {n}
          </button>
        ))}
      </div>

      {filteredRows.length === 0 ? (
        <p className="p-3 text-light-gray">当前标价下暂无悬赏</p>
      ) : (
        <StyledStageSelectorBody>
          <div>
            <StyledEnemiesLabel>
              <span className="whitespace-nowrap">点击选择悬赏敌人</span>
            </StyledEnemiesLabel>
            <StyledEnemies>
              {filteredRows.map((row) => (
                <StyledEnemy
                  key={row.id}
                  $selected={row.id === selectedGroupId}
                  onClick={() => setSelectedGroupId(row.id)}
                >
                  <EnemyAvatar
                    name={avatarNameForEntry(row)}
                    displayName={displayNameForEntry(row)}
                    fontSize="0.65rem"
                  />
                </StyledEnemy>
              ))}
            </StyledEnemies>
          </div>
          {selectedRow ? (
            <AutochessEnemyGainReadonlyPanel
              entry={selectedRow}
              displayAttributes={displayEnemyCalc?.attributes}
              attrCalcBreakdown={displayEnemyCalc?.breakdown}
            />
          ) : (
            <div></div>
          )}
        </StyledStageSelectorBody>
      )}
      <p className="mt-3 pt-3 text-xs leading-relaxed text-light-mid-gray">
        {ENEMY_GAIN_CALC_SUMMARY}
      </p>
    </div>
  );
}
