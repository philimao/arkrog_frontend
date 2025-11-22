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
