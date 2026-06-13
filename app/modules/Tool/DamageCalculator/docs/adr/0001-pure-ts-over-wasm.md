---
status: 补记
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/wasm.d.ts
  - app/stores/wasmStore.ts
  - app/modules/Tool/DamageCalculator/calculator/calculator.ts
  - app/modules/Tool/DamageCalculator/calculator/CalcCenter.tsx
  - docs/DamageCalculatorDataSchema.md
  - test/DamageCalculator/data/data_Hoederer_01.json
---

# ADR-0001：放弃 WASM 路线，伤害计算采用纯 TypeScript

| | |
|---|---|
| 状态 | 补记（2026-06-11） |
| 决策归属 | 原作者（未记录，由代码考古补记） |

## 背景

项目早期规划把伤害计算放进 WASM 模块：`wasm.d.ts` 声明了全局 `WasmModule.calculator(props: string)` 接口；`app/stores/wasmStore.ts` 的 `useWasmStore.getInstance` 实现了按文件名从 `VITE_WASM_URL` 懒加载 emscripten 模块；`docs/DamageCalculatorDataSchema.md` 整篇描述的是 WASM 导出函数 `calculate(charInput, enemyInput, charData, enemyData, skillData, uniEquipData, relics)`，输出 `{auto, skill, cycle, logs}`。

## 决策

生产计算 100% 走纯 TypeScript：`calculator/CalcCenter.tsx` 调用 `calculator/calculator.ts` 的 `calculator`，经 `getCalculatorImpl` 分发到 `charImpl/` 下逐干员手写的 TS 实现。WASM 从未接线——`useWasmStore.getInstance` 全仓库零调用点，`WasmModule` 类型除声明处外零引用。从"WASM 接口连一个调用方都没出现过"反推，该决策发生在 WASM 实际接入之前，纯 TS 是事实上的唯一实现路径，而非从 WASM 迁移而来。

放弃的理由（反推）：计算与调试基础设施深度耦合在同进程 TS 里——`debugRelic` 的 console 分组日志、AST 节点 `tooltip` 字符串溯源、`CalculatorHelper.print` 的 console.table，这些在跨 WASM 边界传字符串的模式下都无法低成本实现；且无需维护第二条（emscripten）构建工具链。

## 后果

- 正面：计算逻辑、黑板分发、调试输出在同一类型系统内，改动无跨语言成本。
- 负面：留下三件高误导性残留——
  - `wasm.d.ts`、`app/stores/wasmStore.ts`：零调用死代码，新人会误以为存在 WASM 路径；
  - `docs/DamageCalculatorDataSchema.md`：描述不存在的接口（输出字段 `auto`/`atk`，现行为 `attack`/`dph`），负价值文档，已由[现行数据契约](../06-data-schema.md)取代；
  - `test/DamageCalculator/data/` 的 fixture 仍是按 WASM 时代 `calculate` 签名录制的旧 schema（顶层键 `charInput/enemyInput/charData/skillData/uniEquipData/relics`，无 `buffContext`），是测试全红的直接原因之一（见 [ADR-0003](0003-buffcontext-class-not-serializable.md) 与[夹具与基线](../09-fixtures-and-baselines.md)）。

> ⚠️ 看到 `wasm.d.ts` 不要把计算问题往 WASM 上排查，更不要"顺手把 wasmStore 接上"——它从未承载过任何生产逻辑。删除这两个残留文件属于普通清理，不需要重开本决策。

## 重启条件

重启 WASM 路线前必须先有性能证据：

1. profiling 数据证明 TS 计算路径是真实用户场景（或未来批量模拟/参数扫描场景）的瓶颈，且优化 TS 实现无法解决；
2. 给出与现行 TS 实现的金值双轨对比测试方案（同输入两实现并行，逐项 diff），基线管理沿用[夹具与基线](../09-fixtures-and-baselines.md)；
3. 明确 emscripten 构建管线的维护责任与 CI 接入。

三者缺一不可。在此之前，任何"把计算移进 WASM"的改动都应被拒绝。
