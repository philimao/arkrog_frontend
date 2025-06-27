import type { CalculatorInput, RelicDataExt, RelicWrapper } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { getRelicBlackboard, isRelicBlackboard } from "../impls";
import { commonCharRelicBlackboard, commonEnemyRelicBlackboard } from "../blackboard";
import { isBuffForEnemy } from "../../utils";

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
export function applyAnyRelics(relics: (RelicDataExt & RelicWrapper)[]) {
  const context = CalculatorHelper.createAdditionContext();
  for (const relic of relics) {
    for (const buff of relic.buffs) {
      const key = buff.blackboard.find((b) => b.key === "key")?.valueStr;
      // 该buff有专用的黑板实现
      if (isRelicBlackboard(buff)) {
        const relicBlackboard = getRelicBlackboard(buff, relic);
        relicBlackboard.apply({ context, relics: relics });
      } else if (isBuffForEnemy(buff)) {
        commonEnemyRelicBlackboard.apply({ context, relics: relics, buff: buff, relic: relic });
      } else if (!key) {
        commonCharRelicBlackboard.apply({ context, relics: relics, buff: buff, relic: relic });
      }
    }
  }
  return context;
}
