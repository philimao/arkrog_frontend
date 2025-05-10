import type {
  AttributeModifier,
  BlackboardData,
  CalculatorInput,
  CalculatorOutput,
  CharAttributeExt,
} from "~/types/gameData";
import { getCalculatorImpl } from "./impls";

export function applyBlackboard(bb: BlackboardData, result: CharAttributeExt) {
  switch (bb.key) {
    case "damageScale": {
      result.damageScale += bb.value - 1;
      break;
    }
    case "max_hp": {
      result.maxHp += bb.value;
      break;
    }
    case "atk": {
      result.atk += bb.value;
      break;
    }
  }
}

export function applyAttrModifiers(
  mod: AttributeModifier,
  result: CharAttributeExt,
) {
  switch (mod.attributeType) {
    case "COST": {
      result.cost += mod.value;
      break;
    }
    case "MAX_HP": {
      result.maxHp += mod.value;
      break;
    }
    case "ATK": {
      result.atk += mod.value;
      break;
    }
    case "DEF": {
      result.def += mod.value;
      break;
    }
    case "ATTACK_SPEED": {
      result.attackSpeed += mod.value;
      break;
    }
    case "MAGIC_RESISTANCE": {
      result.magicResistance += mod.value;
      break;
    }
    case "RESPAWN_TIME": {
      result.respawnTime += mod.value;
      break;
    }
  }
}

/**
 * 伤害计算器总入口
 * @param input 输入数据
 * @returns 输出数据
 */
export function calculator(input: CalculatorInput): CalculatorOutput {
  // 获取干员计算器实现
  const impl = getCalculatorImpl(input.charData.appellation);
  return impl(input);
}
