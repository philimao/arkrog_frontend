#!/usr/bin/env node
/**
 * docs-gen.mjs — 清单文档生成器统一入口
 *
 * 按参数分发到 scripts/docs-gen/ 下的模块生成器：
 *   node scripts/docs-gen.mjs                     全量（伤害计算器 + 无藏收录）
 *   node scripts/docs-gen.mjs damage-calculator   仅伤害计算器 → app/modules/Tool/DamageCalculator/docs/generated/
 *   node scripts/docs-gen.mjs relic-free          仅无藏收录   → app/modules/RelicFree/docs/generated/
 *
 * 对应 npm script：pnpm docs:gen / docs:gen:damage-calculator / docs:gen:relic-free。
 *
 * 约束：纯 Node（>=20）、零依赖、输出确定性（不写时间戳）。
 * 共享提取/输出辅助在 scripts/docs-gen/lib.mjs；新模块注册步骤见 docs/doc-generation.md。
 */

import { runDamageCalculator } from "./docs-gen/damage-calculator.mjs";
import { runRelicFree } from "./docs-gen/relic-free.mjs";

const MODULES = {
  "damage-calculator": runDamageCalculator,
  "relic-free": runRelicFree,
};

const arg = process.argv[2];
try {
  if (arg === undefined) {
    for (const run of Object.values(MODULES)) run();
  } else if (MODULES[arg]) {
    MODULES[arg]();
  } else {
    throw new Error(`未知模块 "${arg}"（可用：${Object.keys(MODULES).join("、")}；不带参数为全量生成）`);
  }
} catch (err) {
  console.error(`[docs-gen] 失败：${err.message}`);
  process.exitCode = 1;
}
