import type {
  AttributeModifier,
  BlackboardData,
  CharAttributeExt,
} from "~/types/gameData";

export function applyBlackboard(bb: BlackboardData, result: CharAttributeExt) {
  switch (bb.key) {
    case "damage_scale": {
      result.damage_scale += bb.value - 1;
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
