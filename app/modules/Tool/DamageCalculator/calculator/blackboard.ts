import {
  getByKey,
  getByKeySafe,
  getByKeyAndValueStr,
  registerRelicBlackboard,
  type RelicBlackboardApplyInput,
  type EnemyRelicBlackboardInput,
  type RelicBlackboard,
} from "./impls";
import { NumericLiteralNode } from "./ast";
import {
  inGameRelicNames,
  isBlackboardActiveForChar,
  isBuffInBlacklist,
  isRelicInBlacklist,
  parseDefinedData,
} from "../utils";
import { debugRelic } from "./helper";

/** 敌人物理易伤 */
registerRelicBlackboard("enemy_damage_scale[phy]", {
  isActive: () => true,
  apply(input): void {
    const { context, buff, relic } = input;
    const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
    context.in_game_buff_final_mul.enemy_damage_scale_phy.addChild(
      new NumericLiteralNode(damage_scale.value - 1, relic.name),
    );
  },
});

/** 敌人法术易伤 */
registerRelicBlackboard("enemy_damage_scale[mag]", {
  isActive: () => true,
  apply(input): void {
    const { context, buff, relic } = input;
    const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
    context.in_game_buff_final_mul.enemy_damage_scale_mag.addChild(
      new NumericLiteralNode(damage_scale.value - 1, relic.name),
    );
  },
});

/** 敌人真实易伤 */
registerRelicBlackboard("enemy_damage_scale[pure]", {
  isActive: () => true,
  apply(input): void {
    const { context, buff, relic } = input;
    const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
    context.in_game_buff_final_mul.enemy_damage_scale_pure.addChild(
      new NumericLiteralNode(damage_scale.value - 1, relic.name),
    );
  },
});

/** 敌人元素损伤 */
registerRelicBlackboard("enemy_damage_scale[ep]", {
  isActive: () => true,
  apply(input): void {
    const { context, buff, relic } = input;
    const ep_damage_scale = getByKeySafe(buff.blackboard, "ep_damage_scale");
    context.in_game_buff_final_mul.enemy_damage_scale_ep.addChild(
      new NumericLiteralNode(ep_damage_scale.value, relic.name),
    );
  },
});

/** 敌人减伤 */
registerRelicBlackboard("enemy_damage_resistance[inf]", {
  isActive: () => true,
  apply(input): void {
    const { context, buff, relic } = input;
    const damage_resistance = getByKeySafe(buff.blackboard, "damage_resistance");
    // 藏品提供的减伤放在局外取最大值（蛋）
    context.relic_rune_mul.enemy_damage_resistance.addChild(
      new NumericLiteralNode(damage_resistance.value, relic.name),
    );
  },
});

/** 攻击或受击回复技能回复技力 */
registerRelicBlackboard("modify_sp[attack_or_damage]", {
  isActive(input) {
    // 技能类型为攻击或受击回复技能回复技力 TODO 受击回复技力没做
    return input.charInput?.skill.spData.spType === "INCREASE_WHEN_ATTACK";
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const sp = getByKeySafe(buff.blackboard, "sp");
    const interval = getByKeySafe(buff.blackboard, "interval");
    // 保留两位小数
    context.in_game_buff_add.sp_recovery_per_sec.addChild(
      new NumericLiteralNode(Math.round((sp.value / interval.value) * 100) / 100, relic.name),
    );
  },
});

/** 自然回复技力 */
registerRelicBlackboard("modify_sp_recover[normal]", {
  isActive(input) {
    return input.charInput?.skill.spData.spType === "INCREASE_WITH_TIME";
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const sp_recovery_per_sec = getByKeySafe(buff.blackboard, "sp_recovery_per_sec");
    context.in_game_buff_add.sp_recovery_per_sec.addChild(
      new NumericLiteralNode(sp_recovery_per_sec.value, relic.name),
    );
  },
});

/**
 * 职业限定的自然回复技力（与 modify_sp_recover[normal] 同口径，仅多一道职业筛选）
 * 现有数据案例：断杖-凝神(术师, modify_sp_recover[caster])、医者-自医(医疗, modify_sp_recover[medic])
 */
const makeSpRecoverByProfession = (profession: string): RelicBlackboard => ({
  isActive(input) {
    // 仅对自然回复(随时间)技能生效，与 modify_sp_recover[normal] 一致
    if (input.charInput?.skill.spData.spType !== "INCREASE_WITH_TIME") return false;
    // 无干员数据时不强制筛选（与其它职业类黑板默认放行一致）
    if (input.charData && input.charData.profession.toLowerCase() !== profession) return false;
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const sp_recovery_per_sec = getByKeySafe(buff.blackboard, "sp_recovery_per_sec");
    context.in_game_buff_add.sp_recovery_per_sec.addChild(
      new NumericLiteralNode(sp_recovery_per_sec.value, relic.name),
    );
  },
});
/** 断杖-凝神（术师技力恢复+0.4/秒） */
registerRelicBlackboard("modify_sp_recover[caster]", makeSpRecoverByProfession("caster"));
/** 医者-自医（医疗技力恢复+0.3/秒） */
registerRelicBlackboard("modify_sp_recover[medic]", makeSpRecoverByProfession("medic"));

/** 国王的新抢 */
registerRelicBlackboard("rogue_2_attack_speed_up[life_point]", {
  isActive: () => true, // 默认生效
  apply(input): void {
    const { context, relic } = input;
    context.in_game_buff_add.attack_speed.addChild(new NumericLiteralNode(50, relic.name));
  },
});

/** 诸王的冠冕 */
registerRelicBlackboard("rogue_2_atk_up[life_point][king_suit]", {
  isActive: () => true, // 默认生效
  apply(input): void {
    const { context, relics, relic } = input;
    // 是否存在三件国王套
    const isUp =
      relics.filter((relic) => {
        return relic.buffs.find((buff) =>
          buff.blackboard.find(
            (blackboard) => blackboard.key === "key" && blackboard.valueStr === "rogue_2_relic_mark[king_suit]",
          ),
        );
      }).length > 2;
    if (isUp) {
      context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(1.5, relic.name));
    } else {
      context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(0.5, relic.name));
    }
  },
});

/** 国王的延伸 */
registerRelicBlackboard("rogue_2_block_cnt[life_point]", {
  isActive: () => true, // 默认生效
  apply(input): void {
    const { context, buff, relic } = input;
    const sp = getByKeySafe(buff.blackboard, "sp");
    const interval = getByKeySafe(buff.blackboard, "interval");
    context.in_game_buff_add.sp_recovery_per_sec.addChild(
      new NumericLiteralNode(Math.round((sp.value / interval.value) * 100) / 100, relic.name),
    );
  },
});

/** 术师增伤，苦难巫咒 */
registerRelicBlackboard("damage_scale[caster]", {
  isActive(input) {
    return !input.charData || isBlackboardActiveForChar(input.buff, input.charData);
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
    context.global_buff_stack.damage_scale_mag.addChild(new NumericLiteralNode(damage_scale.value, relic.name));
  },
});

/** 断杖-波纹 */
registerRelicBlackboard("rogue_3_relic_book_7", {
  isActive: () => true,
  apply(input): void {
    const { context, buff, relic } = input;
    const damage_scale = getByKeySafe(buff.blackboard, "damage_scale_factor");
    context.global_buff_stack.damage_scale_mag.addChild(
      new NumericLiteralNode(1 + damage_scale.value * relic.layer, "断杖-波纹"),
    );
  },
});

/** 未叙魔王残片 */
registerRelicBlackboard("modify_fragment_carry_char_attribute[atk]", {
  isActive(input) {
    const { buff } = input;
    const selector_profession = getByKey(buff.blackboard, "selector.profession")?.valueStr;
    // 在没有干员数据时，默认生效 TODO
    if (selector_profession && input.charData) {
      return selector_profession.includes(input.charData.profession.toLowerCase());
    }
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const atk = getByKeySafe(buff.blackboard, "atk");
    context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
  },
});

/** 生命越高，攻击越高 （古乔治营养原浆） */
registerRelicBlackboard("rogue_2_hp_ratio_to_attr_add[atk]", {
  isActive(input) {
    const { buff } = input;
    const selector_profession = getByKey(buff.blackboard, "selector.profession")?.valueStr;
    if (selector_profession && input.charData) {
      return selector_profession.includes(input.charData.profession.toLowerCase());
    }
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const atk = getByKeySafe(buff.blackboard, "max_atk");
    context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value, relic.name));
  },
});

/** 岩角号 */
registerRelicBlackboard("rogue_3_rangedATKUp", {
  isActive(input) {
    const { buff } = input;
    const selector_profession = getByKey(buff.blackboard, "selector.profession")?.valueStr;
    if (selector_profession && input.charData) {
      return selector_profession.includes(input.charData.profession.toLowerCase());
    }
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const atk = getByKeySafe(buff.blackboard, "atk");
    context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
  },
});

/** 锈刃-遗世独立 */
registerRelicBlackboard("AtkUp[NoAllyInRange]", {
  isActive(input) {
    const { buff } = input;
    const selector_profession = getByKey(buff.blackboard, "selector.profession")?.valueStr;
    if (selector_profession && input.charData) {
      return selector_profession.includes(input.charData.profession.toLowerCase());
    }
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const atk = getByKeySafe(buff.blackboard, "atk");
    context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
  },
});

/** 文学的开端 */
registerRelicBlackboard("rogue_4_damage_scale[tag]", {
  isActive(input) {
    const { buff } = input;
    const tag = getByKey(buff.blackboard, "tag")?.valueStr;
    if (tag && input.enemyData) {
      return !!input.enemyData.enemyTags.m_value?.includes(tag);
    }
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
    context.global_buff_stack.damage_scale_phy.addChild(new NumericLiteralNode(damage_scale.value, relic.name));
    context.global_buff_stack.damage_scale_mag.addChild(new NumericLiteralNode(damage_scale.value, relic.name));
  },
});

/** 见厉 */
registerRelicBlackboard("damage_scale[filter_tag]", {
  isActive(input) {
    const { buff } = input;
    const tag = getByKey(buff.blackboard, "tag")?.valueStr;
    if (tag && input.enemyData) {
      return !!input.enemyData.enemyTags.m_value?.includes(tag);
    }
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const damage_scale = getByKeySafe(buff.blackboard, "damage_scale");
    context.global_buff_stack.damage_scale_phy.addChild(new NumericLiteralNode(damage_scale.value, relic.name));
    context.global_buff_stack.damage_scale_mag.addChild(new NumericLiteralNode(damage_scale.value, relic.name));
  },
});

/** 久居之手 */
registerRelicBlackboard("rogue_4_special_hand[time]", {
  isActive(input) {
    const { buff } = input;
    const sub_profession = (getByKey(buff.blackboard, "selector.sub_profession")?.valueStr || "")
      .split("|")
      .filter((s) => s.trim());
    if (sub_profession.length > 0 && input.charData) {
      return sub_profession.includes(input.charData.subProfessionId);
    }
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const atk = getByKeySafe(buff.blackboard, "atk");
    context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
  },
});

/** 轰鸣之手 */
registerRelicBlackboard("rogue_2_atk_up_on_output_damage[stack]", {
  isActive(input) {
    const { buff } = input;
    const sub_profession = (getByKey(buff.blackboard, "selector.sub_profession")?.valueStr || "")
      .split("|")
      .filter((s) => s.trim());
    if (sub_profession.length > 0 && input.charData) {
      return sub_profession.includes(input.charData.subProfessionId);
    }
    return true;
  },
  apply(input): void {
    const { context } = input;
    context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(1.5, "轰鸣之手"));
  },
});

/** 波纹之手 */
registerRelicBlackboard("rogue_4_caster_hand[pair]", {
  isActive(input) {
    const { buff } = input;
    const reliance_relics = getByKeySafe(buff.blackboard, "reliance_relics");
    const sub_profession = (getByKey(buff.blackboard, "selector.sub_profession")?.valueStr || "")
      .split("|")
      .filter((s) => s.trim());
    const isExist = input.relics.some((r) => r.id === reliance_relics.valueStr);
    // 不存在某藏品时不生效
    if (!isExist) {
      return false;
    }
    if (sub_profession.length > 0 && input.charData) {
      return sub_profession.includes(input.charData.subProfessionId);
    }
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const attack_speed = getByKeySafe(buff.blackboard, "attack_speed");
    context.in_game_buff_add.attack_speed.addChild(new NumericLiteralNode(attack_speed.value, relic.name));
  },
});

/** 支柱-援护 */
registerRelicBlackboard("rogue_2_atk_up_in_range", {
  isActive() {
    return true; // 对所有干员生效，忽略职业选择器
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const atk = getByKeySafe(buff.blackboard, "atk");
    context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
  },
});

/** 湖中神盾 */
registerRelicBlackboard("rogue_3_increaseMaxHPWhenHavingShield", {
  isActive() {
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const max_hp = getByKeySafe(buff.blackboard, "max_hp");
    context.in_game_buff_mul.max_hp.addChild(new NumericLiteralNode(max_hp.value, relic.name));
  },
});

/** 城墙之子 */
registerRelicBlackboard("rogue_4_finalDefense[end_tile]", {
  isActive(input) {
    const { buff } = input;
    return isBlackboardActiveForChar(buff, input.charData);
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const max_hp = getByKeySafe(buff.blackboard, "max_hp");
    context.in_game_buff_mul.max_hp.addChild(new NumericLiteralNode(max_hp.value, relic.name));
  },
});

/** 折戟-裂岩 */
registerRelicBlackboard("rogue_3_relic_book_4", {
  isActive() {
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const atk = getByKeySafe(buff.blackboard, "atk");
    context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
  },
});

/** 荣耀绶带 */
registerRelicBlackboard("AtkUp[BlockJustOne]", {
  isActive() {
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const atk = getByKeySafe(buff.blackboard, "atk");
    context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value, relic.name));
  },
});

/** 丝契之谜 */
registerRelicBlackboard("AttackSpeedUp[NoCharInRange]", {
  isActive() {
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const attack_speed = getByKeySafe(buff.blackboard, "attack_speed");
    context.in_game_buff_add.attack_speed.addChild(new NumericLiteralNode(attack_speed.value, relic.name));
  },
});

/** 丝契之谜 */
registerRelicBlackboard("rogue_4_attack_speed_up[life_point]", {
  isActive(input) {
    const { buff } = input;
    return isBlackboardActiveForChar(buff, input.charData);
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const attack_speed = getByKeySafe(buff.blackboard, "attack_speed");
    context.in_game_buff_add.attack_speed.addChild(new NumericLiteralNode(attack_speed.value, relic.name));
  },
});

/** 支柱-枯法 */
registerRelicBlackboard("defdown[support]", {
  isActive() {
    // 默认在范围内可以生效
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const def = getByKeySafe(buff.blackboard, "def");
    const magic_resistance = getByKeySafe(buff.blackboard, "magic_resistance");
    const defValue = Math.sign(def.value) === 1 ? def.value : 1 + def.value;
    context.in_game_buff_final_mul.enemy_def.addChild(new NumericLiteralNode(defValue, relic.name));
    const magicResistanceValue =
      Math.sign(magic_resistance.value) === 1 ? magic_resistance.value : 1 + magic_resistance.value;
    context.in_game_buff_final_mul.enemy_magic_resistance.addChild(
      new NumericLiteralNode(magicResistanceValue, relic.name),
    );
  },
});

registerRelicBlackboard("attr_up_on_trigger[def&mag_resist]", {
  isActive(input) {
    return !input.charData || isBlackboardActiveForChar(input.buff, input.charData);
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const def = getByKeySafe(buff.blackboard, "def");
    const magic_resistance = getByKeySafe(buff.blackboard, "magic_resistance");
    context.in_game_buff_add.def.addChild(new NumericLiteralNode(def.value, relic.name));
    context.in_game_buff_add.magic_resistance.addChild(new NumericLiteralNode(magic_resistance.value, relic.name));
  },
});

registerRelicBlackboard("rune_mul_enemy_max_hp", {
  isActive(input) {
    const { enemyData, buff } = input;
    // 判断是否有敌人选择器
    const selector_enemy = getByKey(buff.blackboard, "selector.enemy")?.valueStr;
    if (selector_enemy && enemyData && !selector_enemy.includes(enemyData.id)) {
      return false;
    }
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const max_hp = getByKeySafe(buff.blackboard, "max_hp");
    context.relic_rune_mul.enemy_max_hp.addChild(new NumericLiteralNode(max_hp.value, relic.name));
  },
});

/** 编队中每有一名【伺烛客】属性增加 (岁花,飞驮客运) */
registerRelicBlackboard("rogue_5_character_in_candle_holder_common_buff[stack]", {
  isActive(input) {
    // 只对伺烛客干员生效
    return input.charInput?.candleHolder === true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const attack_speed = getByKey(buff.blackboard, "attack_speed");
    const atk = getByKey(buff.blackboard, "atk");
    const def = getByKey(buff.blackboard, "def");
    const max_hp = getByKey(buff.blackboard, "max_hp");

    if (attack_speed) {
      context.relic_rune_add.attack_speed.addChild(
        new NumericLiteralNode(attack_speed.value * relic.layer, relic.name),
      );
    }
    if (atk) {
      context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
    }
    if (def) {
      context.in_game_buff_mul.def.addChild(new NumericLiteralNode(def.value * relic.layer, relic.name));
    }
    if (max_hp) {
      context.in_game_buff_mul.max_hp.addChild(new NumericLiteralNode(max_hp.value * relic.layer, relic.name));
    }
  },
});

/** 【伺烛客】属性增加 (岁衡,难闻的止血剂,未知仪器) */
registerRelicBlackboard("rogue_5_character_in_candle_holder_common_buff", {
  isActive(input) {
    // 只对伺烛客干员生效
    return input.charInput?.candleHolder === true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const attack_speed = getByKey(buff.blackboard, "attack_speed");
    const atk = getByKey(buff.blackboard, "atk");
    const def = getByKey(buff.blackboard, "def");
    const max_hp = getByKey(buff.blackboard, "max_hp");
    if (attack_speed) {
      context.in_game_buff_add.attack_speed.addChild(
        new NumericLiteralNode(attack_speed.value * relic.layer, relic.name),
      );
    }
    if (atk) {
      context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
    }
    if (def) {
      context.in_game_buff_mul.def.addChild(new NumericLiteralNode(def.value * relic.layer, relic.name));
    }
    if (max_hp) {
      context.in_game_buff_mul.max_hp.addChild(new NumericLiteralNode(max_hp.value * relic.layer, relic.name));
    }
  },
});

/** 契心聆铃 - 再部署时间减少 */
registerRelicBlackboard("rogue_5_character_in_candle_holder_buff[respawn_time]", {
  isActive(input) {
    // 只对伺烛客干员生效
    return input.charInput?.candleHolder === true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const respawn_time_addition = getByKey(buff.blackboard, "respawn_time_addition");
    if (respawn_time_addition) {
      context.relic_rune_mul.respawn_time.addChild(
        new NumericLiteralNode(respawn_time_addition.value * relic.layer, relic.name),
      );
    }
  },
});

/** 画人间 - 岁兽残识 */
registerRelicBlackboard("rogue_5_character_sp_zone_attri_up", {
  isActive(input) {
    return !!input.stageData?.id.includes("ro5_sv");
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const attack_speed = getByKeySafe(buff.blackboard, "attack_speed");
    context.relic_rune_add.attack_speed.addChild(new NumericLiteralNode(attack_speed.value, relic.name));
  },
});

/** 厉-无皎之昧 - 投出时，战斗中刮起随机方向的沙尘暴，位于沙尘暴中的我方单位攻击力降低60％。所有我方单位攻击速度 */
registerRelicBlackboard("env_001_storm", {
  isActive() {
    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const atk = getByKeySafe(buff.blackboard, "atk");
    context.in_game_buff_final_mul.atk.addChild(new NumericLiteralNode(atk.value, relic.name));
  },
});

// 无需判断左右，走通用黑板
// /** 花-驰道长 - 投出时，使战斗中位于最左边和最右边一列化境地块上的干员攻击力+30%，攻击速度+30*/
// registerRelicBlackboard("rogue_5_left_or_right_most_tile_col[attri_up]", {
//   isActive(input) {
//     const { buff } = input;
//     const sequence_select = getByKey(buff.blackboard, "sequence_select");
//     /** 右侧 0 左侧 1 */
//     return sequence_select?.value === 1.0;
//   },
//   apply(input): void {
//     const { context, buff, relic } = input;
//     const atk = getByKey(buff.blackboard, "atk");
//     if (atk) {
//       context.in_game_buff_final_mul.atk.addChild(new NumericLiteralNode(atk.value, relic.name));
//     }
//     const def = getByKey(buff.blackboard, "def");
//     if (def) {
//       context.in_game_buff_mul.def.addChild(new NumericLiteralNode(def.value, relic.name));
//     }
//     const max_hp = getByKey(buff.blackboard, "max_hp");
//     if (max_hp) {
//       context.in_game_buff_mul.max_hp.addChild(new NumericLiteralNode(max_hp.value, relic.name));
//     }
//     const attack_speed = getByKey(buff.blackboard, "attack_speed");
//     if (attack_speed) {
//       context.in_game_buff_add.attack_speed.addChild(new NumericLiteralNode(attack_speed.value, relic.name));
//     }
//   },
// });

/** 奔兽战车 - 部署费用上限+30，部署费用达到99以及以上时，所有干员局内生命+50%，阻挡数+1 */
registerRelicBlackboard("attri_up_filter_level_cost", {
  isActive(input) {
    const { buff, relics } = input;
    const costThreshold = getByKey(buff.blackboard, "cost");

    // 计算费用条件
    if (costThreshold) {
      let maxCostBonus = 99;
      for (const relic of relics) {
        for (const relicBuff of relic.buffs) {
          if (relicBuff.key === "level_max_cost_add") {
            const maxCost = getByKey(relicBuff.blackboard, "max_cost");
            if (maxCost) {
              maxCostBonus += maxCost.value;
            }
          }
        }
      }

      return maxCostBonus >= costThreshold.value;
    }

    return true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const max_hp = getByKey(buff.blackboard, "max_hp");
    const block_cnt = getByKey(buff.blackboard, "block_cnt");

    // 生命值 - 局内乘算
    if (max_hp) {
      context.in_game_buff_mul.max_hp.addChild(new NumericLiteralNode(max_hp.value, relic.name));
    }
    // 阻挡数 - 局内加算
    if (block_cnt) {
      context.in_game_buff_add.block_cnt.addChild(new NumericLiteralNode(block_cnt.value, relic.name));
    }
  },
});

/** 通用敌人藏品黑板 */
export const commonEnemyRelicBlackboard = {
  isActive({ buff, enemyData, relic, stageData }: EnemyRelicBlackboardInput) {
    if (debugRelic) console.groupCollapsed("buff", buff.key, buff.blackboard);
    /** 同时对敌我生效的藏品不应该在此处理，敌人不存在时默认不生效 */
    if (debugRelic) console.log("敌人数据", enemyData);
    if (!enemyData) return false;
    /** 黑名单藏品不生效 */
    if (debugRelic) console.log("是否位于黑名单中", isRelicInBlacklist(relic.name), isBuffInBlacklist(buff));
    if (isRelicInBlacklist(relic.name) || isBuffInBlacklist(buff)) return false;
    /** buff.key为enemy开头，且敌人为trap类时，不生效 */
    if (buff.key.startsWith("enemy") && enemyData.id.startsWith("trap_")) return false;
    /** 敌人ID选择器 */
    const selector_enemy = getByKey(buff.blackboard, "selector.enemy")?.valueStr;
    if (debugRelic)
      console.log("敌人ID选择器", selector_enemy, selector_enemy && !selector_enemy.includes(enemyData.id));
    if (selector_enemy && !selector_enemy.includes(enemyData.id)) return false;
    /** trap类敌人ID选择器 */
    const selector_char =
      getByKey(buff.blackboard, "selector.char")?.valueStr || getByKey(buff.blackboard, "char")?.valueStr;
    if (debugRelic) console.log("陷阱ID选择器", selector_char, selector_char && !selector_char.includes(enemyData.id));
    if (selector_char && !selector_char.includes(enemyData.id)) return false;
    /** 敌人等级选择器 */
    const selector_enemy_level_type = getByKey(buff.blackboard, "selector.enemy_level_type")?.valueStr;
    if (debugRelic)
      console.log(
        "敌人等级选择器",
        selector_enemy_level_type,
        parseDefinedData(enemyData?.levelType),
        selector_enemy_level_type && parseDefinedData(enemyData?.levelType) !== selector_enemy_level_type,
      );
    if (selector_enemy_level_type && parseDefinedData(enemyData?.levelType) !== selector_enemy_level_type) {
      return false;
    }
    /** 敌人TAG选择器 */
    const tag = getByKey(buff.blackboard, "tag")?.valueStr;
    if (debugRelic)
      console.log(
        "敌人TAG选择器",
        tag,
        parseDefinedData(enemyData.enemyTags),
        tag && !parseDefinedData(enemyData.enemyTags)?.includes(tag),
      );
    if (tag && !parseDefinedData(enemyData.enemyTags)?.includes(tag)) {
      return false;
    }
    /** 关卡类型选择器 */
    const validator_roguelike_event_type = getByKey(buff.blackboard, "validator.roguelike_event_type")?.valueStr as
      | "BATTLE_BOSS"
      | "DUEL";
    if (debugRelic) console.log("关卡类型选择器", validator_roguelike_event_type);
    if (
      (validator_roguelike_event_type === "BATTLE_BOSS" && !stageData?.isBoss) ||
      (validator_roguelike_event_type === "DUEL" && !stageData?.id.includes("duel"))
    ) {
      return false;
    }
    /** 界园肉鸽中，检测是否为岁兽残识作战 */
    const validator_roguelike_sky_zone_event_type = getByKey(buff.blackboard, "validator.roguelike_sky_zone_event_type")
      ?.valueStr as "BATTLE" | "BATTLE_HARD";
    if (debugRelic)
      console.log("岁兽残识选择器", validator_roguelike_sky_zone_event_type, stageData?.id.includes("ro5_sv"));
    if (
      validator_roguelike_sky_zone_event_type &&
      (validator_roguelike_sky_zone_event_type === "BATTLE_HARD" || !stageData || !stageData.id.includes("ro5_sv"))
    ) {
      return false;
    }
    if (debugRelic) console.log("*** buff生效 ***");
    if (debugRelic) console.groupEnd();
    return true;
  },
  apply({ relic, context, buff }: RelicBlackboardApplyInput): void {
    let is_invalid = true;
    /** 敌人攻击力改变 */
    const atk = getByKey(buff.blackboard, "atk");
    if (atk) {
      const value = Math.sign(atk.value) === 1 ? atk.value : 1 + atk.value;
      context.in_game_buff_final_mul.enemy_atk.addChild(new NumericLiteralNode(value, relic.name));
      is_invalid = false;
    }
    /** 敌人最大生命值改变 */
    const max_hp = getByKey(buff.blackboard, "max_hp");
    if (max_hp) {
      const maxHpValue = Math.sign(max_hp.value) === 1 ? max_hp.value : 1 + max_hp.value;
      context.in_game_buff_final_mul.enemy_max_hp.addChild(new NumericLiteralNode(maxHpValue, relic.name));
      is_invalid = false;
    }
    // 雕刀不确定是什么乘区
    /** 敌人防御力改变 */
    const def = getByKey(buff.blackboard, "def");
    if (def) {
      const defValue = Math.sign(def.value) === 1 ? def.value : 1 + def.value;
      context.in_game_buff_final_mul.enemy_def.addChild(new NumericLiteralNode(defValue, relic.name));
      is_invalid = false;
    }
    /** 敌人法术抗性改变 */
    const magic_resistance = getByKey(buff.blackboard, "magic_resistance");
    if (magic_resistance) {
      const value = magic_resistance.value;
      context.in_game_buff_add.enemy_magic_resistance.addChild(new NumericLiteralNode(value, relic.name));
      is_invalid = false;
    }
    /** 敌人攻击速度改变 */
    const attack_speed = getByKey(buff.blackboard, "attack_speed");
    if (attack_speed) {
      const value = attack_speed.value;
      context.in_game_buff_add.enemy_attack_speed.addChild(new NumericLiteralNode(value, relic.name));
      is_invalid = false;
    }
    if (is_invalid) {
      context.invalidRelics.push(relic);
    }
  },
};

/** 通用干员藏品黑板 */
export const commonCharRelicBlackboard: RelicBlackboard = {
  isActive({ buff, stageData, charData, charInput, relic }) {
    try {
      if (debugRelic) console.groupCollapsed("buff", buff.key, buff.blackboard);
      // 判断藏品是否可以生效
      const isActive =
        !isRelicInBlacklist(relic.name) && !isBuffInBlacklist(buff) && isBlackboardActiveForChar(buff, charData);
      if (debugRelic)
        console.log(
          "对该干员生效状态",
          !isRelicInBlacklist(relic.name),
          !isBuffInBlacklist(buff),
          isBlackboardActiveForChar(buff, charData),
        );
      if (!isActive) throw new Error();

      /** 关卡类型选择器 */
      const validator_roguelike_event_type = getByKey(buff.blackboard, "validator.roguelike_event_type")?.valueStr as
        | "BATTLE_BOSS"
        | "DUEL";
      if (debugRelic)
        console.log(
          "关卡类型",
          validator_roguelike_event_type,
          (validator_roguelike_event_type === "BATTLE_BOSS" && !stageData?.isBoss) ||
            (validator_roguelike_event_type === "DUEL" && !stageData?.id.includes("duel")),
        );
      if (
        (validator_roguelike_event_type === "BATTLE_BOSS" && !stageData?.isBoss) ||
        (validator_roguelike_event_type === "DUEL" && !stageData?.id.includes("duel"))
      ) {
        throw new Error();
      }

      /** 伺烛客选择器 */
      const candle_holder = buff.blackboard.find((item) =>
        item.valueStr?.includes("rogue_5_character_in_candle_holder"),
      );
      if (debugRelic) console.log("伺烛客选择器", candle_holder, charInput?.candleHolder);
      if (candle_holder && !charInput?.candleHolder) {
        throw new Error();
      }

      /** 化境地块选择器 */
      const dygmny_tile = relic.usage?.includes("化境地块");
      if (debugRelic) console.log("化境地块选择器", dygmny_tile, charInput?.dygmnyTile);
      if (dygmny_tile && !charInput?.dygmnyTile) {
        throw new Error();
      }
      if (debugRelic) console.log("*** buff生效 ***");
    } catch {
      console.log("*** buff不生效 ***");
      return false;
    } finally {
      if (debugRelic) console.groupEnd();
    }
    return true;
  },
  apply({ relic, context, buff }) {
    let is_invalid = true;
    const max_hp = getByKey(buff.blackboard, "max_hp");
    const atk = getByKey(buff.blackboard, "atk");
    const def = getByKey(buff.blackboard, "def");
    const attack_speed = getByKey(buff.blackboard, "attack_speed");
    const respawn_time = getByKey(buff.blackboard, "respawn_time");
    const multiplier_atk = getByKey(buff.blackboard, "multiplier@atk");
    const multiplier_max_hp = getByKey(buff.blackboard, "multiplier@max_hp");
    const multiplier_def = getByKey(buff.blackboard, "multiplier@def");
    const multiplier_cost = getByKey(buff.blackboard, "multiplier@cost");
    const cost = getByKey(buff.blackboard, "cost");
    const magic_resistance = getByKey(buff.blackboard, "magic_resistance");
    const block_cnt = getByKey(buff.blackboard, "block_cnt");
    const evade_physical =
      getByKeyAndValueStr(buff.blackboard, "prob", "evade[physical]") ||
      getByKeyAndValueStr(buff.blackboard, "prob", "evade[non_pure]");
    const evade_magical =
      getByKeyAndValueStr(buff.blackboard, "prob", "evade[magical]") ||
      getByKeyAndValueStr(buff.blackboard, "prob", "evade[non_pure]");

    // if (relic.name === "关卡加成") console.log(buff.key, buff.blackboard);

    // 是否加算
    const is_add = buff.key.includes("_attribute_add");

    // /** 如果buff不含层数效果，忽视用户填写的层数 */
    // const layer = relicHasLayer(relic) ? relic.layer : 1;

    /** 如果buff的key以layer_开头，说明受层数影响，否则固定为1层 */
    const layer = buff.key.startsWith("layer_") ? relic.layer : 1;

    // 是否局内
    const inGame = inGameRelicNames.includes(relic.name) || ["buff", "ability"].some((kw) => buff.key.includes(kw));

    /** 最大生命值 */
    if (max_hp) {
      if (inGame) {
        context.in_game_buff_mul.max_hp.addChild(new NumericLiteralNode(max_hp.value * relic.layer, relic.name));
      } else {
        context.relic_rune_mul.max_hp.addChild(
          new NumericLiteralNode(max_hp.value * layer, relic.name, { relic, buff }),
        );
      }
      is_invalid = false;
    }
    /** 攻击力 */
    if (atk) {
      if (inGame) {
        context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
      } else {
        context.relic_rune_mul.atk.addChild(new NumericLiteralNode(atk.value * layer, relic.name, { relic, buff }));
      }
      is_invalid = false;
    }
    /** 防御力 */
    // if (def) {
    //   const node = new NumericLiteralNode(def.value * layer, relic.name, { relic, buff });
    //   if (is_add) {
    //     context.relic_rune_add.def.addChild(node);
    //   } else {
    //     context.relic_rune_mul.def.addChild(node);
    //   }
    //   is_invalid = false;
    // }
    if (def) {
      if (inGame) {
        context.in_game_buff_mul.def.addChild(new NumericLiteralNode(def.value * relic.layer, relic.name));
      } else {
        const node = new NumericLiteralNode(def.value * layer, relic.name, { relic, buff });
        if (is_add) {
          context.relic_rune_add.def.addChild(node);
        } else {
          context.relic_rune_mul.def.addChild(node);
        }
      }
      is_invalid = false;
    }
    /** 攻击速度 */
    if (attack_speed) {
      context.relic_rune_add.attack_speed.addChild(
        new NumericLiteralNode(attack_speed.value * layer, relic.name, { relic, buff }),
      );
      is_invalid = false;
    }
    /** 攻击力 multiplier@atk 来源(几丁质刺刃/佣兵的饰物/生还者合约) */
    if (multiplier_atk) {
      context.relic_rune_mul.atk.addChild(
        new NumericLiteralNode(multiplier_atk.value * layer, relic.name, { relic, buff }),
      );
      is_invalid = false;
    }
    /** 最大生命值 multiplier@max_hp 来源(几丁质刺刃/佣兵的饰物/生还者合约) */
    if (multiplier_max_hp) {
      context.relic_rune_mul.max_hp.addChild(
        new NumericLiteralNode(multiplier_max_hp.value * relic.layer, relic.name, { relic, buff }),
      );
      is_invalid = false;
    }
    /** 防御力 multiplier@def 来源(几丁质刺刃/佣兵的饰物/生还者合约) */
    if (multiplier_def) {
      context.relic_rune_mul.def.addChild(
        new NumericLiteralNode(multiplier_def.value * relic.layer, relic.name, { relic, buff }),
      );
      is_invalid = false;
    }
    if (magic_resistance) {
      context.relic_rune_add.magic_resistance.addChild(
        new NumericLiteralNode(magic_resistance.value * relic.layer, relic.name, { relic, buff }),
      );
      is_invalid = false;
    }
    /** 再部署时间 */
    if (respawn_time) {
      context.relic_rune_mul.respawn_time.addChild(
        new NumericLiteralNode(respawn_time.value, relic.name, { relic, buff }),
      );
      is_invalid = false;
    }
    /** 费用，需要与关卡整体费用效果区分 */
    if (cost && buff.key === "char_attribute_add") {
      context.relic_rune_add.cost.addChild(new NumericLiteralNode(cost.value, relic.name, { relic, buff }));
      is_invalid = false;
    }
    /** 费用（局外百分比） */
    if (multiplier_cost) {
      context.relic_rune_mul.cost.addChild(new NumericLiteralNode(multiplier_cost.value, relic.name, { relic, buff }));
      is_invalid = false;
    }
    /** 阻挡数 */
    if (block_cnt) {
      context.in_game_buff_add.block_cnt.addChild(new NumericLiteralNode(block_cnt.value, relic.name, { relic, buff }));
      is_invalid = false;
    }
    /** 物理闪避率 */
    if (evade_physical) {
      context.in_game_buff_final_mul.evade_physical.addChild(
        new NumericLiteralNode(evade_physical.value, relic.name, { relic, buff }),
      );
      is_invalid = false;
    }
    /** 法术闪避率 */
    if (evade_magical) {
      context.in_game_buff_final_mul.evade_magical.addChild(
        new NumericLiteralNode(evade_magical.value, relic.name, { relic, buff }),
      );
      is_invalid = false;
    }
    if (is_invalid) {
      context.invalidRelics.push(relic);
    }
  },
};
