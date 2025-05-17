import type { RelicWrapper } from "~/types/gameData";
import type { RelicBuff } from "~/types/gameData";
import type { RelicAnalysisResult } from "./helper";
import { getByKeySafe, registerRelicBlackboard } from "./impls";

/** 敌人攻击力减少 */
registerRelicBlackboard("enemy_atk_down", (buff: RelicBuff, relic: RelicWrapper) => {
  const atk = getByKeySafe(buff.blackboard, "atk");
  // 敌人等级类型
  // const enemy_level_type = getByKey(buff.blackboard, "selector.enemy_level_type");
  return {
    isActive: () => true,
    apply(context: RelicAnalysisResult): void {
      context.in_game_buff_final_mul.enemy_atk_down -= atk.value;
      context.in_game_buff_final_mul.enemy_atk_down_source.push({
        name: relic.name,
        value: atk.value,
        usage: relic.usage,
        buff,
        relic,
      });
    },
  };
});

/** 敌人物理易伤 */
registerRelicBlackboard("enemy_damage_scale[phy]", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
  return {
    isActive: () => true,
    apply(context: RelicAnalysisResult): void {
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
    apply(context: RelicAnalysisResult): void {
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
    apply(context: RelicAnalysisResult): void {
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

/** 攻击或受击回复技能回复技力 */
registerRelicBlackboard("modify_sp[attack_or_damage]", (buff: RelicBuff, relic: RelicWrapper) => {
  const sp = getByKeySafe(buff.blackboard, "sp");
  const interval = getByKeySafe(buff.blackboard, "interval");
  return {
    isActive(input) {
      // 技能类型为攻击或受击回复技能回复技力 TODO 受击回复技力没做
      return input.charInput.skill.spData.spType === "INCREASE_WHEN_ATTACK";
    },
    apply(context: RelicAnalysisResult): void {
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
    apply(context: RelicAnalysisResult): void {
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
    apply(context: RelicAnalysisResult): void {
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
    apply(context: RelicAnalysisResult): void {
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

/** 术师增伤 */
registerRelicBlackboard("damage_scale[caster]", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
  return {
    isActive(input) {
      return input.charData.profession === "CASTER";
    },
    apply(context: RelicAnalysisResult): void {
      context.global_buff_stack.damage_scale_mag += damage_scale.value - 1;
      context.global_buff_stack.damage_scale_mag_source.push({
        name: relic.name,
        value: damage_scale.value - 1,
        usage: relic.usage,
        buff,
        relic,
      });
    },
  };
});

/** 断杖-波纹 */
registerRelicBlackboard("rogue_3_relic_book_7", (buff: RelicBuff, relic: RelicWrapper) => {
  const damage_scale = getByKeySafe(buff.blackboard, "damage_scale_factor");
  return {
    isActive: () => true,
    apply(context: RelicAnalysisResult): void {
      context.global_buff_stack.damage_scale_mag += damage_scale.value * relic.layer;
      context.global_buff_stack.damage_scale_mag_source.push({
        name: relic.name,
        value: damage_scale.value * relic.layer,
        usage: relic.usage,
        buff,
        relic,
      });
    },
  };
});
