/**
 * 敌人悬赏（ENEMY_GAIN）只读面板：展示字段顺序、中文标签与提示。
 * 与后端 `enemyGainEnemyData.js` 的 DISPLAY_ATTR_KEYS 顺序保持一致。
 */
import type { ReactNode } from "react";

/** enemy_database level0 attributes 中可能出现的 camelCase 键 */
export type EnemyGainDisplayAttrKey =
  | "maxHp"
  | "atk"
  | "def"
  | "magicResistance"
  | "attackSpeed"
  | "baseAttackTime"
  | "epResistance"
  | "epDamageResistance";

export const ENEMY_GAIN_DISPLAY_ATTR_KEYS: readonly EnemyGainDisplayAttrKey[] =
  [
    "maxHp",
    "atk",
    "def",
    "magicResistance",
    "attackSpeed",
    "baseAttackTime",
    "epResistance",
    "epDamageResistance",
  ];

export const enemyGainAttrMeta: Record<
  EnemyGainDisplayAttrKey,
  { label: string; tooltip?: ReactNode }
> = {
  maxHp: { label: "生命上限" },
  atk: { label: "攻击力" },
  def: { label: "防御力" },
  magicResistance: { label: "法术抗性" },
  attackSpeed: { label: "攻击速度" },
  baseAttackTime: { label: "攻击间隔" },
  epResistance: { label: "损伤抵抗" },
  epDamageResistance: { label: "元素伤害抗性" },
};
