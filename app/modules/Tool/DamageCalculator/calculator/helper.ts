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
  StageData,
  EnemyData,
} from "~/types/gameData";
import { isRelicActive, isBuffActive, isBlackboardActive, allowedBlackboardKeyMap, parseDefinedData } from "../utils";
import { getRelicBlackboard, isRelicBlackboard } from "./impls";
import { BuffContext } from "./buff-context";
import { BaseNode, ExpressionGroupNode, NumericLiteralNode } from "./ast";
import type { ITopicSpecItem } from "../TopicSpecSection/TopicSpecSelector";
import { commonRelicBlackboard } from "./blackboard";
import type { EnemySpec } from "../EnemySection/EnemySpecSelector";

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
    result.atk += context.relic_rune_add.atk.calculate();
    result.attackSpeed += context.relic_rune_add.attack_speed.calculate();
    result.def += context.relic_rune_add.def.calculate();
    result.maxHp += context.relic_rune_add.max_hp.calculate();
    result.cost += context.relic_rune_add.cost.calculate();
    result.hpRecoveryPerSec += context.relic_rune_add.hp_recovery_per_sec.calculate();
    result.respawnTime += context.relic_rune_add.respawn_time.calculate();

    /** 应用局外加成(乘算) */
    result.atk = Math.round(result.atk * context.relic_rune_mul.atk.calculate());
    result.def = Math.round(result.def * context.relic_rune_mul.def.calculate());
    result.maxHp = Math.round(result.maxHp * context.relic_rune_mul.max_hp.calculate());
    result.respawnTime = Math.round(result.respawnTime * context.relic_rune_mul.respawn_time.calculate());

    /** 应用局内加算 */
    result.spRecoveryPerSec += context.in_game_buff_add.sp_recovery_per_sec.calculate();

    return result;
  }

  /** 计算敌人属性 */
  static calculateEnemyAttr(input: { enemyInput: EnemyInput; context: BuffContext }): EnemyInput {
    const { enemyInput, context } = input;
    const calcEnemyInput = JSON.parse(JSON.stringify(enemyInput));
    const enemyAttr = calcEnemyInput.attributes;

    // 应用局外加成
    console.groupCollapsed("计算敌人属性");
    enemyAttr.atk = Math.round(enemyAttr.atk * context.in_game_buff_final_mul.enemy_atk.calculate());
    console.log("攻击力", context.in_game_buff_final_mul.enemy_atk.printExpression());
    console.log(context.in_game_buff_final_mul.enemy_atk.printDebug());
    enemyAttr.def = Math.round(enemyAttr.def * context.in_game_buff_final_mul.enemy_def.calculate());
    console.log("防御力", context.in_game_buff_final_mul.enemy_def.printExpression());
    console.log(context.in_game_buff_final_mul.enemy_def.printDebug());
    enemyAttr.maxHp = Math.round(enemyAttr.maxHp * context.in_game_buff_final_mul.enemy_max_hp.calculate());
    console.log("最大生命值", context.in_game_buff_final_mul.enemy_max_hp.printExpression());
    console.log(context.in_game_buff_final_mul.enemy_max_hp.printDebug());

    context.relic_rune_mul.enemy_damage_resistance.calculate();
    console.log("敌人局外减伤", context.relic_rune_mul.enemy_damage_resistance.printExpression());
    console.log(context.relic_rune_mul.enemy_damage_resistance.printDebug());

    enemyAttr.damageResistance = context.in_game_buff_final_mul.enemy_damage_resistance.calculate();
    console.log(context.in_game_buff_final_mul.enemy_damage_resistance);
    console.log("敌人局内减伤", context.in_game_buff_final_mul.enemy_damage_resistance.printExpression());
    console.log(context.in_game_buff_final_mul.enemy_damage_resistance.printDebug());
    console.groupEnd();
    return calcEnemyInput;
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
        result.relic_rune_add.atk.addChild(new NumericLiteralNode(favor.atk, "信赖"));
      }
      if (typedKey === "attackSpeed" && favor.attackSpeed) {
        result.relic_rune_add.attack_speed.addChild(new NumericLiteralNode(favor.attackSpeed, "信赖"));
      }
      if (typedKey === "def" && favor.def) {
        result.relic_rune_add.def.addChild(new NumericLiteralNode(favor.def, "信赖"));
      }
      if (typedKey === "maxHp" && favor.maxHp) {
        result.relic_rune_add.max_hp.addChild(new NumericLiteralNode(favor.maxHp, "信赖"));
      }
    }

    /** 应用潜能效果 */
    for (const pot of charData.potentialRanks.slice(0, charInput.potential)) {
      pot.buff?.attributes.attributeModifiers.forEach((mod) => {
        switch (mod.attributeType) {
          case "COST": {
            result.relic_rune_add.cost.addChild(new NumericLiteralNode(mod.value, "潜能"));
            break;
          }
          case "MAX_HP": {
            result.relic_rune_add.max_hp.addChild(new NumericLiteralNode(mod.value, "潜能"));
            break;
          }
          case "ATK": {
            result.relic_rune_add.atk.addChild(new NumericLiteralNode(mod.value, "潜能"));
            break;
          }
          case "DEF": {
            result.relic_rune_add.def.addChild(new NumericLiteralNode(mod.value, "潜能"));
            break;
          }
          case "ATTACK_SPEED": {
            result.relic_rune_add.attack_speed.addChild(new NumericLiteralNode(mod.value, "潜能"));
            break;
          }
          case "RESPAWN_TIME": {
            result.relic_rune_add.respawn_time.addChild(new NumericLiteralNode(mod.value, "潜能"));
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
        CalculatorHelper.analyzeBlackboard(bb, result, "模组属性加成");
      }
      // 天赋与特性效果
      // for (const part of uniEquip.parts) {
      //   for (const candidates of [
      //     part.overrideTraitDataBundle.candidates, // 特性
      //     part.addOrOverrideTalentDataBundle.candidates, // 天赋
      //   ]) {
      //     if (!candidates) continue;
      //     // 从多个candidate中选出符合潜能的
      //     const admittedTrait = candidates.findLast((item) => item.requiredPotentialRank <= charInput.potential);
      //     for (const bb of admittedTrait!.blackboard) {
      //       CalculatorHelper.analyzeBlackboard(bb, result, "模组天赋加成");
      //     }
      //   }
      // }
      // TODO 暂时由计算脚本固定写死这部分加成，后续需要在面板上展示（可切换）
    }
    return result;
  }

  /** 分析黑板数据(来自模组) */
  static analyzeBlackboard(bb: BlackboardData, result: BuffContext, tooltip: string) {
    switch (bb.key) {
      // TODO
      // case "damageScale": {
      //   result.damageScale += bb.value - 1;
      //   break;
      // }
      case "max_hp": {
        result.relic_rune_add.max_hp.addChild(new NumericLiteralNode(bb.value, tooltip));
        break;
      }
      case "atk": {
        result.relic_rune_add.atk.addChild(new NumericLiteralNode(bb.value, tooltip));
        break;
      }
    }
  }

  /**
   * 分析藏品加成
   * @param input 输入
   * @param input.charInput 角色输入
   * @param input.charData 角色数据
   * @param input.enemyData 敌人输入
   * @param input.relics 藏品
   */
  static analyzeRelics(
    input: {
      // charInput在计算敌人数据时难以获取，暂时不传入
      charInput?: CharInput;
      charData?: CharData;
      enemyData: EnemyData;
      relics: RelicWrapper[];
      stageData?: StageData;
    },
    context?: BuffContext,
  ) {
    const { charInput, charData, enemyData, relics } = input;
    const result: BuffContext = context ? context.clone() : CalculatorHelper.createAdditionContext();
    /** 用户修正属性 */
    if (charInput && charInput.attributeModifier.atkBase) {
      result.relic_rune_add.atk.addChild(new NumericLiteralNode(charInput.attributeModifier.atkBase, "属性修正"));
    }
    if (charInput && charInput.attributeModifier.atkPercent) {
      result.relic_rune_mul.atk.addChild(
        new NumericLiteralNode(charInput.attributeModifier.atkPercent / 100, "属性修正"),
      );
    }
    if (charInput && charInput.attributeModifier.atkFinal) {
      result.in_game_buff_final_add.atk.addChild(
        new NumericLiteralNode(charInput.attributeModifier.atkFinal, "属性修正"),
      );
    }
    /** 筛选藏品 */
    for (const relic of relics) {
      // 遍历藏品buff
      relic.relicData.buffs.forEach((buff) => {
        // 是否存在藏品黑板实现
        if (isRelicBlackboard(buff)) {
          const blackboard = getRelicBlackboard(buff, relic);
          // buff是否可以生效
          if (blackboard.isActive({ charData, charInput, enemyData, relics })) {
            // 生效 应用到上下文
            blackboard.apply({ context: result, relics });
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
        // 无干员数据时，默认生效 TODO
        if (!charData || !CalculatorHelper.isRelicForChar(buff, relic, charData)) {
          result.invalidRelics.push(relic);
          return;
        }
        commonRelicBlackboard.apply({ relic, context: result, buff, relics });
      });
    }

    result.global_buff_stack.damage_scale_phy.addChild(result.in_game_buff_final_mul.enemy_damage_scale_phy);

    result.global_buff_stack.damage_scale_mag.addChild(result.in_game_buff_final_mul.enemy_damage_scale_mag);

    result.global_buff_stack.damage_scale_pure.addChild(result.in_game_buff_final_mul.enemy_damage_scale_pure);

    return result;
  }

  /** 分析肉鸽难度加成 */
  static analyzeRogueDifficulty(
    input: { rogueInput: RogueInput; enemyData?: EnemyData },
    context: BuffContext,
  ): BuffContext {
    const { rogueInput, enemyData } = input;
    if (rogueInput.topic === "rogue_4") {
      /** 科技树加成 */
      const tech = parseFloat(rogueInput.rogue_4.tech);
      if (tech > 1) {
        context.relic_rune_mul.atk.addChild(new NumericLiteralNode((tech * 100 - 100) / 100, "科技树"));
        context.relic_rune_mul.def.addChild(new NumericLiteralNode((tech * 100 - 100) / 100, "科技树"));
        context.relic_rune_mul.max_hp.addChild(new NumericLiteralNode((tech * 100 - 100) / 100, "科技树"));
      }
      const { difficulty, thoughtLoad, zone } = rogueInput.rogue_4;
      if (difficulty === 18 && thoughtLoad === "CONFUSION") {
        context.relic_rune_mul.atk.addChild(new NumericLiteralNode(-0.2, "思绪混乱"));
        context.relic_rune_add.cost.addChild(new NumericLiteralNode(3, "思绪混乱"));
      }
      /** 肉鸽难度加成 */
      const enemyAttrMultipliers = [0, 0, 0, 0, 0, 1, 2, 3, 5, 6, 7, 8, 10, 13, 16, 20, 21, 22, 22];
      /** 肉鸽层数 */
      const zoneLayerMap: Record<string, number> = {
        zone_1: 1,
        zone_2: 2,
        zone_3: 3,
        zone_4: 4,
        zone_5: 5,
        zone_6: 6,
        zone_7: 6,
        zone_8: 7,
      };
      const enemyAttrMultiplier = enemyAttrMultipliers[difficulty];
      const zoneValue = zoneLayerMap[zone]!;
      // 根据肉鸽难度，计算敌人属性加成
      if (enemyAttrMultiplier) {
        const value = Math.pow(enemyAttrMultiplier / 100 + 1, zoneValue);
        context.in_game_buff_final_mul.enemy_atk.addChild(
          new NumericLiteralNode(value, `直面魂灵·${difficulty} | 每层加成${enemyAttrMultiplier}% | 层数${zoneValue}`),
        );
        context.in_game_buff_final_mul.enemy_max_hp.addChild(
          new NumericLiteralNode(value, `直面魂灵·${difficulty} | 每层加成${enemyAttrMultiplier}% | 层数${zoneValue}`),
        );
      }
      // 低难度下有加成
      if (difficulty <= 2) {
        const diff2Hp = [0.8, 0.85, 0.9];
        context.in_game_buff_final_mul.enemy_max_hp.addChild(
          new NumericLiteralNode(
            diff2Hp[difficulty],
            `直面魂灵·${difficulty} | 所有敌人生命值-${Math.round((1 - diff2Hp[difficulty]) * 100)}%`,
          ),
        );
      }
      /** <年代之刺>与<饮泣之刺>的最大生命值+20% */
      if (difficulty >= 4 && enemyData && ["trap_760_skztzs", "enemy_2073_skzrck"].includes(enemyData.id)) {
        context.in_game_buff_final_mul.enemy_max_hp.addChild(
          new NumericLiteralNode(1.2, `直面魂灵·4 | 年代之刺与饮泣之刺的最大生命值+20%`),
        );
      }
      /** 难度部分词条 精英和领袖敌人生命值+20% */
      if (difficulty >= 4 && enemyData && ["ELITE", "BOSS"].includes(parseDefinedData(enemyData.levelType))) {
        context.in_game_buff_final_mul.enemy_max_hp.addChild(
          new NumericLiteralNode(1.2, `直面魂灵·4 | 精英和领袖敌人生命值+20%`),
        );
      }
      /** 难度部分词条 精英和领袖敌人攻击力+10% */
      if (difficulty >= 7 && enemyData && ["ELITE", "BOSS"].includes(parseDefinedData(enemyData.levelType))) {
        context.in_game_buff_final_mul.enemy_atk.addChild(
          new NumericLiteralNode(1.1, `直面魂灵·7 | 精英和领袖敌人攻击力+10%`),
        );
      }
      if (difficulty >= 10 && enemyData && ["ELITE", "BOSS"].includes(parseDefinedData(enemyData.levelType))) {
        context.relic_rune_mul.enemy_damage_resistance.addChild(
          new NumericLiteralNode(0.1, `直面魂灵·10 | 精英及领袖敌人受到的物理与法术伤害降低10%`),
        );
      }
      /** N14大特血量加成 */
      if (difficulty >= 14 && enemyData && enemyData.id === "enemy_2081_skztxs") {
        context.in_game_buff_final_mul.enemy_max_hp.addChild(
          new NumericLiteralNode(1.5, `直面魂灵·14 | 特雷西斯，黑冠尊主的最大生命值提升至150%`),
        );
      }
      /** N15黑棺血量加成 */
      if (difficulty >= 15 && enemyData && enemyData.id === "enemy_2083_skzhg") {
        context.in_game_buff_final_mul.enemy_max_hp.addChild(
          new NumericLiteralNode(2, `直面魂灵·15 | “放逐的黑棺”的最大生命值提升至200%`),
        );
      }
    }
    return context;
  }

  /** 分析肉鸽主题特殊效果，例如萨卡兹的年代、萨米的密文板 */
  static analyzeTopicSpec(input: { topicSpecItems: ITopicSpecItem[]; enemyData?: EnemyData }, context: BuffContext) {
    const { topicSpecItems, enemyData } = input;
    topicSpecItems
      .filter((item) => item && item.userActive)
      .forEach((item) => {
        item.buffs.forEach((buff) => {
          const { key, value, selector } = buff;
          if (selector) {
            const [type, key, value] = selector.split(":");
            if (type === "enemy") {
              if (!enemyData) return;
              // 对特定敌人类型生效，如爆破对刺
              if (key === "id" && !value.split("|").includes(enemyData.id)) return;
              // 对特定敌人标签生效，如魔王年代对萨卡兹
              if (key === "tag" && !enemyData.enemyTags.m_value.includes(value)) return;
            }
          }
          switch (key) {
            case "atk":
              context.relic_rune_mul.atk.addChild(new NumericLiteralNode(value, item.name));
              break;
            case "attack_speed":
              context.in_game_buff_add.attack_speed.addChild(new NumericLiteralNode(value, item.name));
              break;
            case "max_hp":
              context.relic_rune_mul.max_hp.addChild(new NumericLiteralNode(value, item.name));
              break;
            case "enemy_max_hp":
              console.log(item.name, value);
              context.in_game_buff_final_mul.enemy_max_hp.addChild(new NumericLiteralNode(value, item.name));
              break;
            case "enemy_atk":
              context.in_game_buff_final_mul.enemy_atk.addChild(new NumericLiteralNode(value, item.name));
              break;
            default:
              break;
          }
        });
      });
    return context;
  }

  /** 分析敌人特殊词条 */
  static analyzeEnemySpec(input: { enemySpec: EnemySpec }, context: BuffContext) {
    const { enemySpec } = input;
    enemySpec.value.forEach((spec) => {
      const { key, value, label } = spec;
      switch (key) {
        case "enemy_damage_resistance":
          context.in_game_buff_final_mul.enemy_damage_resistance.addChild(new NumericLiteralNode(value, label));
          break;
        default:
          break;
      }
    });
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
      if (value.calculate() > 0) {
        result.out_game_char.push(parse(key, value.calculate()));
      }
    });
    Object.entries(context.relic_rune_mul).forEach(([key, value]) => {
      if (key === "enemy_damage_resistance") {
        if (value.calculate() === 0) {
          return;
        }
        result.enemy.push(`${allowedBlackboardKeyMap[key] || key}: ${Math.round(value.calculate() * 100)}%`);
        return;
      }
      if (value.calculate() !== 1) {
        result.out_game_char.push(
          `${allowedBlackboardKeyMap[key] || key}: ${CalculatorHelper.formatPercent(value.calculate())}`,
        );
      }
    });
    Object.entries(context.in_game_buff_add).forEach(([key, value]) => {
      if (value.calculate() > 0) {
        result.in_game_char.push(`局内${allowedBlackboardKeyMap[key] || key}: ${value.calculate()}`);
      }
    });
    Object.entries(context.in_game_buff_mul).forEach(([key, value]) => {
      if (value.calculate() !== 1) {
        result.in_game_char.push(
          `局内${allowedBlackboardKeyMap[key] || key}: ${CalculatorHelper.formatPercent(value.calculate())}`,
        );
      }
    });
    Object.entries(context.in_game_buff_final_mul).forEach(([key, value]) => {
      if (key === "enemy_damage_resistance") {
        if (value.calculate() === 0) {
          return;
        }
        result.enemy.push(`${allowedBlackboardKeyMap[key] || key}: ${Math.round(value.calculate() * 100)}%`);
        return;
      }
      const isEnemy = [
        "enemy_atk",
        "enemy_def_down",
        "enemy_max_hp",
        "enemy_damage_scale_phy",
        "enemy_damage_scale_mag",
        "enemy_damage_scale_pure",
        "enemy_damage_scale_ep",
        "enemy_damage_resistance",
      ].includes(key);
      if (!isEnemy && value.calculate() !== 1) {
        result.in_game_char.push(
          `最终乘算${allowedBlackboardKeyMap[key] || key}: ${CalculatorHelper.formatPercent(value.calculate())}`,
        );
      }
      if (isEnemy && value.calculate() !== 1) {
        // 减伤描述特殊
        if (key === "enemy_damage_resistance") {
          result.enemy.push(
            `局内${allowedBlackboardKeyMap[key] || key}: ${CalculatorHelper.formatPercent(value.calculate())}`,
          );
        } else {
          result.enemy.push(
            `${allowedBlackboardKeyMap[key] || key}: ${CalculatorHelper.formatPercent(value.calculate())}`,
          );
        }
      }
    });
    Object.entries(context.global_buff_stack).forEach(([key, value]) => {
      if (value.calculate() !== 1) {
        result.in_game_char.push(
          `${allowedBlackboardKeyMap[key] || key}: ${CalculatorHelper.formatPercent(value.calculate())}`,
        );
      }
    });
    return result;
  }

  /** 百分比数值显示 */
  static formatPercent(value: number): string {
    const percent = value * 100 - 100;
    const textValue = Math.sign(percent) === 1 ? percent : percent;
    return `${Math.round(textValue)}%`;
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
    CalculatorHelper.printAdditionContext(input.buffContext, input.relics);
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

  /**
   * 打印加成上下文
   * @param context
   * @param relics
   */
  static printAdditionContext(context: BuffContext, relics: RelicWrapper[]) {
    interface StringRow {
      藏品名称: string;
      rune_add?: string;
      rune_mul?: string;
      in_game_add?: string;
      in_game_mul?: string;
      in_game_final_add?: string;
      in_game_final_mul?: string;
    }
    interface ObjectRow {
      藏品名称: string;
      rune_add: string[];
      rune_mul: string[];
      in_game_add: string[];
      in_game_mul: string[];
      in_game_final_mul: string[];
      usage: string;
    }
    const flagLogMap: { [name: string]: StringRow } = {};
    const objectLogMap: { [name: string]: ObjectRow } = {};
    console.groupCollapsed("加成详细打印");

    console.log(context);
    console.log(flagLogMap);
    console.log(objectLogMap);

    context.relic_rune_add.def.children.forEach((node) => set_row("rune_add", `防御+${node.calculate()}`, node));
    context.relic_rune_add.attack_speed.children.forEach((node) =>
      set_row("rune_add", `攻速+${node.calculate()}`, node),
    );

    context.relic_rune_mul.max_hp.children.forEach((node) =>
      set_row("rune_mul", `血量*${toPercent(node.calculate())}`, node),
    );
    context.relic_rune_mul.atk.children.forEach((node) =>
      set_row("rune_mul", `攻击*${toPercent(node.calculate())}`, node),
    );
    context.relic_rune_mul.def.children.forEach((node) =>
      set_row("rune_mul", `防御*${toPercent(node.calculate())}`, node),
    );

    context.in_game_buff_add.attack_speed.children.forEach((node) =>
      set_row("in_game_add", `攻速+${node.calculate()}`, node),
    );

    context.in_game_buff_mul.atk.children.forEach((node) =>
      set_row("in_game_mul", `攻击*${toPercent(node.calculate())}`, node),
    );

    // 最终乘算
    context.in_game_buff_final_mul.enemy_max_hp.children.forEach((node) =>
      set_row("in_game_final_mul", `敌方血量*${toPercent(node.calculate())}`, node),
    );
    context.in_game_buff_final_mul.enemy_atk.children.forEach((node) =>
      set_row("in_game_final_mul", `敌方攻击*${toPercent(node.calculate())}`, node),
    );
    context.in_game_buff_final_mul.enemy_def.children.forEach((node) =>
      set_row("in_game_final_mul", `敌方防御*${toPercent(node.calculate())}`, node),
    );
    context.in_game_buff_final_mul.enemy_damage_scale_phy.children.forEach((node) =>
      set_row("in_game_final_mul", `敌方物理易伤*${toPercent(node.calculate())}`, node),
    );
    context.in_game_buff_final_mul.enemy_damage_scale_mag.children.forEach((node) =>
      set_row("in_game_final_mul", `敌方法术易伤*${toPercent(node.calculate())}`, node),
    );
    context.in_game_buff_final_mul.enemy_damage_scale_pure.children.forEach((node) =>
      set_row("in_game_final_mul", `敌方真伤易伤*${toPercent(node.calculate())}`, node),
    );
    context.in_game_buff_final_mul.enemy_damage_scale_pure.children.forEach((node) =>
      set_row("in_game_final_mul", `敌方真伤易伤*${toPercent(node.calculate())}`, node),
    );
    context.in_game_buff_final_mul.enemy_damage_scale_ep.children.forEach((node) =>
      set_row("in_game_final_mul", `敌方元素损伤*${toPercent(node.calculate())}`, node),
    );
    context.in_game_buff_final_mul.enemy_damage_resistance.children.forEach((node) =>
      set_row("in_game_final_mul", `敌方减伤*${toPercent(node.calculate())}`, node),
    );
    context.global_buff_stack.damage_scale_phy.children.forEach((node) =>
      set_row("in_game_final_mul", `物理增伤*${toPercent(node.calculate())}`, node),
    );
    context.global_buff_stack.damage_scale_mag.children.forEach((node) =>
      set_row("in_game_final_mul", `法术增伤*${toPercent(node.calculate())}`, node),
    );
    context.global_buff_stack.damage_scale_pure.children.forEach((node) =>
      set_row("in_game_final_mul", `真伤增伤*${toPercent(node.calculate())}`, node),
    );

    /** 转为百分比 */
    function toPercent(value: number): string {
      return `${(value * 100).toFixed()}%`;
    }

    function set_row(
      target: "rune_add" | "rune_mul" | "in_game_add" | "in_game_mul" | "in_game_final_mul",
      key: string,
      node: BaseNode,
    ) {
      if (!flagLogMap[node.tooltip]) {
        flagLogMap[node.tooltip] = { 藏品名称: node.tooltip };
        objectLogMap[node.tooltip] = {
          藏品名称: node.tooltip,
          rune_add: [],
          rune_mul: [],
          in_game_add: [],
          in_game_mul: [],
          in_game_final_mul: [],
          usage: "",
        };
      }
      flagLogMap[node.tooltip][target] = "√";
      objectLogMap[node.tooltip][target].push(key);
    }

    for (const relic of relics) {
      if (!flagLogMap[relic.name]) {
        flagLogMap[relic.name] = { 藏品名称: relic.name };
        objectLogMap[relic.name] = {
          藏品名称: relic.name,
          rune_add: [],
          rune_mul: [],
          in_game_add: [],
          in_game_mul: [],
          in_game_final_mul: [],
          usage: "",
        };
      }
      objectLogMap[relic.name].usage = relic.usage;
    }
    console.table(
      Object.values(objectLogMap).map((row) => {
        return {
          藏品名称: row.藏品名称,
          局外加算: row.rune_add.join("|"),
          局外乘算: row.rune_mul.join("|"),
          直接加算: row.in_game_add.join("|"),
          直接乘算: row.in_game_mul.join("|"),
          最终乘算: row.in_game_final_mul.join("|"),
          描述: row.usage,
        };
      }),
    );

    console.groupEnd();
  }
}

/** 局外攻击力公式 */
export function getOutAtkExpression(baseAtk: number, context: BuffContext) {
  return new ExpressionGroupNode("*", "局外攻击力")
    .addChild(
      new ExpressionGroupNode("+", "局外加成")
        .addChild(new NumericLiteralNode(baseAtk, "基础攻击力"))
        .addChild(...context.relic_rune_add.atk.children),
    )
    .addChild(context.relic_rune_mul.atk);
}

/** 局内攻击力公式 */
export function getInGameAtkExpression(baseAtk: number, context: BuffContext) {
  const outAtkExpression = getOutAtkExpression(baseAtk, context);

  const atk = new ExpressionGroupNode("*", "直接乘算")
    .addChild(
      new ExpressionGroupNode("+", "直接加算")
        .addChild(outAtkExpression)
        .addChild(...context.in_game_buff_add.atk.children),
    )
    .addChild(context.in_game_buff_mul.atk);

  return new ExpressionGroupNode("*", "最终乘算")
    .addChild(
      new ExpressionGroupNode("+", "最终加算").addChild(atk).addChild(...context.in_game_buff_final_add.atk.children),
    )
    .addChild(...context.in_game_buff_final_mul.atk.children);
}
