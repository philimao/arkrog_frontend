/**
 * 卫戍协议「敌人悬赏」只读敌人面板：数据来自 AutochessEnemyGainGroup；
 * 展示字段见 `../utils/enemyGainDisplayAttrs`。
 */
import type { ReactNode } from "react";
import { Tooltip } from "@heroui/react";
import { styled } from "styled-components";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import type { AutochessEnemyGainGroup } from "~/types/autochess";
import {
  ENEMY_GAIN_DISPLAY_ATTR_KEYS,
  enemyGainAttrMeta,
} from "../utils/const";
import {
  type EnemyHpAtkCalcBreakdown,
  formatAutochessAttrNumber,
} from "../utils/calculate";
import { parseAutochessDesc } from "../utils/autochess";

function formatCalcDetail(n: number): string {
  return String(Number(n.toFixed(4)));
}

function AttrCalcProcessTooltip({
  kind,
  breakdown,
}: {
  kind: "maxHp" | "atk";
  breakdown: EnemyHpAtkCalcBreakdown;
}): ReactNode {
  const perStack = kind === "maxHp" ? 1.2 : 1.1;
  const statLabel = kind === "maxHp" ? "生命上限" : "攻击力";
  const base = kind === "maxHp" ? breakdown.baseMaxHp : breakdown.baseAtk;
  const afterPre =
    kind === "maxHp" ? breakdown.afterPreMaxHp : breakdown.afterPreAtk;
  const afterWave =
    kind === "maxHp" ? breakdown.afterWaveMaxHp : breakdown.afterWaveAtk;
  const display =
    kind === "maxHp" ? breakdown.displayMaxHp : breakdown.displayAtk;

  if (base == null) {
    return <span>无数据库 {statLabel} 数据</span>;
  }

  const n = breakdown.enhancementCount;
  const stackPow =
    n != null && n > 0 ? Number((perStack ** n).toFixed(6)) : null;
  const waveMult =
    kind === "maxHp"
      ? breakdown.waveHpMultiplier
      : breakdown.waveAtkMultiplier;
  const useWaveMult =
    waveMult != null && Number.isFinite(waveMult) && waveMult > 0;

  return (
    <div className="max-w-[17rem] space-y-1 text-left text-xs leading-snug">
      <div>
        ① 原始属性：<span className="font-mono">{formatCalcDetail(base)}</span>
      </div>
      <div>
        ② 预处理：×{breakdown.preprocessMult}
        {afterPre != null ? (
          <>
            {" → "}
            <span className="font-mono">{formatCalcDetail(afterPre)}</span>
          </>
        ) : null}
      </div>
      {useWaveMult ? (
        <div>
          ③ 波次强化：
          <span className="font-mono"> ×{formatCalcDetail(waveMult)}</span>
        </div>
      ) : n === null ? (
        <div>③ 波次强化：表中为「/」，未叠乘 {perStack}</div>
      ) : n === 0 ? (
        <div>③ 波次强化：n = 0，未叠乘 {perStack}</div>
      ) : (
        <div>
          ③ 波次强化：n = {n}，× {perStack}
          <sup>{n}</sup>
          {stackPow != null ? (
            <>
              {" = ×"}
              <span className="font-mono">{stackPow}</span>
            </>
          ) : null}
        </div>
      )}
      {afterWave != null ? (
        <div>
          ④ 舍入前：
          <span className="font-mono">{formatCalcDetail(afterWave)}</span>
        </div>
      ) : null}
      {display != null ? (
        <div>
          ⑤ 展示（≤2 位小数）：
          <span className="font-mono">
            {formatAutochessAttrNumber(display)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** 与 DamageCalculator/EnemySection/enemyUtils 一致，避免引入计算器 store */
const levelTypeMap: Record<string, string> = {
  NORMAL: "普通",
  ELITE: "精英",
  BOSS: "领袖",
};

const enemyTagMap: Record<string, string> = {
  infection: "感染生物",
  collapsal: "坍缩体",
  animated: "化物",
  seamonster: "海怪",
  drone: "无人机",
  machine: "机械",
  origen: "源石造物",
  sarkaz: "萨卡兹",
  mutant: "宿主",
  originiumartscraft: "法术造物",
  wildanimal: "野生动物",
};

const StyledLayoutColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1.25rem;
`;

const StyledPanelHeader = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

/** 头像 + 描述横排；min-width:0 防止文案把头像挤出叠层 */
const StyledTopRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
  min-width: 0;
`;

const StyledAvatarCell = styled.div`
  width: 10rem;
  flex-shrink: 0;
`;

const StyledDecisionColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StyledName = styled.div`
  font-size: 1.5rem;
  color: white;
  font-weight: bold;
  white-space: nowrap;
`;

const StyledEnemyTag = styled.div`
  font-size: 0.8rem;
  color: white;
  font-weight: bold;
  white-space: nowrap;
  border-radius: 0.25rem;
  padding: 0.1rem 0.5rem;
  background: var(--mid-gray);
`;

const StyledEnmeyLevelBadge = styled(StyledEnemyTag)<{ $levelType: string }>`
  background: ${({ $levelType }) => {
    if ($levelType === "BOSS") return "var(--ak-purple)";
    if ($levelType === "ELITE") return "var(--ak-red)";
    return "var(--mid-gray)";
  }};
`;

const StyledEnemyAvatar = styled(EnemyAvatar)`
  width: 10rem;
  height: 10rem;
  max-width: 100%;
  display: block;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 0 0 0.5rem white;
`;

const StyledDecisionDesc = styled.div`
  font-size: 0.9rem;
  color: var(--light-gray);
  line-height: 1.4;
  white-space: pre-line;
`;

const StyledEffectBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StyledEffectTitle = styled.div`
  font-size: 0.95rem;
  font-weight: bold;
  color: var(--ak-blue);
`;

/** 与 EnemyDisplay 属性区一致：深色底双列网格 */
const StyledAttrGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem 1rem;
  background: rgba(24, 24, 24, 0.7);
  padding: 1rem;
  margin-bottom: 0;
`;

const StyledInputWrapper = styled.div`
  & > div:first-child {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
    font-weight: bold;
    padding-left: 0.75rem;
    color: var(--light-mid-gray);
  }
`;

/** 对齐 ToolInput / EnemyDisplay 数值行的深色底 */
const StyledAttrValueBox = styled.div`
  height: 2rem;
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  background: var(--black-gray);
  font-family: "NovecentoWide", sans-serif;
  font-weight: bold;
  font-size: 1.25rem;
`;

const StyledEmptyHint = styled.div`
  font-size: 0.85rem;
  color: var(--light-mid-gray);
  padding: 0.5rem 0.75rem;
`;

type Props = {
  entry: AutochessEnemyGainGroup;
  /** 传入时属性格优先用此对象（经预处理+波次计算并取两位小数），缺项回退数据库原始值 */
  displayAttributes?: Record<string, number>;
  /** 与 displayAttributes 同源；用于生命/攻击数值上的计算过程提示 */
  attrCalcBreakdown?: EnemyHpAtkCalcBreakdown;
};

export default function AutochessEnemyGainReadonlyPanel({
  entry,
  displayAttributes,
  attrCalcBreakdown,
}: Props) {
  const ed = entry.enemyData;
  const firstFx = entry.effects[0];
  const titleName =
    ed?.enemyName?.trim() ||
    firstFx?.effectName.replace(/·.+?$/, "") ||
    firstFx?.effectName ||
    "悬赏";
  const avatarName = ed?.enemyName?.trim() || titleName;

  const rawAttrs = ed?.attributes ?? {};
  const hasDbAttrs =
    displayAttributes !== undefined
      ? ENEMY_GAIN_DISPLAY_ATTR_KEYS.some(
          (k) =>
            displayAttributes[k] != null ||
            rawAttrs[k as keyof typeof rawAttrs] != null,
        )
      : ed != null && Object.keys(rawAttrs).length > 0;

  const attributeKeysToShow = ENEMY_GAIN_DISPLAY_ATTR_KEYS;

  return (
    <StyledLayoutColumn>
      <StyledPanelHeader>
        <StyledName>{titleName}</StyledName>
        <div className="flex gap-2">
          {ed?.levelType ? (
            <StyledEnmeyLevelBadge $levelType={ed.levelType}>
              {levelTypeMap[ed.levelType] ?? ed.levelType}
            </StyledEnmeyLevelBadge>
          ) : null}
          {ed?.enemyTags?.[0] ? (
            <StyledEnemyTag>
              {enemyTagMap[ed.enemyTags[0]] ?? ed.enemyTags[0]}
            </StyledEnemyTag>
          ) : null}
        </div>
      </StyledPanelHeader>

      <StyledTopRow>
        <StyledAvatarCell>
          <StyledEnemyAvatar name={avatarName} />
        </StyledAvatarCell>
        <StyledDecisionColumn>
          {entry.effects.map((fx) => (
            <StyledEffectBlock key={fx.effectId}>
              <StyledEffectTitle>{fx.effectName}</StyledEffectTitle>
              <StyledDecisionDesc>
                {parseAutochessDesc(fx.effectDesc)}
              </StyledDecisionDesc>
            </StyledEffectBlock>
          ))}
        </StyledDecisionColumn>
      </StyledTopRow>

      <StyledAttrGrid>
        {!hasDbAttrs ? (
          <StyledEmptyHint style={{ gridColumn: "1 / -1" }}>
            暂无敌人数据库 level0 属性（可能缺少 enemy_id 或未命中
            enemy_database）。
          </StyledEmptyHint>
        ) : (
          attributeKeysToShow.map((key) => {
            const meta = enemyGainAttrMeta[key];
            const rawVal =
              displayAttributes !== undefined
                ? (displayAttributes[key] ??
                  rawAttrs[key as keyof typeof rawAttrs])
                : rawAttrs[key as keyof typeof rawAttrs];
            const colorClass =
              key === "maxHp"
                ? "text-ak-blue"
                : key === "atk"
                  ? "text-ak-red"
                  : "text-white";
            const text =
              rawVal === undefined || rawVal === null
                ? "—"
                : typeof rawVal === "number" && Number.isFinite(rawVal)
                  ? displayAttributes !== undefined
                    ? formatAutochessAttrNumber(rawVal)
                    : String(rawVal)
                  : String(rawVal);
            const tooltip = meta.tooltip;
            const showValueCalcTooltip =
              attrCalcBreakdown != null &&
              displayAttributes !== undefined &&
              (key === "maxHp" || key === "atk");
            const valueBox = (
              <StyledAttrValueBox
                className={
                  colorClass + (showValueCalcTooltip ? " cursor-help" : "")
                }
                tabIndex={showValueCalcTooltip ? 0 : undefined}
              >
                {text}
              </StyledAttrValueBox>
            );
            return (
              <StyledInputWrapper key={key}>
                <div className="flex justify-between items-center gap-1 pr-1">
                  <span>{meta.label}</span>
                  {tooltip ? (
                    <Tooltip content={tooltip} closeDelay={100}>
                      <svg
                        className="w-4 h-4 shrink-0 text-light-mid-gray"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <use href="#question_circle" />
                      </svg>
                    </Tooltip>
                  ) : null}
                </div>
                {showValueCalcTooltip ? (
                  <Tooltip
                    content={
                      <AttrCalcProcessTooltip
                        kind={key}
                        breakdown={attrCalcBreakdown}
                      />
                    }
                    closeDelay={100}
                  >
                    {valueBox}
                  </Tooltip>
                ) : (
                  valueBox
                )}
              </StyledInputWrapper>
            );
          })
        )}
      </StyledAttrGrid>
    </StyledLayoutColumn>
  );
}
