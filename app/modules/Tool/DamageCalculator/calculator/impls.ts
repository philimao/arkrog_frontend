import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";

const implMap = new Map<string, (input: CalculatorInput) => CalculatorOutput>();

export type CalculatorImpl = (input: CalculatorInput) => CalculatorOutput;

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
    throw new Error(`没有干员 ${name} 的计算器实现`);
  }
  return impl;
}
