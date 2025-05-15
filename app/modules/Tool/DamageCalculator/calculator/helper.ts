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
} from "~/types/gameData";
import { isRelicActive, applyAttrModifiers, applyBlackboardData } from "../utils";
import { BUFF_KEYS } from "./constant";

/** 藏品分析结果 */
interface RelicAnalysisResult {
  /** 不生效的藏品 */
  invalidRelics: RelicWrapper[];
  /** 藏品分类 */
  categories: {
    /** 藏品rune 加算 */
    relic_rune_add: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 藏品rune 乘算 */
    relic_rune_mul: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 全局Buff 直接加算 */
    global_buff_add: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 全局Buff 直接乘算 */
    global_buff_mul: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 全局Buff 最终加算 */
    global_buff_final_add: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 全局Buff 最终乘算 */
    global_buff_final_mul: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 全局Buff 堆叠 */
    global_buff_stack: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 战斗无关 */
    other: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
  };
  /** 藏品rune 加算 */
  relic_rune_add: {
    /** 攻击力 */
    atk: number;
    /** 攻击速度 */
    attack_speed: number;
    /** 防御力 */
    def: number;
    /** 攻击力来源 */
    atk_source: Array<{ name: string; usage: string; buff: RelicBuff; relic: RelicWrapper }>;
    /** 攻击速度来源 */
    attack_speed_source: Array<{ name: string; usage: string; buff: RelicBuff; relic: RelicWrapper }>;
    /** 防御力来源 */
    def_source: Array<{ name: string; usage: string; buff: RelicBuff; relic: RelicWrapper }>;
  };
  /** 藏品rune 乘算 */
  relic_rune_mul: {
    /** 攻击力(百分比) */
    atk: number;
    /** 防御力(百分比) */
    def: number;
    /** 最大生命值(百分比) */
    max_hp: number;
    /** 攻击力来源 */
    atk_source: Array<{ name: string; usage: string; buff?: RelicBuff; relic?: RelicWrapper }>;
    /** 防御力来源 */
    def_source: Array<{ name: string; usage: string; buff?: RelicBuff; relic?: RelicWrapper }>;
    /** 最大生命值来源 */
    max_hp_source: Array<{ name: string; usage: string; buff?: RelicBuff; relic?: RelicWrapper }>;
  };
  /** 全局Buff 直接加算 */
  global_buff_add: {
    /** 攻击力 */
    atk: number;
    /** 攻击力来源 */
    atk_source: Array<{ name: string; usage: string; buff: RelicBuff; relic: RelicWrapper }>;
  };
  /** 全局Buff 直接乘算 */
  global_buff_mul: {
    /** 攻击力 */
    atk: number;
    /** 攻击力来源 */
    atk_source: Array<{ name: string; usage: string; buff: RelicBuff; relic: RelicWrapper }>;
  };
  /** 全局Buff 最终加算 */
  global_buff_final_add: {
    /** 攻击力 */
    atk: number;
    /** 攻击力来源 */
    atk_source: Array<{ name: string; usage: string; buff: RelicBuff; relic: RelicWrapper }>;
  };
  /** 全局Buff 最终乘算 */
  global_buff_final_mul: {
    /** 攻击力 */
    atk: number;
    /** 攻击力来源 */
    atk_source: Array<{ name: string; usage: string; buff: RelicBuff; relic: RelicWrapper }>;
  };
  /** 全局Buff 堆叠 */
  global_buff_stack: {
    damage_scale: number;
  };
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

  /** 计算局外面板 */
  static calculatePanel(charInput: CharInput, charData: CharData, relics: RelicWrapper[]): CharAttributeExt {
    const analysisResult = CalculatorHelper.analyzeRelics({ tech: charInput.tech, charData, relics });
    // 获取精英化等级属性
    const attribute = charInput.phase?.attributesKeyFrames[charInput.level].data; // TODO 去掉?

    const result = { ...attribute, damageScale: 1 } as CharAttributeExt;
    const consoleData = [];
    consoleData.push({ type: "基础属性", ...result });

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
    consoleData.push({ type: "应用信赖效果", ...result });

    /** 应用潜能效果 */
    for (const pot of charData.potentialRanks.slice(0, charInput.potential)) {
      pot.buff?.attributes.attributeModifiers.forEach((mod) => applyAttrModifiers(mod, result));
    }
    consoleData.push({ type: "应用潜能效果", ...result });

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
    consoleData.push({ type: "应用模组效果", ...result });

    /** 应用局外加成(加算) */
    result.atk += analysisResult.relic_rune_add.atk;
    result.attackSpeed += analysisResult.relic_rune_add.attack_speed;
    result.def += analysisResult.relic_rune_add.def;
    consoleData.push({ type: "应用局外加成(加算)", ...result });

    /** 应用局外加成(乘算) */
    result.atk = Math.round(result.atk * analysisResult.relic_rune_mul.atk);
    result.def = Math.round(result.def * analysisResult.relic_rune_mul.def);
    result.maxHp = Math.round(result.maxHp * analysisResult.relic_rune_mul.max_hp);
    consoleData.push({ type: "应用局外加成(乘算)", ...result });

    console.table(consoleData);
    return result;
  }

  /**
   * 分析藏品
   * @param input 输入
   * @param input.tech 科技等级
   * @param input.charData 角色数据
   * @param input.relics 藏品
   * @deprecated 还不能用
   */
  static analyzeRelics(input: { tech: number; charData: CharData; relics: RelicWrapper[] }) {
    const { tech, charData, relics } = input;
    const result: RelicAnalysisResult = {
      invalidRelics: [],
      categories: {
        relic_rune_add: [],
        relic_rune_mul: [],
        global_buff_add: [],
        global_buff_mul: [],
        global_buff_final_add: [],
        global_buff_final_mul: [],
        global_buff_stack: [],
        other: [],
      },
      relic_rune_add: {
        atk: 0,
        atk_source: [],
        attack_speed: 0,
        attack_speed_source: [],
        def: 0,
        def_source: [],
      },
      relic_rune_mul: {
        atk: 1,
        def: 1,
        max_hp: 1,
        atk_source: [],
        def_source: [],
        max_hp_source: [],
      },
      global_buff_add: {
        atk: 0,
        atk_source: [],
      },
      global_buff_mul: {
        atk: 1,
        atk_source: [],
      },
      global_buff_final_add: {
        atk: 0,
        atk_source: [],
      },
      global_buff_final_mul: {
        atk: 1,
        atk_source: [],
      },
      global_buff_stack: {
        damage_scale: 1,
      },
    };
    // 科技树加成
    if (tech > 1) {
      result.relic_rune_mul.atk += tech - 1;
      result.relic_rune_mul.atk_source.push({ name: "科技树", usage: "科技树加成" });
      result.relic_rune_mul.def += tech - 1;
      result.relic_rune_mul.def_source.push({ name: "科技树", usage: "科技树加成" });
      result.relic_rune_mul.max_hp += tech - 1;
      result.relic_rune_mul.max_hp_source.push({ name: "科技树", usage: "科技树加成" });
    }
    // 筛选藏品
    for (const relic of relics) {
      // 藏品在黑名单中
      if (!isRelicActive(relic.name)) {
        result.invalidRelics.push(relic);
        continue;
      }
      // 藏品rune 加算
      relic.relicData.buffs.forEach((buff) => {
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
          result.categories.other.push({ buff, relic });
        }
      });
    }
    // 计算藏品rune 加算
    result.categories.relic_rune_add.forEach(({ buff, relic }) => {
      const blackboard = CalculatorHelper.analyzeRelic(charData, buff);
      if (blackboard.key !== "char") {
        return;
      }
      if (blackboard.atk) {
        result.relic_rune_add.atk += blackboard.atk;
        result.relic_rune_add.atk_source.push({ buff, relic, usage: relic.relicData.usage, name: relic.name });
      }
      if (blackboard.attack_speed) {
        result.relic_rune_add.attack_speed += blackboard.attack_speed * relic.layer;
        result.relic_rune_add.attack_speed_source.push({
          buff,
          relic,
          usage: relic.relicData.usage,
          name: relic.name,
        });
      }
      if (blackboard.def) {
        result.relic_rune_add.def += blackboard.def;
        result.relic_rune_add.def_source.push({ buff, relic, usage: relic.relicData.usage, name: relic.name });
      }
    });
    // 计算藏品rune 乘算
    result.categories.relic_rune_mul.forEach(({ buff, relic }) => {
      const blackboard = CalculatorHelper.analyzeRelic(charData, buff);
      if (result.relic_rune_mul.atk) {
        result.relic_rune_mul.atk *= blackboard.atk;
        result.relic_rune_mul.atk_source.push({ buff, relic, usage: relic.relicData.usage, name: relic.name });
      }
    });
    // 计算全局Buff 直接加算
    result.categories.global_buff_add.forEach(({ buff, relic }) => {
      const blackboard = CalculatorHelper.analyzeRelic(charData, buff);
      if (result.global_buff_add.atk) {
        result.global_buff_add.atk += blackboard.atk;
        result.global_buff_add.atk_source.push({ buff, relic, usage: relic.relicData.usage, name: relic.name });
      }
    });
    // 计算全局Buff 直接乘算
    result.categories.global_buff_mul.forEach(({ buff, relic }) => {
      const blackboard = CalculatorHelper.analyzeRelic(charData, buff);
      if (result.global_buff_mul.atk) {
        result.global_buff_mul.atk *= blackboard.atk;
        result.global_buff_mul.atk_source.push({ buff, relic, usage: relic.relicData.usage, name: relic.name });
      }
    });
    // 计算全局Buff 最终加算
    result.categories.global_buff_final_add.forEach(({ buff, relic }) => {
      const blackboard = CalculatorHelper.analyzeRelic(charData, buff);
      if (result.global_buff_final_add.atk) {
        result.global_buff_final_add.atk += blackboard.atk;
        result.global_buff_final_add.atk_source.push({ buff, relic, usage: relic.relicData.usage, name: relic.name });
      }
    });
    // 计算全局Buff 最终乘算
    result.categories.global_buff_final_mul.forEach(({ buff, relic }) => {
      const blackboard = CalculatorHelper.analyzeRelic(charData, buff);
      if (result.global_buff_final_mul.atk) {
        result.global_buff_final_mul.atk *= blackboard.atk;
        result.global_buff_final_mul.atk_source.push({ buff, relic, usage: relic.relicData.usage, name: relic.name });
      }
    });

    return result;
  }

  static analyzeRelic(charData: CharData, buff: RelicBuff) {
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
    } = {
      key: "char",
      atk: 0,
      attack_speed: 0,
      def: 0,
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
    });
    return blackboard;
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
      CalculatorHelper.analyzeRelics({ tech: input.charInput.tech, charData: input.charData, relics: input.relics }),
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

  static printRelicAnalysisResult(result: RelicAnalysisResult) {
    console.groupCollapsed("查看加成结果");
    console.log(result);
    console.log("藏品rune 加算", result.relic_rune_add);
    console.log("藏品rune 乘算", result.relic_rune_mul);
    console.log("全局Buff 直接加算", result.global_buff_add);
    console.log("全局Buff 直接乘算", result.global_buff_mul);
    console.log("全局Buff 最终加算", result.global_buff_final_add);
    console.log("全局Buff 最终乘算", result.global_buff_final_mul);
    console.log("全局Buff 堆叠", result.global_buff_stack);
    const btd = [
      {
        计算方式: "局外加算",
        攻击力: result.relic_rune_add.atk,
        攻击速度: result.relic_rune_add.attack_speed,
        防御力: result.relic_rune_add.def,
      },
      { 计算方式: "局外乘算", 攻击力: result.relic_rune_mul.atk },
      { 计算方式: "局内直接加算", 攻击力: result.global_buff_add.atk },
      { 计算方式: "局内直接乘算", 攻击力: result.global_buff_mul.atk },
      { 计算方式: "局内最终加算", 攻击力: result.global_buff_final_add.atk },
      { 计算方式: "局内最终乘算", 攻击力: result.global_buff_final_mul.atk },
      { 计算方式: "全局Buff 堆叠", 攻击力: result.global_buff_stack },
    ];
    console.table(btd);
    console.groupEnd();
  }
}
