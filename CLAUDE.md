---
last-verified: 2026-06-11
sources:
  - package.json
  - README.md
  - app/modules/Tool/DamageCalculator/calculator/index.ts
  - app/modules/Tool/DamageCalculator/calculator/impls.ts
  - app/modules/Tool/DamageCalculator/calculator/blackboard.ts
  - app/modules/Tool/DamageCalculator/calculator/buff-context.ts
  - app/modules/Tool/DamageCalculator/calculator/simulate/random-probability.ts
  - app/modules/Tool/DamageCalculator/utils.ts
  - app/stores/wasmStore.ts
  - test/DamageCalculator/index.test.ts
---

# CLAUDE.md

## 项目速述

明日方舟集成战略（肉鸽）工具站前端：React Router 7 + zustand(immer) + vitest，核心模块是伤害计算器（`app/modules/Tool/DamageCalculator/`）。
伤害计算 **100% 为纯 TypeScript**（`calculator/calculator.ts` 的 `calculator`）；**WASM 从未接入**——`wasm.d.ts` 与 `app/stores/wasmStore.ts` 是零调用残留，勿据此理解系统、勿重启 WASM 路线。

## 文档入口

- 全仓库文档索引（按任务导航）：[docs/README.md](docs/README.md)
- 术语表（"黑板"双义消歧、乘区命名）：[docs/glossary.md](docs/glossary.md)
- 工程约定与"代码改动 → 必须同步文档"映射表：[CONTRIBUTING.md](CONTRIBUTING.md)

## 高危约定（动手前必读）

| 约定 | 后果 | 详见 |
|---|---|---|
| **文件名 = 注册键，不可改名** | `calculator/charImpl/<职业>/<干员中文名>.ts` 的中文文件名就是注册键（必须等于 `charData.name`）；`calculator/index.ts` 的 `import.meta.glob` 只扫子目录。改名/移动 = 静默解除注册，计算输出全零 | [模块 04](app/modules/Tool/DamageCalculator/docs/04-char-impl-cookbook.md) |
| **BuffContext 不可 JSON 序列化** | `calculator/buff-context.ts` 的 `BuffContext` 是带方法的类实例树（表达式 AST），`JSON.stringify` 后无法回灌；fixture 只能存原始输入，测试内用 `CalculatorHelper` 的 analyze 管线重建。不要给它加 fromJSON/序列化"修复" | [模块 09](app/modules/Tool/DamageCalculator/docs/09-fixtures-and-baselines.md) |
| **黑板注册靠模块副作用，未注册 key 静默 no-op** | `calculator/blackboard.ts` 顶层数十处 `registerRelicBlackboard`；`getRelicBlackboard`（`calculator/impls.ts`）对未注册 key 返回空实现且**告警被注释**——新藏品"看似生效实际无效果"不会报错 | [模块 03](app/modules/Tool/DamageCalculator/docs/03-relic-adaptation-guide.md) |
| **PRNG 与金值基线冻结，勿"修复"** | `calculator/simulate/random-probability.ts` 的 xorshift32 实现与 `test/DamageCalculator/index.test.ts` 的精确浮点基线是冻结契约；改位运算写法或把 `toEqual` 改成容差断言都会击碎全部基线 | [ADR-0006](app/modules/Tool/DamageCalculator/docs/adr/0006-exact-golden-values-and-frozen-prng.md) |
| **改名单必须同步文档** | 改 `app/modules/Tool/DamageCalculator/utils.ts` 任一名单或 `blackboard.ts` 注册，必须同 PR 更新对应文档并重跑 `yarn docs:gen` | [CONTRIBUTING.md](CONTRIBUTING.md) 第三节映射表 |

## 命令速查与测试现状

| 命令 | 作用 |
|---|---|
| `yarn dev` | 开发服务器（HMR）；`yarn start` 是跑构建产物，不是 dev |
| `yarn build` / `yarn typecheck` | 构建 / 类型检查 |
| `yarn test` / `yarn test:watch` | vitest 单跑 / 监听 |
| `yarn docs:gen` | 重新生成模块 `docs/generated/` 三份清单 |

包管理器用 yarn（`pnpm-lock.yaml` 是残留，勿动）。

> ⚠️ `yarn test` 当前 **4/4 全红是已知状态**（fixture 为旧 schema、缺 `buffContext`，报 `Cannot read properties of undefined (reading 'in_game_buff_add')`）——不是你的改动造成的，也不要为了变绿去改金值基线或绕过断言。修复方案见[模块 09](app/modules/Tool/DamageCalculator/docs/09-fixtures-and-baselines.md)。

## 常见任务入口

| 任务 | 从这里开始 |
|---|---|
| 上游游戏数据更新（关卡/藏品/干员） | [docs/data-pipeline.md](docs/data-pipeline.md) |
| 适配新藏品/通宝（含独立黑板注册） | [模块 03](app/modules/Tool/DamageCalculator/docs/03-relic-adaptation-guide.md) |
| 新增干员实现 | [模块 04](app/modules/Tool/DamageCalculator/docs/04-char-impl-cookbook.md) |
| 排查藏品不生效 | [模块 07](app/modules/Tool/DamageCalculator/docs/07-debugging.md) |
