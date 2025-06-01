import type { RelicWrapper } from "~/types/gameData";
import type { RelicBuff } from "~/types/gameData";
import { BuffContext } from "./buff-context";
import { getByKey, getByKeySafe, registerRelicBlackboard } from "./impls";
import { NumericLiteralNode } from "./ast";

/** 敌人攻击力减少 */
registerRelicBlackboard("enemy_atk_down", (buff: RelicBuff, relic: RelicWrapper) => {
  const atk = getByKeySafe(buff.blackboard, "atk");
  const enemy_level_type = getByKey(buff.blackboard, "selector.enemy_level_type")?.valueStr as
    | "BOSS"
    | "ELITE"
    | "NORMAL";
  return {
    isActive(input) {
      return enemy_level_type ? input.enemyInput.levelType === enemy_level_type : true;
    },
    apply(input): void {
      const { context } = input;
      const value = Math.sign(atk.value) === 1 ? atk.value : 1 - atk.value;
      context.mut_in_game_buff_final_mul_enemy_atk_down(value, buff, relic);
    },
  };
});

/** 敌人攻击力增加 */
registerRelicBlackboard("enemy_atk_up", (buff: RelicBuff, relic: RelicWrapper) => {
  const atk = getByKeySafe(buff.blackboard, "atk");
  const enemy_level_type = getByKey(buff.blackboard, "selector.enemy_level_type")?.valueStr as
    | "BOSS"
    | "ELITE"
    | "NORMAL";
  return {
    isActive(input) {
      return enemy_level_type ? input.enemyInput.levelType === enemy_level_type : true;
    },
    apply(input): void {
      const { context } = input;
      const value = Math.sign(atk.value) === 1 ? atk.value : 1 - atk.value;
      context.mut_in_game_buff_final_mul_enemy_atk_up(value, buff, relic);
    },
  };
});

/** 敌人防御力减少 */
registerRelicBlackboard("enemy_def_down", (buff: RelicBuff, relic: RelicWrapper) => {
  const def = getByKeySafe(buff.blackboard, "def");
  const enemy_level_type = getByKey(buff.blackboard, "selector.enemy_level_type")?.valueStr as
    | "BOSS"
    | "ELITE"
    | "NORMAL";
  return {
    isActive(input) {
      return enemy_level_type ? input.enemyInput.levelType === enemy_level_type : true;
    },
    apply(input): void {
      const { context } = input;
      const value = Math.sign(def.value) === 1 ? def.value : 1 - def.value;
      context.mul_in_game_buff_final_mul_enemy_def_down(value, buff, relic);
    },
  };
});

/** 敌人最大生命值减少 */
registerRelicBlackboard("enemy_max_hp_down", (buff: RelicBuff, relic: RelicWrapper) => {
  const max_hp = getByKeySafe(buff.blackboard, "max_hp");
  // 敌人等级类型
  const enemy_level_type = getByKey(buff.blackboard, "selector.enemy_level_type")?.valueStr as
    | "BOSS"
    | "ELITE"
    | "NORMAL";
  return {
    isActive(input) {
      return enemy_level_type ? input.enemyInput.levelType === enemy_level_type : true;
    },
    apply(input): void {
      const { context } = input;
      const value = Math.sign(max_hp.value) === 1 ? max_hp.value : 1 - max_hp.value;
      context.mul_in_game_buff_final_mul_enemy_max_hp_down(value, buff, relic);
    },
  };
});

/** 敌人物理易伤 */
registerRelicBlackboard("enemy_damage_scale[phy]", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
  return {
    isActive: () => true,
    apply(input): void {
      const { context } = input;
      context.in_game_buff_final_mul.enemy_damage_scale_phy += damage_scale.value - 1;
      context.in_game_buff_final_mul.enemy_damage_scale_phy_source.addChild(
        new NumericLiteralNode(damage_scale.value - 1, relic.name),
      );
    },
  };
});

/** 敌人法术易伤 */
registerRelicBlackboard("enemy_damage_scale[mag]", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
  return {
    isActive: () => true,
    apply(input): void {
      const { context } = input;
      context.in_game_buff_final_mul.enemy_damage_scale_mag += damage_scale.value - 1;
      context.in_game_buff_final_mul.enemy_damage_scale_mag_source.addChild(
        new NumericLiteralNode(damage_scale.value - 1, relic.name),
      );
    },
  };
});

/** 敌人真实易伤 */
registerRelicBlackboard("enemy_damage_scale[pure]", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
  return {
    isActive: () => true,
    apply(input): void {
      const { context } = input;
      context.in_game_buff_final_mul.enemy_damage_scale_pure += damage_scale.value - 1;
      context.in_game_buff_final_mul.enemy_damage_scale_pure_source.addChild(
        new NumericLiteralNode(damage_scale.value - 1, relic.name),
      );
    },
  };
});

/** 敌人元素损伤 */
registerRelicBlackboard("enemy_damage_scale[ep]", (buff: RelicBuff, relic: RelicWrapper) => {
  const ep_damage_scale = getByKeySafe(buff.blackboard, "ep_damage_scale");
  return {
    isActive: () => true,
    apply(input): void {
      const { context } = input;
      context.in_game_buff_final_mul.enemy_damage_scale_ep *= ep_damage_scale.value;
      context.in_game_buff_final_mul.enemy_damage_scale_ep_source.addChild(
        new NumericLiteralNode(ep_damage_scale.value, relic.name),
      );
    },
  };
});

/** 敌人减伤 */
registerRelicBlackboard("enemy_damage_resistance[inf]", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_resistance = getByKeySafe(buff.blackboard, "damage_resistance");
  return {
    isActive: () => true,
    apply(input): void {
      const { context } = input;
      const value = 1 - damage_resistance.value;
      if (context.in_game_buff_final_mul.enemy_damage_resistance_inf > value) {
        context.in_game_buff_final_mul.enemy_damage_resistance_inf = value;
        context.in_game_buff_final_mul.enemy_damage_resistance_inf_source.addChild(
          new NumericLiteralNode(value, relic.name),
        );
      }
    },
  };
});

/** 攻击或受击回复技能回复技力 */
registerRelicBlackboard("modify_sp[attack_or_damage]", (buff: RelicBuff, relic: RelicWrapper) => {
  const sp = getByKeySafe(buff.blackboard, "sp");
  const interval = getByKeySafe(buff.blackboard, "interval");
  return {
    isActive(input) {
      // 技能类型为攻击或受击回复技能回复技力 TODO 受击回复技力没做
      return input.charInput.skill.spData.spType === "INCREASE_WHEN_ATTACK";
    },
    apply(input): void {
      const { context } = input;
      // 保留两位小数
      context.in_game_buff_add.sp_recovery_per_sec += Math.round((sp.value / interval.value) * 100) / 100;
      context.in_game_buff_add.sp_recovery_per_sec_source.addChild(
        new NumericLiteralNode(Math.round((sp.value / interval.value) * 100) / 100, relic.name),
      );
    },
  };
});

/** 自然回复技力 */
registerRelicBlackboard("modify_sp_recover[normal]", (buff: RelicBuff, relic: RelicWrapper) => {
  const sp_recovery_per_sec = getByKeySafe(buff.blackboard, "sp_recovery_per_sec");
  return {
    isActive(input) {
      return input.charInput.skill.spData.spType === "INCREASE_WITH_TIME";
    },
    apply(input): void {
      const { context } = input;
      context.in_game_buff_add.sp_recovery_per_sec += sp_recovery_per_sec.value;
      context.in_game_buff_add.sp_recovery_per_sec_source.addChild(
        new NumericLiteralNode(sp_recovery_per_sec.value, relic.name),
      );
    },
  };
});

/** 国王的新抢 */
registerRelicBlackboard("rogue_2_attack_speed_up[life_point]", (buff: RelicBuff, relic: RelicWrapper) => {
  return {
    isActive: () => true, // 默认生效
    apply(input): void {
      const { context } = input;
      context.in_game_buff_add.attack_speed += 50;
      context.in_game_buff_add.attack_speed_source.addChild(new NumericLiteralNode(50, relic.name));
    },
  };
});

/** 诸王的冠冕 */
registerRelicBlackboard("rogue_2_atk_up[life_point][king_suit]", () => {
  return {
    isActive: () => true, // 默认生效
    apply(input): void {
      const { context, relics } = input;
      // 是否存在三件国王套
      const isUp =
        relics.filter((relic) => {
          return relic.relicData.buffs.find((buff) =>
            buff.blackboard.find(
              (blackboard) => blackboard.key === "key" && blackboard.valueStr === "rogue_2_relic_mark[king_suit]",
            ),
          );
        }).length > 2;
      if (isUp) {
        context.in_game_buff_mul.atk += 1.5;
        context.in_game_buff_mul.atk_source.addChild(new NumericLiteralNode(1.5, "诸王的冠冕三件套"));
      } else {
        context.in_game_buff_mul.atk += 0.5;
        context.in_game_buff_mul.atk_source.addChild(new NumericLiteralNode(0.5, "诸王的冠冕"));
      }
    },
  };
});

/** 国王的延伸 */
registerRelicBlackboard("rogue_2_block_cnt[life_point]", (buff: RelicBuff, relic: RelicWrapper) => {
  const sp = getByKeySafe(buff.blackboard, "sp");
  const interval = getByKeySafe(buff.blackboard, "interval");
  return {
    isActive: () => true, // 默认生效
    apply(input): void {
      const { context } = input;
      context.in_game_buff_add.sp_recovery_per_sec += Math.round((sp.value / interval.value) * 100) / 100;
      context.in_game_buff_add.sp_recovery_per_sec_source.addChild(
        new NumericLiteralNode(Math.round((sp.value / interval.value) * 100) / 100, relic.name),
      );
    },
  };
});

/** 术师增伤 */
registerRelicBlackboard("damage_scale[caster]", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
  return {
    isActive(input) {
      return input.charData.profession === "CASTER";
    },
    apply(input): void {
      const { context } = input;
      context.stack_global_buff_stack_damage_scale_mag(damage_scale.value, buff, relic);
    },
  };
});

/** 断杖-波纹 */
registerRelicBlackboard("rogue_3_relic_book_7", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_scale = getByKeySafe(buff.blackboard, "damage_scale_factor");
  return {
    isActive: () => true,
    apply(input): void {
      const { context } = input;
      context.stack_global_buff_stack_damage_scale_mag(1 + damage_scale.value * relic.layer, buff, relic);
    },
  };
});

/** 未叙魔王残片 */
registerRelicBlackboard("modify_fragment_carry_char_attribute[atk]", (buff: RelicBuff, relic: RelicWrapper) => {
  const atk = getByKeySafe(buff.blackboard, "atk");
  const selector_profession = getByKey(buff.blackboard, "selector.profession")?.valueStr;
  return {
    isActive(input) {
      if (selector_profession) {
        return selector_profession.includes(input.charData.profession.toLowerCase());
      }
      return true;
    },
    apply(input): void {
      const { context } = input;
      context.in_game_buff_mul.atk += atk.value * relic.layer;
      context.in_game_buff_mul.atk_source.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
    },
  };
});

/** 生命越高，攻击越高 （古乔治营养原浆） */
registerRelicBlackboard("rogue_2_hp_ratio_to_attr_add[atk]", (buff: RelicBuff, relic: RelicWrapper) => {
  // 默认使用按最大生命值计算
  const atk = getByKeySafe(buff.blackboard, "max_atk");
  const selector_profession = getByKey(buff.blackboard, "selector.profession")?.valueStr;
  return {
    isActive(input) {
      if (selector_profession) {
        return selector_profession.includes(input.charData.profession.toLowerCase());
      }
      return true;
    },
    apply(input): void {
      const { context } = input;
      context.in_game_buff_mul.atk += atk.value;
      context.in_game_buff_mul.atk_source.addChild(new NumericLiteralNode(atk.value, relic.name));
    },
  };
});

/** 岩角号 */
registerRelicBlackboard("rogue_3_rangedATKUp", (buff: RelicBuff, relic: RelicWrapper) => {
  const atk = getByKeySafe(buff.blackboard, "atk");
  const selector_profession = getByKey(buff.blackboard, "selector.profession")?.valueStr;
  return {
    isActive(input) {
      if (selector_profession) {
        return selector_profession.includes(input.charData.profession.toLowerCase());
      }
      return true;
    },
    apply(input): void {
      const { context } = input;
      context.in_game_buff_mul.atk += atk.value * relic.layer;
      context.in_game_buff_mul.atk_source.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
    },
  };
});
