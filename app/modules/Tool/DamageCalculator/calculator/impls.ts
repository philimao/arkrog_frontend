import type {
  BlackboardData,
  CalculatorInput,
  CalculatorOutput,
  RelicBuff,
  RelicWrapper,
  CharData,
  StageData,
  EnemyData,
  CharInput,
} from "~/types/gameData";
import type { BuffContext } from "./buff-context";
import { CalculatorHelper } from "./helper";
import type { CharState } from "~/stores/damageCalculator/calcTypes";

/** 干员计算器实现 */
export type CalculatorImpl = (input: CalculatorInput) => CalculatorOutput;
/** 天赋应用输入 */
export type ApplyTalentInput = { charInput: CharInput };
/** 天赋应用函数 */
export type ApplyTalentFC = (input: ApplyTalentInput, context: BuffContext) => void;
/** 技能应用输入 */
export type ApplySkillInput = { charInput: CharInput };
/** 技能应用函数 */
export type ApplySkillFC = (input: ApplySkillInput, context: BuffContext) => void;

/** 干员计算器实现 */
export interface CharImpl {
  calculator: CalculatorImpl;
  applyTalent: ApplyTalentFC;
  applySkill: ApplySkillFC;
}
/** 干员藏品黑板应用输入 */
export type CharRelicBlackboardInput = {
  buff: RelicBuff;
  relic: RelicWrapper;
  stageData?: StageData;
  charData?: CharData;
};
/** 敌人藏品黑板应用输入 */
export type EnemyRelicBlackboardInput = {
  buff: RelicBuff;
  relic: RelicWrapper;
  enemyData: EnemyData;
};
/** 藏品黑板应用输入 */
export type RelicBlackboardApplyInput = {
  buff: RelicBuff;
  relic: RelicWrapper;
  context: BuffContext;
  relics: RelicWrapper[];
};
/** 藏品黑板实现 */
export type RelicBlackboard = {
  isActive: (input: {
    charState?: CharState;
    charData?: CharData;
    enemyData?: EnemyData;
    relics: RelicWrapper[];
  }) => boolean;
  apply(input: { context: BuffContext; relics: RelicWrapper[] }): void;
};
const implMap = new Map<string, CharImpl>();
const relicBlackboardMap = new Map<string, (buff: RelicBuff, relic: RelicWrapper) => RelicBlackboard>();
/**
 * 注册干员计算器实现
 * @param name 干员名称
 * @param impl 计算器实现
 */
export function registerCalculatorImpl(name: string, impl: CharImpl) {
  implMap.set(name, impl);
}

export function getCharImpl(name: string): CharImpl {
  const impl = implMap.get(name);
  if (!impl) {
    return {
      calculator: () => CalculatorHelper.createCalculatorOutput(),
      applyTalent: (input) => {
        console.warn(`[${input.charInput.name}] 未实现天赋buff应用`);
      },
      applySkill: (input) => {
        console.warn(`[${input.charInput.name}] 未实现技能buff应用`);
      },
    };
  }
  return impl;
}

/**
 * 获取干员计算器实现
 * @param name 干员名称
 * @returns 计算器实现
 */
export function getCalculatorImpl(name: string): CalculatorImpl {
  const impl = implMap.get(name);
  if (!impl || !impl.calculator) {
    console.warn(`干员 ${name} 的计算器实现为空`);
    return () => {
      console.warn(`干员 ${name} 的计算器实现为空`);
      return CalculatorHelper.createCalculatorOutput();
    };
  }
  return impl.calculator;
}

/** 注册藏品黑板 */
export function registerRelicBlackboard(key: string, apply: (buff: RelicBuff, relic: RelicWrapper) => RelicBlackboard) {
  relicBlackboardMap.set(key, apply);
}

/** 获取藏品黑板 */
export function getRelicBlackboard(buff: RelicBuff, relic: RelicWrapper): RelicBlackboard {
  // key为char时代表什么？没有注册 TODO
  const key = buff.blackboard.find((b) => b.key === "key")?.valueStr || "char";
  const relicBlackboard = relicBlackboardMap.get(key);
  if (!relicBlackboard) {
    // console.warn(`没有藏品黑板 ${key}`);
    return {
      isActive: () => true,
      apply(): void {},
    };
  }
  return relicBlackboard(buff, relic);
}

/** 是否存在藏品黑板 */
export function isRelicBlackboard(buff: RelicBuff): boolean {
  const key = buff.blackboard.find((b) => b.key === "key")?.valueStr || "char";
  return relicBlackboardMap.has(key);
}

export function getByKeySafe(blackboard: BlackboardData[], key: string): BlackboardData {
  const data = blackboard.find((b) => b.key === key);
  if (!data) {
    throw new Error(`没有找到黑板数据 ${key}`, { cause: blackboard });
  }
  return data;
}

export function getByKey(blackboard: BlackboardData[], key: string): BlackboardData | undefined {
  return blackboard.find((b) => b.key === key);
}
