import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { getCalculatorImpl } from "./impls";

/**
 * 伤害计算器总入口
 * @param input 输入数据
 * @returns 输出数据
 */
export function calculator(input: CalculatorInput): CalculatorOutput {
  // 获取干员计算器实现
  const impl = getCalculatorImpl(input.charData.appellation);
  return impl(input);
}
