import {
  getByKey,
  getByKeySafe,
  registerRelicBlackboard,
  type RelicBlackboardApplyInput,
  type EnemyRelicBlackboardInput,
  type RelicBlackboard,
} from "./impls";
import { NumericLiteralNode } from "./ast";
import {
  inGameRelicNames,
  isBlackboardActiveForChar,
  isBlackboardActiveForEnemy,
  isBuffActive,
  isRelicInBlacklist,
  parseDefinedData,
} from "../utils";

/** 敌人攻击力改变 */
registerRelicBlackboard("enemy_atk_down", {
  isActive(input) {
    const { buff, enemyData } = input;
    const enemy_level_type = getByKey(buff.blackboard, "selector.enemy_level_type")?.valueStr as
      | "BOSS"
      | "ELITE"
      | "NORMAL";
    // 无敌人数据时，默认生效 TODO
    if (!enemyData) return true;
    return enemy_level_type ? parseDefinedData(enemyData.levelType) === enemy_level_type : true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const atk = getByKeySafe(buff.blackboard, "atk");
    /** 当value为正数时必然>1，例如攻击力+20%显示为1.2，当value为负数时，表示减攻，例如攻击力-10%显示为-0.1 */
    const value = Math.sign(atk.value) === 1 ? atk.value : 1 + atk.value;
    context.in_game_buff_final_mul.enemy_atk.addChild(new NumericLiteralNode(value, relic.name));
  },
});

/** 敌人防御力改变 */
registerRelicBlackboard("enemy_def_down", {
  isActive(input) {
    const { buff, enemyData } = input;
    const enemy_level_type = getByKey(buff.blackboard, "selector.enemy_level_type")?.valueStr as
      | "BOSS"
      | "ELITE"
      | "NORMAL";
    if (!enemyData) return true;
    return enemy_level_type ? parseDefinedData(enemyData.levelType) === enemy_level_type : true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const def = getByKeySafe(buff.blackboard, "def");
    const value = Math.sign(def.value) === 1 ? def.value : 1 + def.value;
    context.in_game_buff_final_mul.enemy_def.addChild(new NumericLiteralNode(value, relic.name));
  },
});

/** 敌人最大生命值改变 */
registerRelicBlackboard("enemy_max_hp_down", {
  isActive(input) {
    const { buff, enemyData } = input;
    const enemy_level_type = getByKey(buff.blackboard, "selector.enemy_level_type")?.valueStr as
      | "BOSS"
      | "ELITE"
      | "NORMAL";
    if (!enemyData) return true;
    return enemy_level_type ? parseDefinedData(enemyData.levelType) === enemy_level_type : true;
  },
  apply(input): void {
    const { context, buff, relic } = input;
    const max_hp = getByKeySafe(buff.blackboard, "max_hp");
    const value = Math.sign(max_hp.value) === 1 ? max_hp.value : 1 + max_hp.value;
    context.in_game_buff_final_mul.enemy_max_hp.addChild(new NumericLiteralNode(value, relic.name));
  },
});

/** 敌人攻击速度减少 */
registerRelicBlackboard("enemy_attack_speed_down", {
  isActive() {
    return true;
  },
  apply(): void {
    // TODO 暂不实现敌方攻击速度
  },
});

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

/** 编队中每有一名【伺烛客】属性增加 (岁花,飞驮客运) */
registerRelicBlackboard("rogue_5_character_in_candle_holder_common_buff[stack]", {
  isActive(input) {
    return !input.charData || isBlackboardActiveForChar(input.buff, input.charData);
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
      context.relic_rune_mul.atk.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
    }
    if (def) {
      context.relic_rune_mul.def.addChild(new NumericLiteralNode(def.value * relic.layer, relic.name));
    }
    if (max_hp) {
      context.relic_rune_mul.max_hp.addChild(new NumericLiteralNode(max_hp.value * relic.layer, relic.name));
    }
  },
});

/** 【伺烛客】属性增加 (岁衡,难闻的止血剂,未知仪器) */
registerRelicBlackboard("rogue_5_character_in_candle_holder_common_buff", {
  isActive(input) {
    return !input.charData || isBlackboardActiveForChar(input.buff, input.charData);
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
      context.relic_rune_mul.atk.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
    }
    if (def) {
      context.relic_rune_mul.def.addChild(new NumericLiteralNode(def.value * relic.layer, relic.name));
    }
    if (max_hp) {
      context.relic_rune_mul.max_hp.addChild(new NumericLiteralNode(max_hp.value * relic.layer, relic.name));
    }
  },
});

/** 通用敌人藏品黑板 */
export const commonEnemyRelicBlackboard = {
  isActive({ buff, enemyData, relic }: EnemyRelicBlackboardInput) {
    /** 同时对敌我生效的藏品不应该在此处理 */
    const isActive = isRelicInBlacklist(relic.name) && isBlackboardActiveForEnemy(buff, enemyData);
    return isActive;
  },
  apply({ relic, context, buff }: RelicBlackboardApplyInput): void {
    let is_invalid = true;
    // 目前只处理了雕词錾刀和十戒，但敌人通用面板应该也重构到此处 TODO
    const max_hp = getByKey(buff.blackboard, "max_hp");
    if (max_hp) {
      const maxHpValue = Math.sign(max_hp.value) === 1 ? max_hp.value : 1 + max_hp.value;
      context.relic_rune_mul.enemy_max_hp.addChild(new NumericLiteralNode(maxHpValue, relic.name));
      is_invalid = false;
    }
    const def = getByKey(buff.blackboard, "def");
    if (def) {
      const defValue = Math.sign(def.value) === 1 ? def.value : 1 + def.value;
      context.relic_rune_mul.enemy_def.addChild(new NumericLiteralNode(defValue, relic.name));
      is_invalid = false;
    }
    if (is_invalid) {
      context.invalidRelics.push(relic);
    }
  },
};

/** 通用干员藏品黑板 */
export const commonCharRelicBlackboard: RelicBlackboard = {
  isActive({ buff, stageData, charData, relic }) {
    // 判断藏品是否可以生效（旧逻辑）
    const isActive =
      isRelicInBlacklist(relic.name) && isBuffActive(buff, charData) && isBlackboardActiveForChar(buff, charData);
    if (!isActive) return false;

    const validator_roguelike_event_type = getByKey(buff.blackboard, "validator.roguelike_event_type")?.valueStr as
      | "BATTLE_BOSS"
      | "DUEL";
    // 藏品仅在部分关卡类型中生效
    if (validator_roguelike_event_type) {
      let validator = false;
      // 是否为BOSS关
      if (validator_roguelike_event_type === "BATTLE_BOSS" && stageData?.isBoss) {
        validator = true;
      }
      // 是否为狭路相逢（判断关卡ID是否包含duel）
      if (validator_roguelike_event_type === "DUEL" && stageData?.id.includes("duel")) {
        validator = true;
      }
      // 不满足条件 无效藏品
      if (!validator) {
        return false;
      }
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
    const cost = getByKey(buff.blackboard, "cost");
    const magic_resistance = getByKey(buff.blackboard, "magic_resistance");
    /** 最大生命值 */
    if (max_hp) {
      context.relic_rune_mul.max_hp.addChild(
        new NumericLiteralNode(max_hp.value * relic.layer, relic.name, { relic, buff }),
      );
      is_invalid = false;
    }
    /** 攻击力 */
    if (atk) {
      const inGame = inGameRelicNames.includes(relic.name);
      if (inGame) {
        context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value * relic.layer, relic.name));
      } else {
        context.relic_rune_mul.atk.addChild(
          new NumericLiteralNode(atk.value * relic.layer, relic.name, { relic, buff }),
        );
      }
      is_invalid = false;
    }
    /** 防御力 */
    if (def) {
      // 是否加算
      const is_add = ["char_attribute_add"].includes(buff.key);
      const node = new NumericLiteralNode(def.value * relic.layer, relic.name, { relic, buff });
      if (is_add) {
        context.relic_rune_add.def.addChild(node);
      } else {
        context.relic_rune_mul.def.addChild(node);
      }
      is_invalid = false;
    }
    /** 攻击速度 */
    if (attack_speed) {
      // 是否层数藏品
      const is_layer = ["layer_char_attribute_add", "char_squad_attribute_add"].includes(buff.key);
      if (is_layer) {
        context.relic_rune_add.attack_speed.addChild(
          new NumericLiteralNode(attack_speed.value * relic.layer, relic.name, { relic, buff }),
        );
      } else {
        context.relic_rune_add.attack_speed.addChild(
          new NumericLiteralNode(attack_speed.value, relic.name, { relic, buff }),
        );
      }
      is_invalid = false;
    }
    /** 攻击力 multiplier@atk 来源(几丁质刺刃/佣兵的饰物/生还者合约) */
    if (multiplier_atk) {
      context.relic_rune_mul.atk.addChild(
        new NumericLiteralNode(multiplier_atk.value * relic.layer, relic.name, { relic, buff }),
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
    /** 费用 */
    if (cost) {
      context.relic_rune_add.cost.addChild(new NumericLiteralNode(cost.value, relic.name, { relic, buff }));
      is_invalid = false;
    }
    if (is_invalid) {
      context.invalidRelics.push(relic);
    }
  },
};
