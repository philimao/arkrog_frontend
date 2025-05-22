import type {
  CalculatorInput,
  CalculatorOutput,
  CharData,
  DamageByType,
  RelicWrapper,
  RelicBuff,
  CharAttributeExt,
  CharInput,
  CharAttribute,
  BlackboardData,
  EnemyInput,
  RogueInput,
} from "~/types/gameData";
import {
  isRelicActive,
  applyAttrModifiers,
  applyBlackboardData,
  isBuffActive,
  isBlackboardActive,
  allowedBlackboardKeyMap,
} from "../utils";
import { BUFF_KEYS } from "./constant";
import { getRelicBlackboard, isRelicBlackboard } from "./impls";
import { BuffContext } from "./buff-context";

/** 加成词条 */
export interface AdditionEntry {
  /** 干员加成 */
  in_game_char: string[];
  /** 局外加成 */
  out_game_char: string[];
  /** 敌人加成 */
  enemy: string[];
}

/**
 * 计算器的一些辅助函数
 */
export class CalculatorHelper {
  /** 创建空的计算器输出 */
  static createCalculatorOutput(): CalculatorOutput {
    return {
      attack: {
        dph: 0,
        dps: { phy: 0, mag: 0, pure: 0, ep: 0 },
        total_damage: { phy: 0, mag: 0, pure: 0, ep: 0 },
      },
      skill: {
        dph: 0,
        dps: { phy: 0, mag: 0, pure: 0, ep: 0 },
        total_damage: { phy: 0, mag: 0, pure: 0, ep: 0 },
      },
      cycle: {
        dph: 0,
        dps: { phy: 0, mag: 0, pure: 0, ep: 0 },
        total_damage: { phy: 0, mag: 0, pure: 0, ep: 0 },
      },
      logs: [],
    };
  }

  /** 创建加成上下文 */
  static createAdditionContext(): BuffContext {
    return new BuffContext();
  }

  /** 计算面板 @deprecated */
  static calculatePanel(input: {
    charInput: CharInput;
    charData: CharData;
    enemyInput: EnemyInput;
    relics: RelicWrapper[];
  }): CharAttributeExt {
    const { charInput, charData, enemyInput, relics } = input;
    const analysisResult = CalculatorHelper.analyzeRelics({ charInput, charData, enemyInput, relics });
    // 获取精英化等级属性
    const attribute = charInput.phase?.attributesKeyFrames[charInput.level].data; // TODO 去掉?

    const result = { ...attribute, damageScale: 1 } as CharAttributeExt;
    const consoleData = [];
    consoleData.push({
      type: "基础属性",
      攻击力: result.atk,
      攻击速度: result.attackSpeed,
      防御力: result.def,
      最大生命值: result.maxHp,
    });

    /** 应用信赖效果 */
    const favor = charData.favorKeyFrames[1].data;
    for (const key in favor) {
      const typedKey = key as keyof CharAttribute;
      if (typeof result[typedKey] === "number") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        result[typedKey] += favor[typedKey];
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        result[typedKey] = favor[typedKey];
      }
    }
    consoleData.push({
      type: "信赖效果",
      攻击力: result.atk,
      攻击速度: result.attackSpeed,
      防御力: result.def,
      最大生命值: result.maxHp,
    });

    /** 应用潜能效果 */
    for (const pot of charData.potentialRanks.slice(0, charInput.potential)) {
      pot.buff?.attributes.attributeModifiers.forEach((mod) => applyAttrModifiers(mod, result));
    }
    consoleData.push({
      type: "潜能效果",
      攻击力: result.atk,
      攻击速度: result.attackSpeed,
      防御力: result.def,
      最大生命值: result.maxHp,
    });

    /** 应用模组效果 */
    const uniEquip = charInput.uniEquip;
    if (uniEquip) {
      // 基础值
      for (const bb of uniEquip.attributeBlackboard) {
        applyBlackboardData(bb, result);
      }
      // 天赋与特性效果
      for (const part of uniEquip.parts) {
        for (const candidates of [
          part.overrideTraitDataBundle.candidates, // 特性
          part.addOrOverrideTalentDataBundle.candidates, // 天赋
        ]) {
          if (!candidates) continue;
          // 从多个candidate中选出符合潜能的
          const admittedTrait = candidates.findLast((item) => item.requiredPotentialRank <= charInput.potential);
          for (const bb of admittedTrait!.blackboard) {
            applyBlackboardData(bb, result);
          }
        }
      }
    }
    consoleData.push({
      type: "模组效果",
      攻击力: result.atk,
      攻击速度: result.attackSpeed,
      防御力: result.def,
      最大生命值: result.maxHp,
    });

    /** 应用局外加成(加算) */
    result.atk += analysisResult.relic_rune_add.atk;
    result.attackSpeed += analysisResult.relic_rune_add.attack_speed;
    result.def += analysisResult.relic_rune_add.def;
    consoleData.push({
      type: "局外加成(加算)",
      攻击力: result.atk,
      攻击速度: result.attackSpeed,
      防御力: result.def,
      最大生命值: result.maxHp,
    });

    /** 应用局外加成(乘算) */
    result.atk = Math.round(result.atk * analysisResult.relic_rune_mul.atk);
    result.def = Math.round(result.def * analysisResult.relic_rune_mul.def);
    result.maxHp = Math.round(result.maxHp * analysisResult.relic_rune_mul.max_hp);
    consoleData.push({
      type: "局外加成(乘算)",
      攻击力: result.atk,
      攻击速度: result.attackSpeed,
      防御力: result.def,
      最大生命值: result.maxHp,
    });

    console.table(consoleData);
    return result;
  }

  /** 计算局外面板 */
  static calculateOutsidePanel(input: { charInput: CharInput; context: BuffContext }): CharAttributeExt {
    const { charInput, context } = input;
    // 获取精英化等级属性
    const attribute = charInput.phase?.attributesKeyFrames[charInput.level].data; // TODO 去掉?
    const result = { ...attribute, damageScale: 1 } as CharAttributeExt;

    /** 覆盖自然技力回复-攻回技能不会自动回复技力 */
    if (charInput.skill.spData.spType === "INCREASE_WHEN_ATTACK") {
      result.spRecoveryPerSec = 0;
    }

    /** 应用局外加成(加算) */
    result.atk += context.relic_rune_add.atk;
    result.attackSpeed += context.relic_rune_add.attack_speed;
    result.def += context.relic_rune_add.def;
    result.maxHp += context.relic_rune_add.max_hp;
    result.cost += context.relic_rune_add.cost;
    result.hpRecoveryPerSec += context.relic_rune_add.hp_recovery_per_sec;

    /** 应用局外加成(乘算) */
    result.atk = Math.round(result.atk * context.relic_rune_mul.atk);
    result.def = Math.round(result.def * context.relic_rune_mul.def);
    result.maxHp = Math.round(result.maxHp * context.relic_rune_mul.max_hp);

    /** 应用局内加算 */
    result.spRecoveryPerSec += context.in_game_buff_add.sp_recovery_per_sec;

    return result;
  }

  /** 分析干员养成加成 */
  static analyzeChar(input: { charInput: CharInput; charData: CharData }, context?: BuffContext) {
    const { charInput, charData } = input;

    const result: BuffContext = context ? context.clone() : CalculatorHelper.createAdditionContext();
    /** 应用信赖效果 */
    const favor = charData.favorKeyFrames[1].data;
    for (const key in favor) {
      const typedKey = key as keyof CharAttribute;
      if (typedKey === "atk" && favor.atk) {
        result.relic_rune_add.atk += favor.atk;
        result.relic_rune_add.atk_source.push({
          name: "信赖效果",
          value: favor.atk,
          usage: `信赖效果 +${favor.atk}`,
        });
      }
      if (typedKey === "attackSpeed" && favor.attackSpeed) {
        result.relic_rune_add.attack_speed += favor.attackSpeed;
        result.relic_rune_add.attack_speed_source.push({
          name: "信赖效果",
          value: favor.attackSpeed,
          usage: `信赖效果 +${favor.attackSpeed}`,
        });
      }
      if (typedKey === "def" && favor.def) {
        result.relic_rune_add.def += favor.def;
        result.relic_rune_add.def_source.push({
          name: "信赖效果",
          value: favor.def,
          usage: `信赖效果 +${favor.def}`,
        });
      }
      if (typedKey === "maxHp" && favor.maxHp) {
        result.relic_rune_add.max_hp += favor.maxHp;
        result.relic_rune_add.max_hp_source.push({
          name: "信赖效果",
          value: favor.maxHp,
          usage: `信赖效果 +${favor.maxHp}`,
        });
      }
    }

    /** 应用潜能效果 */
    for (const pot of charData.potentialRanks.slice(0, charInput.potential)) {
      pot.buff?.attributes.attributeModifiers.forEach((mod) => {
        switch (mod.attributeType) {
          case "COST": {
            result.relic_rune_add.cost += mod.value;
            result.relic_rune_add.cost_source.push({
              name: "潜能效果",
              value: mod.value,
              usage: `潜能效果 +${mod.value}`,
            });
            break;
          }
          case "MAX_HP": {
            result.relic_rune_add.max_hp += mod.value;
            result.relic_rune_add.max_hp_source.push({
              name: "潜能效果",
              value: mod.value,
              usage: `潜能效果 +${mod.value}`,
            });
            break;
          }
          case "ATK": {
            result.relic_rune_add.atk += mod.value;
            result.relic_rune_add.atk_source.push({
              name: "潜能效果",
              value: mod.value,
              usage: `潜能效果 +${mod.value}`,
            });
            break;
          }
          case "DEF": {
            result.relic_rune_add.def += mod.value;
            result.relic_rune_add.def_source.push({
              name: "潜能效果",
              value: mod.value,
              usage: `潜能效果 +${mod.value}`,
            });
            break;
          }
          case "ATTACK_SPEED": {
            result.relic_rune_add.attack_speed += mod.value;
            result.relic_rune_add.attack_speed_source.push({
              name: "潜能效果",
              value: mod.value,
              usage: `潜能效果 +${mod.value}`,
            });
            break;
          }
        }
      });
    }

    /** 应用模组效果 */
    const uniEquip = charInput.uniEquip;
    if (uniEquip) {
      // 基础值
      for (const bb of uniEquip.attributeBlackboard) {
        CalculatorHelper.analyzeBlackboard(bb, result);
      }
      // 天赋与特性效果
      for (const part of uniEquip.parts) {
        for (const candidates of [
          part.overrideTraitDataBundle.candidates, // 特性
          part.addOrOverrideTalentDataBundle.candidates, // 天赋
        ]) {
          if (!candidates) continue;
          // 从多个candidate中选出符合潜能的
          const admittedTrait = candidates.findLast((item) => item.requiredPotentialRank <= charInput.potential);
          for (const bb of admittedTrait!.blackboard) {
            CalculatorHelper.analyzeBlackboard(bb, result);
          }
        }
      }
    }
    return result;
  }

  /** 分析黑板数据(来自模组) */
  static analyzeBlackboard(bb: BlackboardData, result: BuffContext) {
    switch (bb.key) {
      // TODO
      // case "damageScale": {
      //   result.damageScale += bb.value - 1;
      //   break;
      // }
      case "max_hp": {
        result.relic_rune_add.max_hp += bb.value;
        result.relic_rune_add.max_hp_source.push({
          name: "模组效果",
          value: bb.value,
          usage: `模组效果 +${bb.value}`,
        });
        break;
      }
      case "atk": {
        result.relic_rune_add.atk += bb.value;
        result.relic_rune_add.atk_source.push({
          name: "模组效果",
          value: bb.value,
          usage: `模组效果 +${bb.value}`,
        });
        break;
      }
    }
  }

  /**
   * 分析藏品加成
   * @param input 输入
   * @param input.charInput 角色输入
   * @param input.charData 角色数据
   * @param input.enemyInput 敌人输入
   * @param input.relics 藏品
   */
  static analyzeRelics(
    input: { charInput: CharInput; charData: CharData; enemyInput: EnemyInput; relics: RelicWrapper[] },
    context?: BuffContext,
  ) {
    const { charInput, charData, enemyInput, relics } = input;
    const result: BuffContext = context ? context.clone() : CalculatorHelper.createAdditionContext();
    /** 科技树加成 */
    const tech = charInput.tech;
    if (tech > 1) {
      result.relic_rune_mul.atk += tech - 1;
      result.relic_rune_mul.atk_source.push({
        name: "科技树",
        value: (tech * 100 - 100) / 100,
        usage: `科技树加成 +${tech * 100 - 100}%`,
      });
      result.relic_rune_mul.def += tech - 1;
      result.relic_rune_mul.def_source.push({
        name: "科技树",
        value: (tech * 100 - 100) / 100,
        usage: `科技树加成 +${tech * 100 - 100}%`,
      });
      result.relic_rune_mul.max_hp += tech - 1;
      result.relic_rune_mul.max_hp_source.push({
        name: "科技树",
        value: (tech * 100 - 100) / 100,
        usage: `科技树加成 +${tech * 100 - 100}%`,
      });
    }
    /** 用户修正属性 */
    if (charInput.attributeModifier.atkBase) {
      result.relic_rune_add.atk += charInput.attributeModifier.atkBase;
      result.relic_rune_add.atk_source.push({
        name: "用户修正属性",
        value: charInput.attributeModifier.atkBase,
        usage: `用户修正属性 +${charInput.attributeModifier.atkBase}`,
      });
    }
    if (charInput.attributeModifier.atkPercent) {
      result.relic_rune_mul.atk += charInput.attributeModifier.atkPercent / 100;
      result.relic_rune_mul.atk_source.push({
        name: "用户修正属性",
        value: charInput.attributeModifier.atkPercent / 100,
        usage: `用户修正属性 +${charInput.attributeModifier.atkPercent}%`,
      });
    }
    if (charInput.attributeModifier.atkFinal) {
      result.in_game_buff_final_add.atk += charInput.attributeModifier.atkFinal;
      result.in_game_buff_final_add.atk_source.push({
        name: "用户修正属性",
        usage: `用户修正属性 +${charInput.attributeModifier.atkFinal}`,
      });
    }
    /** 筛选藏品 */
    for (const relic of relics) {
      // 遍历藏品buff
      relic.relicData.buffs.forEach((buff) => {
        // 是否存在藏品黑板实现
        if (isRelicBlackboard(buff)) {
          result.categories.other.push({ buff, relic });
          const blackboard = getRelicBlackboard(buff, relic);
          // buff是否可以生效
          if (blackboard.isActive({ charData, charInput, enemyInput, relics })) {
            // 生效 应用到上下文
            blackboard.apply(result);
          } else {
            // 不生效 无效藏品
            result.invalidRelics.push(relic);
          }
          return;
        }
        // 藏品在黑名单中
        if (!isRelicActive(relic.name)) {
          result.invalidRelics.push(relic);
          return;
        }
        if (!CalculatorHelper.isRelicForChar(buff, relic, charData)) {
          result.invalidRelics.push(relic);
          return;
        }
        if (BUFF_KEYS.藏品rune.加算.includes(buff.key)) {
          result.categories.relic_rune_add.push({ buff, relic });
        } else if (BUFF_KEYS.藏品rune.乘算.includes(buff.key)) {
          result.categories.relic_rune_mul.push({ buff, relic });
        } else if (BUFF_KEYS.全局Buff.直接加算.includes(buff.key)) {
          result.categories.global_buff_add.push({ buff, relic });
        } else if (BUFF_KEYS.全局Buff.直接乘算.includes(buff.key)) {
          result.categories.global_buff_mul.push({ buff, relic });
        } else if (BUFF_KEYS.全局Buff.最终加算.includes(buff.key)) {
          result.categories.global_buff_final_add.push({ buff, relic });
        } else if (BUFF_KEYS.全局Buff.最终乘算.includes(buff.key)) {
          result.categories.global_buff_final_mul.push({ buff, relic });
        } else if (BUFF_KEYS.全局Buff.buff_stack.includes(buff.key)) {
          result.categories.global_buff_stack.push({ buff, relic });
        } else {
          result.invalidRelics.push(relic);
        }
      });
    }
    // 计算藏品rune 局外加算
    result.categories.relic_rune_add.forEach(({ buff, relic }) => {
      const blackboard = CalculatorHelper.analyzeRelic(buff);
      if (blackboard.key !== "char") {
        return;
      }
      if (blackboard.atk) {
        result.relic_rune_add.atk += blackboard.atk * relic.layer;
        result.relic_rune_add.atk_source.push({
          buff,
          value: blackboard.atk * relic.layer,
          usage: relic.relicData.usage,
          name: relic.name,
          relic,
        });
      }
      if (blackboard.attack_speed) {
        result.relic_rune_add.attack_speed += blackboard.attack_speed * relic.layer;
        result.relic_rune_add.attack_speed_source.push({
          buff,
          value: blackboard.attack_speed * relic.layer,
          usage: relic.relicData.usage,
          name: relic.name,
          relic,
        });
      }
      if (blackboard.def) {
        result.relic_rune_add.def += blackboard.def * relic.layer;
        result.relic_rune_add.def_source.push({
          buff,
          value: blackboard.def * relic.layer,
          usage: relic.relicData.usage,
          name: relic.name,
          relic,
        });
      }
      if (blackboard.cost) {
        result.relic_rune_add.cost += blackboard.cost * relic.layer;
        result.relic_rune_add.cost_source.push({
          buff,
          value: blackboard.cost * relic.layer,
          usage: relic.relicData.usage,
          name: relic.name,
          relic,
        });
      }
      if (blackboard.hp_recovery_per_sec) {
        result.relic_rune_add.hp_recovery_per_sec += blackboard.hp_recovery_per_sec * relic.layer;
        result.relic_rune_add.hp_recovery_per_sec_source.push({
          buff,
          value: blackboard.hp_recovery_per_sec * relic.layer,
          usage: relic.relicData.usage,
          name: relic.name,
          relic,
        });
      }
    });
    // 计算藏品rune 局外乘算
    result.categories.relic_rune_mul.forEach(({ buff, relic }) => {
      const blackboard = CalculatorHelper.analyzeRelic(buff);
      if (blackboard.atk) {
        result.relic_rune_mul.atk += blackboard.atk * relic.layer;
        result.relic_rune_mul.atk_source.push({
          buff,
          value: blackboard.atk * relic.layer,
          usage: relic.relicData.usage,
          name: relic.name,
          relic,
        });
      }
      if (blackboard.def) {
        result.relic_rune_mul.def += blackboard.def * relic.layer;
        result.relic_rune_mul.def_source.push({
          buff,
          value: blackboard.def * relic.layer,
          usage: relic.relicData.usage,
          name: relic.name,
          relic,
        });
      }
      if (blackboard.max_hp) {
        result.relic_rune_mul.max_hp += blackboard.max_hp * relic.layer;
        result.relic_rune_mul.max_hp_source.push({
          buff,
          value: blackboard.max_hp * relic.layer,
          usage: relic.relicData.usage,
          name: relic.name,
          relic,
        });
      }
    });
    // 计算局内Buff 直接加算
    result.categories.global_buff_add.forEach(({ buff, relic }) => {
      const blackboard = CalculatorHelper.analyzeRelic(buff);
      if (blackboard.atk) {
        result.in_game_buff_add.atk += blackboard.atk * relic.layer;
        result.in_game_buff_add.atk_source.push({
          name: relic.name,
          value: blackboard.atk * relic.layer,
          usage: relic.relicData.usage,
          buff,
          relic,
        });
      }
    });
    // 计算局内Buff 局内乘算
    result.categories.global_buff_mul.forEach(({ buff, relic }) => {
      const blackboard = CalculatorHelper.analyzeRelic(buff);
      if (blackboard.atk) {
        result.in_game_buff_mul.atk += blackboard.atk * relic.layer;
        result.in_game_buff_mul.atk_source.push({
          buff,
          value: blackboard.atk * relic.layer,
          relic: relic,
          usage: relic.relicData.usage,
          name: relic.name,
        });
      }
    });
    // 计算局内Buff 最终加算
    result.categories.global_buff_final_add.forEach(({ buff, relic }) => {
      const blackboard = CalculatorHelper.analyzeRelic(buff);
      if (blackboard.atk) {
        result.in_game_buff_final_add.atk += blackboard.atk * relic.layer;
        result.in_game_buff_final_add.atk_source.push({ buff, relic, usage: relic.relicData.usage, name: relic.name });
      }
    });
    // 计算局内Buff 最终乘算
    result.categories.global_buff_final_mul.forEach(({ buff, relic }) => {
      const blackboard = CalculatorHelper.analyzeRelic(buff);
      if (blackboard.atk) {
        result.in_game_buff_final_mul.atk += blackboard.atk * relic.layer;
        result.in_game_buff_final_mul.atk_source.push({ buff, relic, usage: relic.relicData.usage, name: relic.name });
      }
    });

    return result;
  }

  static analyzeRelic(buff: RelicBuff) {
    const blackboard: {
      key: "enemy_atk_down" | "char";
      /** 职业: medic|sniper */
      selectorProfession?: string;
      /** 攻击力 */
      atk: number;
      /** 攻击速度 */
      attack_speed: number;
      /** 防御力 */
      def: number;
      /** 最大生命值 */
      max_hp: number;
      /** 部署费用 */
      cost: number;
      /** 每秒生命回复 */
      hp_recovery_per_sec: number;
      /** 每秒技力回复 */
      sp_recovery_per_sec: number;
    } = {
      key: "char",
      atk: 0,
      attack_speed: 0,
      def: 0,
      max_hp: 0,
      cost: 0,
      hp_recovery_per_sec: 0,
      sp_recovery_per_sec: 0,
    };
    buff.blackboard.forEach((item) => {
      if (item.key === "key") {
        blackboard.key = item.valueStr as "enemy_atk_down" | "char";
      }
      if (item.key === "selector.profession") {
        blackboard.selectorProfession = item.valueStr ?? undefined;
      }
      if (item.key === "attack_speed") {
        blackboard.attack_speed = item.value;
      }
      if (item.key === "def") {
        blackboard.def = item.value;
      }
      if (item.key === "atk") {
        blackboard.atk = item.value;
      }
      if (item.key === "max_hp") {
        blackboard.max_hp = item.value;
      }
      if (item.key === "cost") {
        blackboard.cost = item.value;
      }
      if (item.key === "hp_recovery_per_sec") {
        blackboard.hp_recovery_per_sec = item.value;
      }
      if (item.key === "sp_recovery_per_sec") {
        blackboard.sp_recovery_per_sec = item.value;
      }
    });
    return blackboard;
  }

  /** 分析肉鸽难度加成 */
  static analyzeRogueDifficulty(
    input: { rogueInput: RogueInput; enemyInput: EnemyInput },
    context: BuffContext,
  ): BuffContext {
    const { rogueInput, enemyInput } = input;
    if (rogueInput.topic === "rogue_4") {
      const { difficulty, thoughtLoad, inspiration } = rogueInput.rogue_4;
      if (difficulty === 18 && thoughtLoad === "CONFUSION") {
        context.relic_rune_mul.atk -= 0.2;
        context.relic_rune_mul.atk_source.push({
          name: "思维混乱",
          value: -0.2,
          usage: "思维混乱-20%攻击力",
        });
        context.relic_rune_add.cost += 3;
        context.relic_rune_add.cost_source.push({
          name: "思维混乱",
          value: 3,
          usage: "思维混乱+3部署费用",
        });
      }
      /** 肉鸽难度加成 */
      const bossValues = [0, 0, 0, 0, 0, 1, 2, 3, 5, 6, 7, 8, 10, 13, 16, 20, 21, 22, 22];
      const bossValue = bossValues[difficulty];
      if (bossValue) {
        const value = Math.pow(bossValue / 100 + 1, 6);
        context.in_game_buff_final_mul.enemy_atk_down *= value;
        context.in_game_buff_final_mul.enemy_atk_down_source.push({
          name: `直面魂灵·${difficulty} | 层数6`,
          value,
          usage: `每进入一层, 敌人攻击力+${bossValue}%`,
        });
        context.in_game_buff_final_mul.enemy_max_hp_down *= value;
        context.in_game_buff_final_mul.enemy_max_hp_down_source.push({
          name: `直面魂灵·${difficulty} | 层数6`,
          value,
          usage: `每进入一层, 敌人最大生命值+${bossValue}%`,
        });
      }
      /** 难度部分词条 精英和领袖敌人生命值+20% */
      if (difficulty >= 4 && ["ELITE", "BOSS"].includes(enemyInput.levelType)) {
        context.in_game_buff_final_mul.enemy_max_hp_down *= 1.2;
        context.in_game_buff_final_mul.enemy_max_hp_down_source.push({
          name: `直面魂灵·${difficulty} | 精英和领袖敌人生命值+20%`,
          value: 0.2,
          usage: `精英和领袖敌人生命值+20%`,
        });
      }
      /** 难度部分词条 精英和领袖敌人攻击力+10% */
      if (difficulty >= 7 && ["ELITE", "BOSS"].includes(enemyInput.levelType)) {
        context.in_game_buff_final_mul.enemy_atk_down *= 1.1;
        context.in_game_buff_final_mul.enemy_atk_down_source.push({
          name: `直面魂灵·${difficulty} | 精英和领袖敌人攻击力+10%`,
          value: 0.1,
          usage: `精英和领袖敌人攻击力+10%`,
        });
      }
    }
    return context;
  }

  /** 该藏品Buff对干员是否生效 */
  static isRelicForChar(buff: RelicBuff, relic: RelicWrapper, charData: CharData): boolean {
    const isActive = isRelicActive(relic.name) && isBuffActive(buff, charData) && isBlackboardActive(buff, charData);
    return isActive;
  }

  /** 把上下文输出一个加成词条 */
  static outputAdditionEntry(context: BuffContext): AdditionEntry {
    const result: AdditionEntry = {
      in_game_char: [],
      out_game_char: [],
      enemy: [],
    };
    const parse = (key: string, value: number) =>
      `${allowedBlackboardKeyMap[key] || key}: ${value > 1 ? value : Math.round(value * 100) + "%"}`;
    Object.entries(context.relic_rune_add).forEach(([key, value]) => {
      if (typeof value === "number" && value > 0) {
        result.out_game_char.push(parse(key, value));
      }
    });
    Object.entries(context.relic_rune_mul).forEach(([key, value]) => {
      if (typeof value === "number" && value !== 1) {
        result.out_game_char.push(`${allowedBlackboardKeyMap[key] || key}: ${Math.round(value * 100) + "%"}`);
      }
    });
    Object.entries(context.in_game_buff_add).forEach(([key, value]) => {
      if (typeof value === "number" && value > 0) {
        result.in_game_char.push(`局内${allowedBlackboardKeyMap[key] || key}: ${value}`);
      }
    });
    Object.entries(context.in_game_buff_mul).forEach(([key, value]) => {
      if (typeof value === "number" && value !== 1) {
        result.in_game_char.push(`局内${allowedBlackboardKeyMap[key] || key}: ${Math.round(value * 100)}%`);
      }
    });
    Object.entries(context.in_game_buff_final_mul).forEach(([key, value]) => {
      const isEnemy = [
        "enemy_atk_down",
        "enemy_def_down",
        "enemy_max_hp_down",
        "enemy_damage_scale_phy",
        "enemy_damage_scale_mag",
        "enemy_damage_scale_pure",
        "enemy_damage_resistance_inf",
      ].includes(key);
      if (!isEnemy && typeof value === "number" && value !== 1) {
        result.in_game_char.push(`最终乘算${allowedBlackboardKeyMap[key] || key}: ${Math.round(value * 100)}%`);
      }
      if (isEnemy && typeof value === "number" && value !== 1) {
        result.enemy.push(`${allowedBlackboardKeyMap[key] || key}: ${Math.round(value * 100)}%`);
      }
    });
    Object.entries(context.global_buff_stack).forEach(([key, value]) => {
      if (typeof value === "number" && value !== 1) {
        result.in_game_char.push(`${allowedBlackboardKeyMap[key] || key}: ${Math.round(value * 100)}%`);
      }
    });
    return result;
  }

  /** 标准打印 */
  static print(input: CalculatorInput, output: CalculatorOutput) {
    console.log(
      `%c 本次运行伤害计算结果 %c 版本：1.0.0 `,
      "background: #35495e; padding: 4px; border-radius: 3px 0 0 3px; color: #fff",
      "background: #41b883; padding: 4px; border-radius: 0 3px 3px 0; color: #fff",
    );
    console.groupCollapsed("查看输入输出原始数据");
    console.groupCollapsed(
      "%c 输入 ",
      "background:rgb(46, 59, 232); padding: 4px; border-radius: 3px; color: #fff;font-weight:bold",
    );
    console.log(input);
    console.groupEnd();
    console.groupCollapsed(
      "%c 输出 ",
      "background:rgb(181, 168, 29); padding: 4px; border-radius: 3px; color: #fff;font-weight:bold",
    );
    console.log(output);
    console.groupEnd();
    CalculatorHelper.printRelicAnalysisResult(
      CalculatorHelper.analyzeRelics({
        charInput: input.charInput,
        charData: input.charData,
        enemyInput: input.enemyInput,
        relics: input.relics,
      }),
    );
    console.groupEnd();
    console.groupCollapsed("查看结构化输出");
    const tableData = [];
    tableData.push({
      伤害类型: "普攻伤害",
      面板攻击力: output.attack.dph,
      dps: countDamage(output.attack.dps),
      总伤: countDamage(output.attack.total_damage),
    });
    tableData.push({
      伤害类型: "技能伤害",
      面板攻击力: output.skill.dph,
      dps: countDamage(output.skill.dps),
      总伤: countDamage(output.skill.total_damage),
    });
    tableData.push({
      伤害类型: "周期伤害",
      面板攻击力: output.cycle.dph,
      dps: countDamage(output.cycle.dps),
      总伤: countDamage(output.cycle.total_damage),
    });
    function countDamage(damage: DamageByType) {
      return damage.phy + damage.mag + damage.pure + damage.ep;
    }
    console.table(tableData);
    console.groupEnd();
  }

  static printRelicAnalysisResult(result: BuffContext) {
    console.groupCollapsed("加成详细数据");
    console.log(result);
    console.log("藏品rune 加算", result.relic_rune_add);
    console.log("藏品rune 乘算", result.relic_rune_mul);
    console.log("局内Buff 直接加算", result.in_game_buff_add);
    console.log("局内Buff 直接乘算", result.in_game_buff_mul);
    console.log("局内Buff 最终加算", result.in_game_buff_final_add);
    console.log("局内Buff 最终乘算", result.in_game_buff_final_mul);
    console.log("全局Buff 堆叠", result.global_buff_stack);
    console.groupEnd();
    console.groupCollapsed("加成表格");
    const btd = [
      { type: "局外加算", buff: result.relic_rune_add },
      { type: "局外乘算", buff: result.relic_rune_mul },
      { type: "局内直接加算", buff: result.in_game_buff_add },
      { type: "局内直接乘算", buff: result.in_game_buff_mul },
      { type: "局内最终加算", buff: result.in_game_buff_final_add },
      { type: "局内最终乘算", buff: result.in_game_buff_final_mul },
      { type: "全局Buff 堆叠", buff: result.global_buff_stack },
    ].map((buff: any) => {
      return {
        计算方式: buff.type,
        攻击力: buff.buff.atk,
        攻击速度: buff.buff.attack_speed,
        防御力: buff.buff.def,
        最大生命值: buff.buff.max_hp,
        部署费用: buff.buff.cost,
        每秒生命回复: buff.buff.hp_recovery_per_sec,
      };
    });
    console.table(btd);
    console.groupEnd();
  }

  static printRelicKeyMap(relicList: RelicWrapper[]) {
    const relicBuff: { [key: string]: Array<[string, string]> } = {};

    const context = CalculatorHelper.createAdditionContext();
    for (const relic of relicList) {
      for (const buff of relic.relicData.buffs) {
        if (!relicBuff[buff.key]) {
          relicBuff[buff.key] = [];
        }
        if (isRelicBlackboard(buff)) {
          const relicBlackboard = getRelicBlackboard(buff, relic);
          relicBlackboard.apply(context);
        } else {
          const blackboard = CalculatorHelper.analyzeRelic(buff);
          relicBuff[buff.key].push([relic.name, blackboard.key]);
          context.categories.other.push({ buff, relic });
        }
      }
    }
    console.log("藏品Buff Key Map", relicBuff.global_buff_normal);
    console.log(context);
  }
}
