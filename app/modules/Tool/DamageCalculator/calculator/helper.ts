import type { CalculatorInput, CalculatorOutput, CharData, DamageByType, RelicWrapper } from "~/types/gameData";
import {
  inGameRelicNames,
  isBlackboardActive,
  isRelicActive,
  applyBlackboard,
  allowedBlackboardKeyMap,
} from "../utils";

/** 藏品加成 */
interface RelicBuff extends Record<string, number> {
  /** 攻击力(百分比) */
  atk: number;
}

/** 藏品分析结果 */
interface RelicAnalysisResult {
  /** 不生效的藏品 */
  invalidRelics: RelicWrapper[];
  /** 局外生效藏品 */
  relics: RelicWrapper[];
  /** 局内生效藏品 */
  relicsInGame: RelicWrapper[];
  /** 局外加成 */
  relicsBuff: RelicBuff;
  /** 局内加成 */
  relicsInGameBuff: RelicBuff;
}

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

  /** 创建空的藏品加成结构 */
  static createRelicBuff(): RelicBuff {
    return {
      atk: 0,
    };
  }

  /**
   * 分析藏品
   * @deprecated 还不能用
   */
  static analyzeRelics(charData: CharData, relics: RelicWrapper[]) {
    const result: RelicAnalysisResult = {
      invalidRelics: [],
      relics: [],
      relicsInGame: [],
      relicsBuff: CalculatorHelper.createRelicBuff(),
      relicsInGameBuff: CalculatorHelper.createRelicBuff(),
    };
    // 筛选局内局外藏品
    for (const relic of relics) {
      // 藏品在黑名单中
      if (!isRelicActive(relic.name)) {
        result.invalidRelics.push(relic);
        continue;
      }
      // 过滤对干员不生效的buff, 放入无效藏品
      const activeBuffs = relic.relicData.buffs.filter((buff) => isBlackboardActive(buff, charData));
      // 没有对干员生效的buff, 放入无效藏品
      if (activeBuffs.length === 0) {
        result.invalidRelics.push(relic);
        continue;
      }
      // 藏品在局内
      if (inGameRelicNames.includes(relic.name)) {
        result.relicsInGame.push(relic);
      } else {
        // 局外藏品
        result.relics.push(relic);
      }
    }
    // 计算局外加成
    for (const relic of result.relics) {
      const relicBuff = CalculatorHelper.sumRelicBuff(charData, relic);
      for (const key in relicBuff) {
        result.relicsBuff[key] = (result.relicsBuff[key] || 0) + relicBuff[key];
      }
    }
    // 计算局内加成
    for (const relic of result.relicsInGame) {
      const relicBuff = CalculatorHelper.sumRelicBuff(charData, relic);
      for (const key in relicBuff) {
        result.relicsInGameBuff[key] = (result.relicsInGameBuff[key] || 0) + relicBuff[key];
      }
    }
    return result;
  }

  /** 合计藏品buff */
  static sumRelicBuff(charData: CharData, relic: RelicWrapper): RelicBuff {
    const result = CalculatorHelper.createRelicBuff();
    // 过滤对干员不生效的buff
    const activeBuffs = relic.relicData.buffs.filter((buff) => isBlackboardActive(buff, charData));

    for (const buff of activeBuffs) {
      applyBlackboard(buff, result);
    }
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
    CalculatorHelper.printRelicAnalysisResult(CalculatorHelper.analyzeRelics(input.charData, input.relics));
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
    const { relicsBuff, relicsInGameBuff } = result;
    console.groupCollapsed("查看加成结果");
    console.log("不生效的藏品", result.invalidRelics);
    console.log("局外藏品", result.relics);
    console.log("局内藏品", result.relicsInGame);
    console.log("局外加成", result.relicsBuff);
    console.log("局内加成", result.relicsInGameBuff);
    const map: Record<string, { 局外: number; 局内: number; 敌人: number }> = {};
    Object.entries(relicsBuff).forEach(([key, value]) => {
      map[key] = {
        局外: value,
        局内: 0,
        敌人: 0,
      };
    });
    Object.entries(relicsInGameBuff).forEach(([key, value]) => {
      map[key].局内 = value;
    });
    const btd = Object.entries(map).map(([key, value]) => ({
      类型: allowedBlackboardKeyMap[key],
      局外: value.局外,
      局内: value.局内,
      敌人: value.敌人,
    }));
    console.table(btd);
    console.groupEnd();
  }
}
