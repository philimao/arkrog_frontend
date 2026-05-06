import { useMemo } from "react";
import type { AutochessBond, AutochessOperator } from "~/types/autochess";
import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import { StyledTitle } from "~/modules/Tool/components/Shared";
import { getPath, imageHost } from "~/utils/tools";
import { parseAutochessDesc } from "../utils/autochess";

/** 与 character_table 一致；用户文案中的「莱因哈特」游戏内为「莱恩哈特」 */
const OPERATOR_NAME_ALIASES: Record<string, string> = {
  莱因哈特: "莱恩哈特",
};

export interface KeyChessRule {
  operatorName: string;
  effect: string;
}

function normalizeOperatorName(name: string) {
  return OPERATOR_NAME_ALIASES[name] ?? name;
}

function resolveOperator(
  operators: AutochessOperator[],
  ruleName: string,
): AutochessOperator | undefined {
  const canon = normalizeOperatorName(ruleName);
  return operators.find((o) => o.name === ruleName || o.name === canon);
}

/** 未被 Ban 时展示的「关键干员」 */
const AVAILABLE_RULES: KeyChessRule[] = [
  { operatorName: "缇缇", effect: "萨尔贡叠层。" },
  { operatorName: "夕", effect: "道中与本家叠层的重要来源。" },
  { operatorName: "灵知", effect: "冻结与谢拉格体系运转。" },
  { operatorName: "耶拉", effect: "提供谢拉格叠层与不融冰相关运营。" },
  { operatorName: "薄绿", effect: "维多利亚核心叠层手段之一。" },
  { operatorName: "空弦", effect: "道中叠灵巧的优质选择，可配合拉特兰等。" },
  { operatorName: "歌蕾蒂娅", effect: "阿戈尔本家经济与节奏支点。" },
  { operatorName: "白面鸮", effect: "与歌蕾蒂娅、空弦等形成辅助向叠层。" },
  { operatorName: "魔王", effect: "与缇缇、圣约送葬人等形成辅助向叠层。" },
  { operatorName: "拉普兰德", effect: "叙拉古前中期层数积累。" },
  { operatorName: "荒芜拉普兰德", effect: "叙拉古后期层数与上限。" },
  { operatorName: "铃兰", effect: "可与焰尾、忍冬等形成辅助或经济向选择。" },
  { operatorName: "砾", effect: "不屈基石向与卡西米尔户口叠层。" },
  { operatorName: "远牙", effect: "双户口叠层与精准向配合。" },
  { operatorName: "焰尾", effect: "卡西米尔经济牌与层数来源。" },
  { operatorName: "妮芙", effect: "迅捷层数质变与技能循环上限相关。" },
  {
    operatorName: "塞雷娅",
    effect: "与妮芙、夕、溯光星源、薄绿等形成辅助向叠层。",
  },
  { operatorName: "圣约送葬人", effect: "拉特兰体系终端与远见相关构筑。" },
];

/** 主盟约核心：被 Ban 后不推荐对应盟约 */
const BANNED_MAIN_RULES: KeyChessRule[] = [
  {
    operatorName: "夕",
    effect:
      "夕被 ban 基本宣告了炎不可能找到上限，道中会损失大量层数同时使炎队失去本家奥术。",
  },
  {
    operatorName: "小满",
    effect:
      "小满被 ban 一方面会导致炎前中期失去稳定叠层手段，另一方面会让炎队失去本家灵巧。",
  },
  {
    operatorName: "缇缇",
    effect: "缇缇是萨尔贡唯一叠层上限，被 ban 绝对别玩萨尔贡，区完了。",
  },
  {
    operatorName: "薄绿",
    effect:
      "薄绿是维多利亚的核心叠层手，ban 了就别玩维多利亚了（即使策略选变形者也不推荐）。",
  },
  {
    operatorName: "号角",
    effect: "其实号角 ban 了维多利亚也能玩但是叠层还是会慢很多，因此不推荐玩。",
  },
  {
    operatorName: "烛煌",
    effect: "维多利亚没烛煌这个输出终端很容易道中自刎归天。",
  },
  {
    operatorName: "初雪",
    effect: "初雪为谢拉格三阶叠层卡，被 ban 严重影响谢拉格叠层节奏。",
  },
  {
    operatorName: "银灰",
    effect: "银灰为谢拉格四阶叠层卡，被 ban 严重影响谢拉格后期层数。",
  },
  {
    operatorName: "灵知",
    effect: "谢拉格没了灵知既缺少冻结手段又失去本家灵巧。",
  },
  {
    operatorName: "耶拉",
    effect: "谢拉格没有不融冰的获取很难使用双冰 askl 进行单回合的叠层爆发。",
  },
  {
    operatorName: "新约能天使",
    effect:
      "拉特兰只需考虑终端新能是否被 ban，因为哥哥被 ban 新能一定被 ban，反过来不一定，但也玩不了拉特兰。",
  },
  {
    operatorName: "歌蕾蒂娅",
    effect:
      "阿戈尔一旦上 ban 本家基本上就没人了，这里拿 ban 歌蕾蒂娅这个单盟约干员作为典型代表。",
  },
  {
    operatorName: "荒芜拉普兰德",
    effect: "ban 了叙拉古干员就别玩叙拉古了。",
  },
  {
    operatorName: "玛恩纳",
    effect:
      "卡西米尔的终端，也是卡西米尔单户口，ban 了卡西米尔就别玩卡西米尔了。",
  },
];

/** 副盟约叠层：被 Ban 后副盟约运营/上限受影响 */
const BANNED_SUB_RULES: KeyChessRule[] = [
  {
    operatorName: "缇缇",
    effect: "精准如果没有缇缇上限会降低很多，对精灵讯打法的影响也非常大。",
  },
  {
    operatorName: "莱恩哈特",
    effect:
      "莱恩哈特是精准和迅捷在道中的强力过渡叠层手，配合华法琳也能快速叠精准迅捷。",
  },
  {
    operatorName: "妮芙",
    effect:
      "妮芙可以让迅捷层数产生质变，如果被 ban 就很难摸到迅捷无限技能的上限了。",
  },
  {
    operatorName: "空弦",
    effect:
      "空弦是卫戍协议目前泛用性最高的干员之一，不仅能为拉特兰提供灵巧也能自成一派转精灵讯，同时空弦是道中叠灵巧的优质选择，空弦白面鸮面对面可以快速叠灵巧。",
  },
  {
    operatorName: "夕",
    effect: "夕是奥术叠层核心干员，也是奥术上限的主要来源之一。",
  },
  {
    operatorName: "溯光星源",
    effect:
      "溯光星源是奥术和灵巧的顶点，一张卡拔高了两个副盟约的上限，非常强力的六阶干员。",
  },
  {
    operatorName: "砾",
    effect: "砾是不屈的基石，被 ban 会大幅延后不屈开始叠层运转的时间。",
  },
  {
    operatorName: "归溟幽灵鲨",
    effect:
      "不屈强力叠层手，被 ban 会很难叠不屈，当然除了卡西米尔和阿戈尔之外也不是很需要叠不屈就是了。",
  },
  {
    operatorName: "瑕光",
    effect: "瑕光是突袭的核心叠层手之一，被 ban 就别惦记叠突袭了。",
  },
  {
    operatorName: "史尔特尔",
    effect:
      "史尔特尔是一张功能性很强的突袭叠层手，可以在叠突袭层数的同时开奥术，比较适配卡西米尔。",
  },
];

const GRID_CLASS = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 mb-8";

function OperatorBondRow({
  operator,
  bonds,
  bondNameMap,
}: {
  operator: AutochessOperator | undefined;
  bonds: AutochessBond[];
  bondNameMap: Record<string, string>;
}) {
  const bondById = useMemo(() => {
    const m: Record<string, AutochessBond> = {};
    for (const b of bonds) m[b.bondId] = b;
    return m;
  }, [bonds]);

  const ids = operator?.bondIds?.length ? operator.bondIds : [];
  if (ids.length === 0) {
    return (
      <div className="text-xs text-default-500">
        {operator ? "暂无盟约数据" : "未找到该干员数据"}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-default-700">
      {ids.map((bondId, i) => {
        const bond = bondById[bondId];
        const label = bondNameMap[bondId] || bondId;
        return (
          <span
            key={bondId}
            className="inline-flex items-center gap-1.5 shrink-0"
          >
            {i > 0 ? (
              <span className="text-light-gray font-normal">/</span>
            ) : null}
            {bond ? (
              <img
                src={
                  imageHost + getPath(`卫戍协议：盟约_icon_${bond.bondId}.png`)
                }
                alt={label}
                className="w-5 h-5 object-contain rounded shrink-0"
                loading="lazy"
                onError={(evt) => {
                  (evt.target as HTMLImageElement).onerror = null;
                  (evt.target as HTMLImageElement).src =
                    "/images/logo/logo.png";
                }}
              />
            ) : null}
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
}

function GarrisonIntroBlock({
  operator,
}: {
  operator: AutochessOperator | undefined;
}) {
  if (!operator?.garrisons?.length) return null;
  return (
    <div className="pt-1 space-y-1.5 border-t border-mid-gray">
      {operator.garrisons.map((garrison) => (
        <div key={garrison.garrisonId} className="text-xs text-default-500">
          <div className="text-light-gray leading-snug">
            {garrison.eventTypeDesc}
          </div>
          <div className="text-[11px] leading-relaxed text-default-500">
            {parseAutochessDesc(garrison.garrisonDesc)}
          </div>
        </div>
      ))}
    </div>
  );
}

function KeyChessCard({
  rule,
  operator,
  bondNameMap,
  bonds,
}: {
  rule: KeyChessRule;
  operator: AutochessOperator | undefined;
  bondNameMap: Record<string, string>;
  bonds: AutochessBond[];
}) {
  const displayName = normalizeOperatorName(rule.operatorName);
  return (
    <div className="flex gap-2 rounded border border-mid-gray bg-black-gray-70 p-2">
      <div className="flex flex-col items-center shrink-0 w-[4rem]">
        <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden border border-mid-gray">
          <OperatorAvatar
            name={displayName}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="mt-0.5 text-[11px] text-center text-default-600 leading-tight line-clamp-2 w-full">
          {displayName}
        </span>
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        <OperatorBondRow
          operator={operator}
          bonds={bonds}
          bondNameMap={bondNameMap}
        />
        <p className="text-sm text-default-800 leading-snug font-medium">
          {rule.effect}
        </p>
        <GarrisonIntroBlock operator={operator} />
      </div>
    </div>
  );
}

export interface KeyChessProps {
  operators: AutochessOperator[];
  banOperatorIds: string[];
  bonds: AutochessBond[];
}

export default function KeyChess({
  operators,
  banOperatorIds,
  bonds,
}: KeyChessProps) {
  const operatorById = useMemo(() => {
    const m: Record<string, AutochessOperator> = {};
    for (const op of operators) m[op.chessId] = op;
    return m;
  }, [operators]);

  const bondNameMap = useMemo(
    () =>
      bonds.reduce(
        (acc, bond) => {
          acc[bond.bondId] = bond.name;
          return acc;
        },
        {} as Record<string, string>,
      ),
    [bonds],
  );

  const bannedNameSet = useMemo(() => {
    const set = new Set<string>();
    for (const id of banOperatorIds) {
      const op = operatorById[id];
      if (op?.name) set.add(op.name);
    }
    return set;
  }, [banOperatorIds, operatorById]);

  const visibleAvailable = useMemo(() => {
    const banned = bannedNameSet;
    const hit = (operatorName: string) => {
      const canon = normalizeOperatorName(operatorName);
      return banned.has(operatorName) || banned.has(canon);
    };
    return AVAILABLE_RULES.filter((r) => !hit(r.operatorName));
  }, [bannedNameSet]);

  const visibleBannedMain = useMemo(() => {
    const banned = bannedNameSet;
    const hit = (operatorName: string) => {
      const canon = normalizeOperatorName(operatorName);
      return banned.has(operatorName) || banned.has(canon);
    };
    return BANNED_MAIN_RULES.filter((r) => hit(r.operatorName));
  }, [bannedNameSet]);

  const visibleBannedSub = useMemo(() => {
    const banned = bannedNameSet;
    const hit = (operatorName: string) => {
      const canon = normalizeOperatorName(operatorName);
      return banned.has(operatorName) || banned.has(canon);
    };
    return BANNED_SUB_RULES.filter((r) => hit(r.operatorName));
  }, [bannedNameSet]);

  return (
    <section className="mb-8">
      <StyledTitle>关键干员</StyledTitle>
      <h3 className="text-base font-semibold text-default-800 mb-3">
        未被 Ban 的关键干员
      </h3>
      {banOperatorIds.length === 0 ? (
        <p className="text-sm text-default-500 mb-6">未选择任何 Ban 干员</p>
      ) : visibleAvailable.length === 0 ? (
        <p className="text-sm text-default-500 mb-6">
          当前列表中的关键干员均已被 Ban，或暂无条目。
        </p>
      ) : (
        <div className={GRID_CLASS}>
          {visibleAvailable.map((rule) => (
            <KeyChessCard
              key={`av-${rule.operatorName}`}
              rule={rule}
              operator={resolveOperator(operators, rule.operatorName)}
              bondNameMap={bondNameMap}
              bonds={bonds}
            />
          ))}
        </div>
      )}

      <h3 className="text-base font-semibold text-default-800 mb-3">
        已被 Ban 的关键干员（不推荐盟约）
      </h3>
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-ak-blue mb-2">
            主盟约不推荐
          </h4>
          {visibleBannedMain.length === 0 ? (
            <p className="text-sm text-default-500">未选择任何 Ban 干员。</p>
          ) : (
            <div className={GRID_CLASS}>
              {visibleBannedMain.map((rule, idx) => (
                <KeyChessCard
                  key={`bm-${rule.operatorName}-${idx}`}
                  rule={rule}
                  operator={resolveOperator(operators, rule.operatorName)}
                  bondNameMap={bondNameMap}
                  bonds={bonds}
                />
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="text-sm font-medium text-ak-blue mb-2">
            副盟约不推荐
          </h4>
          {visibleBannedSub.length === 0 ? (
            <p className="text-sm text-default-500">未选择任何 Ban 干员。</p>
          ) : (
            <div className={GRID_CLASS}>
              {visibleBannedSub.map((rule, idx) => (
                <KeyChessCard
                  key={`bs-${rule.operatorName}-${idx}`}
                  rule={rule}
                  operator={resolveOperator(operators, rule.operatorName)}
                  bondNameMap={bondNameMap}
                  bonds={bonds}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
