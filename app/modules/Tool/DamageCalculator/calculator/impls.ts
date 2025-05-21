import type {
  BlackboardData,
  CalculatorInput,
  CalculatorOutput,
  RelicBuff,
  RelicWrapper,
  CharData,
  CharInput,
  EnemyInput,
} from "~/types/gameData";
import type { BuffContext } from "./buff-context";
import { CalculatorHelper } from "./helper";

export type CalculatorImpl = (input: CalculatorInput) => CalculatorOutput;
export type RelicBlackboard = {
  isActive: (input: {
    charInput: CharInput;
    charData: CharData;
    enemyInput: EnemyInput;
    relics: RelicWrapper[];
  }) => boolean;
  apply(context: BuffContext): void;
};
const implMap = new Map<string, CalculatorImpl>();
const relicBlackboardMap = new Map<string, (buff: RelicBuff, relic: RelicWrapper) => RelicBlackboard>();
/**
 * 注册干员计算器实现
 * @param name 干员名称
 * @param impl 计算器实现
 */
export function registerCalculatorImpl(name: string, impl: CalculatorImpl) {
  implMap.set(name, impl);
}

/**
 * 获取干员计算器实现
 * @param name 干员名称
 * @returns 计算器实现
 */
export function getCalculatorImpl(name: string): CalculatorImpl {
  const impl = implMap.get(name);
  if (!impl) {
    console.warn(`干员 ${name} 的计算器实现为空`);
    return () => {
      console.warn(`干员 ${name} 的计算器实现为空`);
      return CalculatorHelper.createCalculatorOutput();
    };
  }
  return impl;
}

/** 注册藏品黑板 */
export function registerRelicBlackboard(key: string, apply: (buff: RelicBuff, relic: RelicWrapper) => RelicBlackboard) {
  relicBlackboardMap.set(key, apply);
}

/** 获取藏品黑板 */
export function getRelicBlackboard(buff: RelicBuff, relic: RelicWrapper): RelicBlackboard {
  const key = buff.blackboard.find((b) => b.key === "key")?.valueStr || "char";
  const relicBlackboard = relicBlackboardMap.get(key);
  if (!relicBlackboard) {
    // console.warn(`没有藏品黑板 ${key}`);
    return {
      isActive: () => true,
      apply(context: BuffContext): void {},
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
