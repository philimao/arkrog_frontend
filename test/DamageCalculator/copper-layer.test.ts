/**
 * 回归测试：通宝层数（"共计投出"）应线性放大其增益。
 * 验证 analyzeTopicSpec → applyRelic → commonCharRelicBlackboard 正确读取 item.layer
 * （通宝走 topicSpec 路径，与藏品的 relic.layer 同一套层数语义）。
 * 自构造数据、不依赖上游解包，确定性，纳入常规 yarn test。
 */
import { test, expect, beforeAll } from "vitest";
import { CalculatorHelper } from "~/modules/Tool/DamageCalculator/calculator/helper";

beforeAll(() => {
  // 压制 debugRelic 的 console 输出
  const noop = () => {};
  console.log = noop;
  console.group = noop;
  console.groupCollapsed = noop;
  console.groupEnd = noop;
});

/** 构造一个"每层 +20% 攻击"的通宝（武人之争式：layer_char_attribute_mul） */
function makeCopper(layer: number) {
  return {
    id: "rogue_5_copper_test",
    name: "通宝层数测试",
    userActive: true,
    layer,
    buffs: [
      {
        key: "layer_char_attribute_mul",
        blackboard: [{ key: "atk", value: 0.2, valueStr: null }],
      },
    ],
  } as any;
}

function atkMulOf(layer: number): number {
  const context = CalculatorHelper.createAdditionContext();
  CalculatorHelper.analyzeTopicSpec({ topicSpecItems: [makeCopper(layer)] }, context);
  return context.relic_rune_mul.atk.calculate();
}

test("通宝层数线性放大增益", () => {
  // 局外乘区为 "+ 基数1"：1 层 → 1 + 0.2 = 1.2；3 层 → 1 + 0.6 = 1.6
  expect(atkMulOf(1)).toBeCloseTo(1.2, 6);
  expect(atkMulOf(3)).toBeCloseTo(1.6, 6);
  expect(atkMulOf(5)).toBeCloseTo(2.0, 6);
});
