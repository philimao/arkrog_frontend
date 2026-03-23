/**
 * 卫戍协议：按模式、难度、波次查「敌人强化次数」表，对 maxHp / atk 做叠乘（每强化一次 hp×1.2、atk×1.1）。
 * 表数据来自游戏内规则；ABYSS 与 HARD 共用「绝境」列；不含 TRAINING。
 */

export type AutochessCalcModeType = "SINGLE" | "MULTI";

/** 计算用难度；ABYSS 查表列与 HARD 相同 */
export type AutochessCalcDifficulty = "FUNNY" | "NORMAL" | "HARD" | "ABYSS";

export type AutochessCalcMode = {
  modeId: string;
  /** 展示用：单人/联机 - 与 modeDataDict.name 一致 */
  name: string;
  modeType: AutochessCalcModeType;
  modeDifficulty: AutochessCalcDifficulty;
};

/** 每强化一次：生命 ×1.2、攻击 ×1.1（分别累计） */
const HP_MULT_PER_STACK = 1.2;
const ATK_MULT_PER_STACK = 1.1;

/**
 * 行下标 0 = wave1 … 14 = wave15；列 0=标准 FUNNY，1=险境 NORMAL，2=绝境 HARD。
 * `null` 表示图中「/」，该格无强化次数定义。
 */
const SINGLE_TABLE: (number | null)[][] = [
  [0, 0, 1],
  [0, 0, 2],
  [0, 0, 2],
  [0, 1, 2],
  [0, 1, 2],
  [0, 1, 2],
  [0, 1, 2],
  [0, 2, 2],
  [0, 3, 3],
  [0, 3, 3],
  [0, 4, 4],
  [1, 4, 5],
  [1, 4, 6],
  [1, 5, 7],
  [null, null, 7],
];

const MULTI_TABLE: (number | null)[][] = [
  [0, 0, 1],
  [0, 1, 2],
  [0, 1, 2],
  [0, 2, 3],
  [0, 2, 3],
  [0, 2, 3],
  [0, 2, 3],
  [0, 3, 3],
  [0, 4, 4],
  [0, 4, 4],
  [0, 5, 6],
  [1, 6, 6],
  [1, 7, 7],
  [1, 7, 8],
  [null, null, 8],
];

function difficultyColumn(d: AutochessCalcDifficulty): number {
  if (d === "FUNNY") return 0;
  if (d === "NORMAL") return 1;
  return 2;
}

/** 与 autochess.json modeDataDict 对齐（不含入门协议） */
export const AUTOCHESS_CALC_MODES: readonly AutochessCalcMode[] = [
  {
    modeId: "mode_single_funny",
    name: "单人 - 标准模拟",
    modeType: "SINGLE",
    modeDifficulty: "FUNNY",
  },
  {
    modeId: "mode_single_normal",
    name: "单人 - 险境模拟",
    modeType: "SINGLE",
    modeDifficulty: "NORMAL",
  },
  {
    modeId: "mode_single_hard",
    name: "单人 - 绝境模拟",
    modeType: "SINGLE",
    modeDifficulty: "HARD",
  },
  {
    modeId: "mode_single_abyss",
    name: "单人 - 终极模拟",
    modeType: "SINGLE",
    modeDifficulty: "ABYSS",
  },
  {
    modeId: "mode_multi_funny",
    name: "联机 - 标准模拟",
    modeType: "MULTI",
    modeDifficulty: "FUNNY",
  },
  {
    modeId: "mode_multi_normal",
    name: "联机 - 险境模拟",
    modeType: "MULTI",
    modeDifficulty: "NORMAL",
  },
  {
    modeId: "mode_multi_hard",
    name: "联机 - 绝境模拟",
    modeType: "MULTI",
    modeDifficulty: "HARD",
  },
  {
    modeId: "mode_multi_abyss",
    name: "联机 - 终极模拟",
    modeType: "MULTI",
    modeDifficulty: "ABYSS",
  },
];

export type EnhancementCountParams = {
  modeType: AutochessCalcModeType;
  modeDifficulty: AutochessCalcDifficulty;
  /** 1–15；非整数或越界返回 null */
  wave: number;
};

/**
 * 查表得强化次数 n。表中「/」为 null；wave 非 1–15 的整数时返回 null。
 */
export function getEnhancementCount(
  params: EnhancementCountParams,
): number | null {
  const { modeType, modeDifficulty, wave } = params;
  if (!Number.isInteger(wave) || wave < 1 || wave > 15) {
    return null;
  }
  const row = wave - 1;
  const col = difficultyColumn(modeDifficulty);
  const table = modeType === "SINGLE" ? SINGLE_TABLE : MULTI_TABLE;
  const cell = table[row][col];
  return cell;
}

export type WaveCalcParams = EnhancementCountParams;

export type WaveCalcResult = {
  attributes: Record<string, number>;
  /** 与 getEnhancementCount 一致；为 null 时不改 maxHp/atk */
  enhancementCount: number | null;
};

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** 绝境列：HARD / ABYSS */
function isAbyssalDifficulty(d: AutochessCalcDifficulty): boolean {
  return d === "HARD" || d === "ABYSS";
}

/**
 * 预处理对生命/攻击的倍率。
 * - 单人：标准/险境 ×0.7；绝境/终极 ×0.8
 * - 联机：标准/险境 ×0.8；绝境/终极 ×1
 */
export function getPreprocessMultiplier(
  modeType: AutochessCalcModeType,
  modeDifficulty: AutochessCalcDifficulty,
): number {
  if (modeType === "SINGLE") {
    return isAbyssalDifficulty(modeDifficulty) ? 0.8 : 0.7;
  }
  return isAbyssalDifficulty(modeDifficulty) ? 1 : 0.8;
}

/**
 * 按模式与难度对数据库 level0 属性做预处理：仅缩放 maxHp、atk。
 */
export function preprocessEnemyAttributes(
  modeType: AutochessCalcModeType,
  modeDifficulty: AutochessCalcDifficulty,
  attributes: Record<string, number>,
): Record<string, number> {
  const mult = getPreprocessMultiplier(modeType, modeDifficulty);
  const out: Record<string, number> = { ...attributes };
  if (isFiniteNumber(out.maxHp)) out.maxHp *= mult;
  if (isFiniteNumber(out.atk)) out.atk *= mult;
  return out;
}

const ATTR_ROUND_DECIMALS = 2;

/** 将 record 内有限数值四舍五入到固定小数位（展示用） */
export function roundAttributeNumbers(
  attributes: Record<string, number>,
  decimals = ATTR_ROUND_DECIMALS,
): Record<string, number> {
  const f = 10 ** decimals;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(attributes)) {
    if (isFiniteNumber(v)) {
      out[k] = Math.round(v * f) / f;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function formatAutochessAttrNumber(n: number): string {
  const r = Math.round(n * 10 ** ATTR_ROUND_DECIMALS) / 10 ** ATTR_ROUND_DECIMALS;
  if (!Number.isFinite(r)) return String(n);
  return String(Number(r.toFixed(ATTR_ROUND_DECIMALS)));
}

function numOrNull(v: unknown): number | null {
  return isFiniteNumber(v) ? v : null;
}

/** 生命/攻击从数据库到展示值的中间量，供 UI 展示计算过程 */
export type EnemyHpAtkCalcBreakdown = {
  baseMaxHp: number | null;
  baseAtk: number | null;
  preprocessMult: number;
  afterPreMaxHp: number | null;
  afterPreAtk: number | null;
  enhancementCount: number | null;
  /** 波次叠乘后、四舍五入前 */
  afterWaveMaxHp: number | null;
  afterWaveAtk: number | null;
  displayMaxHp: number | null;
  displayAtk: number | null;
};

export type DisplayedEnemyAttributesResult = WaveCalcResult & {
  breakdown: EnemyHpAtkCalcBreakdown;
};

/**
 * 预处理 → 波次强化（maxHp/atk）→ 数值四舍五入至两位小数。
 */
export function computeDisplayedEnemyAttributes(
  modeType: AutochessCalcModeType,
  modeDifficulty: AutochessCalcDifficulty,
  wave: number,
  baseAttributes: Record<string, number>,
): DisplayedEnemyAttributesResult {
  const preprocessMult = getPreprocessMultiplier(modeType, modeDifficulty);
  const pre = preprocessEnemyAttributes(modeType, modeDifficulty, {
    ...baseAttributes,
  });
  const { attributes: afterWave, enhancementCount } = calculateWaveAttributes(
    { modeType, modeDifficulty, wave },
    pre,
  );
  const rounded = roundAttributeNumbers(afterWave);
  const breakdown: EnemyHpAtkCalcBreakdown = {
    baseMaxHp: numOrNull(baseAttributes.maxHp),
    baseAtk: numOrNull(baseAttributes.atk),
    preprocessMult,
    afterPreMaxHp: numOrNull(pre.maxHp),
    afterPreAtk: numOrNull(pre.atk),
    enhancementCount,
    afterWaveMaxHp: numOrNull(afterWave.maxHp),
    afterWaveAtk: numOrNull(afterWave.atk),
    displayMaxHp: numOrNull(rounded.maxHp),
    displayAtk: numOrNull(rounded.atk),
  };
  return {
    attributes: rounded,
    enhancementCount,
    breakdown,
  };
}

/**
 * 浅拷贝 attributes，仅对 maxHp、atk 叠乘；n 为 null 时数值不变。
 */
export function calculateWaveAttributes(
  params: WaveCalcParams,
  attributes: Record<string, number>,
): WaveCalcResult {
  const n = getEnhancementCount(params);
  const out: Record<string, number> = { ...attributes };

  if (n === null) {
    return { attributes: out, enhancementCount: null };
  }

  if (isFiniteNumber(out.maxHp)) {
    out.maxHp = out.maxHp * HP_MULT_PER_STACK ** n;
  }
  if (isFiniteNumber(out.atk)) {
    out.atk = out.atk * ATK_MULT_PER_STACK ** n;
  }

  return { attributes: out, enhancementCount: n };
}

/**
 * 按 modeId 在 AUTOCHESS_CALC_MODES 中解析后计算；未知 modeId 返回 null。
 */
export function calculateWaveAttributesFromModeId(
  modeId: string,
  wave: number,
  attributes: Record<string, number>,
): WaveCalcResult | null {
  const mode = AUTOCHESS_CALC_MODES.find((m) => m.modeId === modeId);
  if (!mode) return null;
  return calculateWaveAttributes(
    {
      modeType: mode.modeType,
      modeDifficulty: mode.modeDifficulty,
      wave,
    },
    attributes,
  );
}
