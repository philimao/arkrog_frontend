import type { RelicWrapper } from "~/types/gameData";
import type { RelicBuff } from "~/types/gameData";
import { BuffContext } from "./buff-context";
import { getByKey, getByKeySafe, registerRelicBlackboard } from "./impls";

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
    apply(context: BuffContext): void {
      const value = Math.sign(atk.value) === 1 ? atk.value - 1 : atk.value;
      context.add_in_game_buff_final_mul_enemy_atk_down(value, buff, relic);
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
    apply(context: BuffContext): void {
      const value = Math.sign(def.value) === 1 ? def.value - 1 : def.value;
      context.add_in_game_buff_final_mul_enemy_def_down(value, buff, relic);
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
    apply(context: BuffContext): void {
      const value = Math.sign(max_hp.value) === 1 ? max_hp.value - 1 : max_hp.value;
      context.add_in_game_buff_final_mul_enemy_max_hp_down(value, buff, relic);
    },
  };
});

/** 敌人物理易伤 */
registerRelicBlackboard("enemy_damage_scale[phy]", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
  return {
    isActive: () => true,
    apply(context: BuffContext): void {
      context.in_game_buff_final_mul.enemy_damage_scale_phy += damage_scale.value - 1;
      context.in_game_buff_final_mul.enemy_damage_scale_phy_source.push({
        name: relic.name,
        value: damage_scale.value,
        usage: relic.usage,
        buff,
        relic,
      });
    },
  };
});

/** 敌人法术易伤 */
registerRelicBlackboard("enemy_damage_scale[mag]", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
  return {
    isActive: () => true,
    apply(context: BuffContext): void {
      context.in_game_buff_final_mul.enemy_damage_scale_mag += damage_scale.value - 1;
      context.in_game_buff_final_mul.enemy_damage_scale_mag_source.push({
        name: relic.name,
        value: damage_scale.value,
        usage: relic.usage,
        buff,
        relic,
      });
    },
  };
});

/** 敌人真实易伤 */
registerRelicBlackboard("enemy_damage_scale[pure]", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
  return {
    isActive: () => true,
    apply(context: BuffContext): void {
      context.in_game_buff_final_mul.enemy_damage_scale_pure += damage_scale.value - 1;
      context.in_game_buff_final_mul.enemy_damage_scale_pure_source.push({
        name: relic.name,
        value: damage_scale.value,
        usage: relic.usage,
        buff,
        relic,
      });
    },
  };
});

/** 敌人减伤 */
registerRelicBlackboard("enemy_damage_resistance[inf]", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_resistance = getByKeySafe(buff.blackboard, "damage_resistance");
  return {
    isActive: () => true,
    apply(context: BuffContext): void {
      const value = 1 - damage_resistance.value;
      if (context.in_game_buff_final_mul.enemy_damage_resistance_inf > value) {
        context.in_game_buff_final_mul.enemy_damage_resistance_inf = value;
        context.in_game_buff_final_mul.enemy_damage_resistance_inf_source = [
          {
            name: relic.name,
            value: damage_resistance.value,
            usage: relic.usage,
            buff,
            relic,
          },
        ];
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
    apply(context: BuffContext): void {
      // 保留两位小数
      context.in_game_buff_add.sp_recovery_per_sec += Math.round((sp.value / interval.value) * 100) / 100;
      context.in_game_buff_add.sp_recovery_per_sec_source.push({
        name: relic.name,
        value: Math.round((sp.value / interval.value) * 100) / 100,
        usage: relic.usage,
        buff,
        relic,
      });
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
    apply(context: BuffContext): void {
      context.in_game_buff_add.sp_recovery_per_sec += sp_recovery_per_sec.value;
      context.in_game_buff_add.sp_recovery_per_sec_source.push({
        name: relic.name,
        value: sp_recovery_per_sec.value,
        usage: relic.usage,
        buff,
        relic,
      });
    },
  };
});

/** 国王的新抢 */
registerRelicBlackboard("rogue_2_attack_speed_up[life_point]", (buff: RelicBuff, relic: RelicWrapper) => {
  return {
    isActive: () => true, // 默认生效
    apply(context: BuffContext): void {
      context.in_game_buff_add.attack_speed += 50;
      context.in_game_buff_add.attack_speed_source.push({
        name: relic.name,
        value: 50,
        usage: relic.usage,
        buff,
        relic,
      });
    },
  };
});

/** 诸王的冠冕 */
registerRelicBlackboard("rogue_2_atk_up[life_point][king_suit]", (buff: RelicBuff, relic: RelicWrapper) => {
  return {
    isActive: () => true, // 默认生效
    apply(context: BuffContext): void {
      context.in_game_buff_mul.atk += 1.5;
      context.in_game_buff_mul.atk_source.push({
        name: relic.name,
        value: 1.5,
        usage: relic.usage,
        buff,
        relic,
      });
    },
  };
});

/** 国王的延伸 */
registerRelicBlackboard("rogue_2_block_cnt[life_point]", (buff: RelicBuff, relic: RelicWrapper) => {
  const sp = getByKeySafe(buff.blackboard, "sp");
  const interval = getByKeySafe(buff.blackboard, "interval");
  return {
    isActive: () => true, // 默认生效
    apply(context: BuffContext): void {
      context.in_game_buff_add.sp_recovery_per_sec += Math.round((sp.value / interval.value) * 100) / 100;
      context.in_game_buff_add.sp_recovery_per_sec_source.push({
        name: relic.name,
        value: Math.round((sp.value / interval.value) * 100) / 100,
        usage: relic.usage,
        buff,
        relic,
      });
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
    apply(context: BuffContext): void {
      context.stack_global_buff_stack_damage_scale_mag(damage_scale.value - 1, buff, relic);
    },
  };
});

/** 断杖-波纹 */
registerRelicBlackboard("rogue_3_relic_book_7", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_scale = getByKeySafe(buff.blackboard, "damage_scale_factor");
  return {
    isActive: () => true,
    apply(context: BuffContext): void {
      context.stack_global_buff_stack_damage_scale_mag(damage_scale.value * relic.layer, buff, relic);
    },
  };
});
