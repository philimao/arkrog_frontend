import type { CalculatorInput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { getRelicBlackboard, isRelicBlackboard } from "../impls";
import { commonRelicBlackboard } from "../blackboard";

/**
 * 打印藏品信息
 */
export function printRelicsInfo(input: CalculatorInput) {
  const context = CalculatorHelper.createAdditionContext();
  for (const relic of input.relics) {
    for (const buff of relic.relicData.buffs) {
      const key = buff.blackboard.find((b) => b.key === "key")?.valueStr;
      if (isRelicBlackboard(buff)) {
        const relicBlackboard = getRelicBlackboard(buff, relic);
        relicBlackboard.apply({ context, relics: input.relics });
      } else if (!key) {
        commonRelicBlackboard.apply({ context, relics: input.relics, buff: buff, relic: relic });
      } else {
        context.invalidRelics.push(relic);
      }
    }
  }
  CalculatorHelper.printAdditionContext(context, input.relics);
}
