import type { CalculatorInput, RelicDataExt, RelicWrapper } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { getRelicBlackboard, isRelicBlackboard } from "../impls";
import { commonCharRelicBlackboard, commonEnemyRelicBlackboard } from "../blackboard";
import { isBuffForEnemy, isRelicInBlacklist } from "../../utils";

/**
 * 打印藏品信息 @deprecated applyAnyRelics无法判断藏品是否生效，可能存在多个buff同时生效的情况，仅能用于判断藏品是否实现黑板
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
    if (isRelicInBlacklist(relic.name)) {
      context.invalidRelics.push(relic);
      continue;
    }
    for (const buff of relic.buffs) {
      // 该buff有专用的黑板实现
      if (isRelicBlackboard(buff)) {
        const relicBlackboard = getRelicBlackboard(buff);
        relicBlackboard.apply({ context, relics, buff, relic });
      } else if (isBuffForEnemy(buff)) {
        commonEnemyRelicBlackboard.apply({ context, relics: relics, buff: buff, relic: relic });
      } else {
        commonCharRelicBlackboard.apply({ context, relics: relics, buff: buff, relic: relic });
      }
    }
  }
  return context;
}
