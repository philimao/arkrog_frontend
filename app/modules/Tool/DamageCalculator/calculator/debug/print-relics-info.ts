import type { CalculatorInput, RelicWrapper } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { getRelicBlackboard, isRelicBlackboard } from "../impls";
import { commonCharRelicBlackboard } from "../blackboard";

/**
 * 打印藏品信息
 */
export function printRelicsInfo(input: CalculatorInput) {
  const context = applyAnyRelics(input.relics);
  CalculatorHelper.printAdditionContext(context, input.relics);
}

/**
 * 不执行藏品生效条件去生效所有藏品buff
 */
export function applyAnyRelics(relics: RelicWrapper[]) {
  const context = CalculatorHelper.createAdditionContext();
  for (const relic of relics) {
    for (const buff of relic.relicData.buffs) {
      const key = buff.blackboard.find((b) => b.key === "key")?.valueStr;
      if (isRelicBlackboard(buff)) {
        const relicBlackboard = getRelicBlackboard(buff, relic);
        relicBlackboard.apply({ context, relics: relics });
      } else if (!key) {
        // TODO 需要区分敌人的通用黑板
        commonCharRelicBlackboard.apply({ context, relics: relics, buff: buff, relic: relic });
      }
    }
  }
  return context;
}
