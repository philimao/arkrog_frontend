/** 弱点伤害比较。起算类型由调用方传入，相对相等时留下起算类型。 */

/** FP.EN5，MathUtil.FP_LARGE_EPS。 */
const FP_LARGE_EPS = 1e-5;

/** MathUtil.RELATIVE_GT：a > b + max(|a|, |b|) × 10⁻⁵。 */
export function relativeGreaterThan(a: number, b: number): boolean {
  const band = Math.max(Math.abs(a), Math.abs(b)) * FP_LARGE_EPS;
  return a > b + band;
}

export type DamageType = "PHYSICAL" | "MAGICAL";

export interface WeakDamageInput {
  /** GetFinalAtk：已经乘过这一下的攻击倍率 */
  atk: number;
  /** calculateEnemyAttr 折好的防御 */
  def: number;
  /** foldedEnemyMagicResistance 折好的法抗 */
  res: number;
  originalType: DamageType;
  damageScale: number;
  damageScalePhy: number;
  damageScaleMag: number;
  defPenFixed?: number;
  defPenRatio?: number;
  magicPenFixed?: number;
  magicPenRatio?: number;
  /** common_weak_damage_flag 指定类型时跳过比较 */
  forcedType?: DamageType;
}

export interface WeakDamageHit {
  type: DamageType;
  /** 乘过胜出一侧易伤，尚未乘减伤 */
  amount: number;
  physical: number;
  magical: number;
}

/** 面板法抗 + 局内加算，再乘局内最终乘算，低于 0 按 0。 */
export function foldedEnemyMagicResistance(base: number, add: number, finalMul: number): number {
  return Math.max((base + add) * finalMul, 0);
}

export function physicalCandidate(
  atk: number,
  def: number,
  defPenFixed = 0,
  defPenRatio = 0,
): number {
  const defPrime = Math.max(def - defPenFixed, 0) * (1 - defPenRatio);
  return Math.max(atk - defPrime, atk * 0.05);
}

export function magicalCandidate(
  atk: number,
  res: number,
  magicPenFixed = 0,
  magicPenRatio = 0,
): number {
  const resPrime = Math.max(res - magicPenFixed, 0) * (1 - magicPenRatio);
  const kept = Math.max(100 - resPrime, 0);
  return Math.max(atk * kept * 0.01, atk * 0.05);
}

export function resolveWeakDamage(input: WeakDamageInput): WeakDamageHit {
  const physical = physicalCandidate(input.atk, input.def, input.defPenFixed, input.defPenRatio);
  const magical = magicalCandidate(input.atk, input.res, input.magicPenFixed, input.magicPenRatio);
  const type =
    input.forcedType ??
    (relativeGreaterThan(physical, magical)
      ? "PHYSICAL"
      : relativeGreaterThan(magical, physical)
        ? "MAGICAL"
        : input.originalType);
  const raw = type === "PHYSICAL" ? physical : magical;
  const typeScale = type === "PHYSICAL" ? input.damageScalePhy : input.damageScaleMag;
  return {
    type,
    amount: raw * input.damageScale * typeScale,
    physical,
    magical,
  };
}
