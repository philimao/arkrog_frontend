import type { EnemyDataParsed } from "~/types/gameData";

const enemies: EnemyDataParsed[] = [
  {
    id: "dummy",
    level: 0,
    name: "木桩",
    description: "请任意调整木桩数值",
    attributes: {
      maxHp: 0,
      atk: 0,
      def: 0,
      magicResistance: 0,
      blockCnt: 0,
      moveSpeed: 0,
      attackSpeed: 0,
      baseAttackTime: 0,
      epDamageResistance: 0,
      epResistance: 0,
    },
    levelType: "NORMAL",
    rangedRadius: 0,
  },
];

export default enemies;
