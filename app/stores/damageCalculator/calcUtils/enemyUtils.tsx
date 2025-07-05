import type { EnemySpecConfig } from "~/modules/Tool/DamageCalculator/EnemySection/EnemySpecSelector";

/** 获取敌人说明图 */
export function getEnemyIllust(enemyConfig: EnemySpecConfig) {
  if (!enemyConfig.selects.filter((select) => select.img).length) return null;
  return (
    <div className="mt-4 flex flex-col gap-4">
      {enemyConfig.selects
        .map((select) => {
          return select.img;
        })
        .filter((i) => i)
        .map((img) => (
          <img className="w-full" src={img} alt="illust" key={img} />
        ))}
    </div>
  );
}
export const displayAttrKeys: Record<string, { min: number; max?: number; tooltip?: React.ReactNode }> = {
  maxHp: {
    min: 0,
  },
  atk: {
    min: 0,
  },
  def: {
    min: 0,
  },
  magicResistance: {
    min: 0,
  },
  // attackSpeed: {
  //   min: 0,
  //   max: 600,
  // },
  // baseAttackTime: {
  //   min: 0,
  // },
  epResistance: {
    min: 0,
  },
  epDamageResistance: {
    min: 0,
  },
  damageResistance: {
    min: 0,
    max: 1,
    tooltip: (
      <ul className="text-sm p-2">
        <li>局外减伤（精英敌人10、终结的骨架20，取最大值）</li>
        <li>敌人特殊能力，例如大特的减伤</li>
        <li>年代印痕减伤</li>
        <li>以上三种类型之间取概率并集</li>
      </ul>
    ),
  },
};
