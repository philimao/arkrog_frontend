---
last-verified: 2026-06-11
sources:
  - package.json
  - vite.config.ts
  - tsconfig.json
  - README.md
  - test/DamageCalculator/index.test.ts
  - app/modules/Tool/DamageCalculator/calculator/index.ts
---

# 测试运行与工程环境

本篇是仓库级工程事实的单一来源：怎么跑测试、vitest 的配置从哪来、包管理器与 CI 的真实现状。模块内部的测试设计（夹具结构、基线值从何而来、为什么现在全红）不在本篇展开，见 [09-fixtures-and-baselines.md](../app/modules/Tool/DamageCalculator/docs/09-fixtures-and-baselines.md)。

## 1. 命令速查

| 命令 | 实际执行 | 说明 |
|---|---|---|
| `yarn test` | `vitest run` | 单次全量跑测试（CI 语义） |
| `yarn test:watch` | `vitest` | watch 模式，改文件自动重跑 |
| `yarn typecheck` | `react-router typegen && tsc` | 先生成路由类型再做全量类型检查 |
| `yarn dev` | `react-router dev` | 本地开发服务器（HMR，端口 5173） |
| `yarn build` | `react-router build` | 生产构建 |
| `yarn start` | `react-router-serve ./build/server/index.js` | 启动**生产构建产物**，不是开发服务器 |
| `yarn docs:gen` | 文档生成脚本 | 重新生成模块 `docs/generated/` 三件套，见 [第 6 节](#6-文档生成) |

环境要求：node >= 20（README 与 `@types/node` 版本一致）。

两点容易踩的偏差：

- `yarn typecheck` 必须先跑 `react-router typegen`——`tsconfig.json` 的 `rootDirs` 引用了 `.react-router/types/` 下的生成物，**fresh clone 上直接跑裸 `tsc` 会因缺生成类型而报错**，请始终用 `yarn typecheck` 而不是裸 `tsc`。
- README 的 Development 一节写的是 `yarn start` 启动开发服务器，与 `package.json` 不符：`start` 跑的是生产构建产物（且需要先 `yarn build`），本地开发请用 `yarn dev`。

## 2. vitest 配置事实：没有 vitest.config，一切来自 vite.config.ts

仓库**不存在任何 `vitest.config.*` 文件**（已验证）。vitest 3.x 在找不到独立配置时会直接复用项目根的 `vite.config.ts`，而 `vite.config.ts` 中也**没有 `test` 配置段**——也就是说当前测试环境完全是 vitest 的默认行为 + vite 插件链的副产品。这套隐式机制里有三个载荷性事实：

1. **`~` 路径别名不是 vite 内置的。** `tsconfig.json` 的 `paths` 定义了 `~/*` → `./app/*`，真正让 vite/vitest 认识这个别名的是 `vite.config.ts` 插件列表中的 `vite-tsconfig-paths`（`tsconfigPaths()`）。测试文件里 `import { calculator } from "~/modules/Tool/DamageCalculator/calculator"` 能解析，全靠这条链。
2. **JSON 夹具的导入依赖 `tsconfig.json` 的 `resolveJsonModule`。** `test/DamageCalculator/index.test.ts` 直接 `import` 四份 `.json` 夹具，关掉这个开关类型检查会报错。
3. **干员实现注册依赖 vite 专属 API。** `calculator/index.ts` 用 `import.meta.glob` 扫描 `charImpl/` 子目录、按"文件名 = 干员中文名"自动注册全部干员实现。`import.meta.glob` 是 vite 的编译期 API，vitest 因为跑在 vite 之上所以可用；但**任何脱离 vite 体系的执行环境（如纯 node 脚本、ts-node）都无法触发这套注册**，直接调用 `calculator()` 会因查不到干员实现而静默输出全零。测试必须从 `calculator/index.ts` 这个入口导入（即 `~/modules/Tool/DamageCalculator/calculator`），才能让注册副作用先于断言执行。

> ⚠️ **如果将来要单独建 `vitest.config.ts`**（加 coverage、改 include、配环境等），它会**完全取代** `vite.config.ts` 而不是与之合并——必须在新配置里重新带上 `vite-tsconfig-paths` 插件，否则所有 `~/` 导入瞬间全部解析失败。更稳妥的做法是不建新文件，直接在 `vite.config.ts` 里加 `test` 字段（需 `/// <reference types="vitest/config" />`），插件链自然共享。

## 3. 包管理器现状

> ⚠️ 仓库根**同时存在 `yarn.lock` 和 `pnpm-lock.yaml`**（已验证），两份锁文件各自演进、互不知晓。README 明确要求"请使用 yarn 安装和运行项目"，但双锁文件并存意味着不同成员的 `node_modules` 可能由不同包管理器、按不同的依赖解析结果安装——本仓库实测时本机的 `node_modules` 就是 pnpm 结构（存在 `node_modules/.pnpm`），与 README 约定已经发生了实际偏离。

建议（**待人工确认后执行，本文档不替仓库做决定**）：

- 以 README 既有约定为准，**yarn 为唯一权威包管理器**；
- 删除 `pnpm-lock.yaml`，并在 `.gitignore` 或 `package.json` 的 `packageManager` 字段（corepack）层面固定，防止再次混入；
- 确认前，新成员请只用 `yarn install`，不要因为看到 `pnpm-lock.yaml` 而改用 pnpm，那会让分歧继续扩大。

包管理器的最终约定及其在 PR 流程中的检查项见 [CONTRIBUTING.md](../CONTRIBUTING.md)。

## 4. 测试套件现状：唯一套件，4/4 全红

仓库目前**只有一个测试套件**：`test/DamageCalculator/index.test.ts`，含 4 个用例（赫德雷 / Mon3tr / 维娜·维多利亚 / 维什戴尔），每个用例从 `test/DamageCalculator/data/` 加载一份手工导出的 JSON 夹具，对 `calculator/calculator.ts` 的 `calculator` 完整输出做精确浮点 `toEqual` 断言。

> ⚠️ **当前 4/4 用例全部失败，这是已知状态，不是你改坏的。** 本文档写作当日（2026-06-11）实测 `yarn test`，四个用例均抛 `TypeError: Cannot read properties of undefined (reading 'in_game_buff_add')`。根因是夹具仍是 2025-05 旧输入契约（缺 `buffContext` 等现行 `CalculatorInput` 必需字段），而测试里的 `as unknown as CalculatorInput` 双重强转让 TypeScript 完全无法提示这一点。根因分析与修复方案（为什么 `BuffContext` 不能 JSON 序列化、夹具应当怎么重建）见 [09-fixtures-and-baselines.md](../app/modules/Tool/DamageCalculator/docs/09-fixtures-and-baselines.md)。

由此推出两条工程纪律：

- **不要以"有测试保护"为前提做任何重构。** 计算器核心代码在测试创建后又演进了数月，这段时间内仓库实际处于零有效测试覆盖状态。
- 在修复夹具之前，**测试跑红不构成 PR 阻塞依据，跑绿也不构成正确性证据**——但这绝不意味着可以放任，修复路线见上面链接的 09 篇。

## 5. CI 现状：没有任何自动触发

已验证的事实：

| 检查项 | 现状 |
|---|---|
| `.github/workflows/` | 不存在 |
| git hooks（`.husky/` 等） | 不存在 |
| 测试触发方式 | 仅人工在本地执行 `yarn test` |

也就是说"数据更新后自动验证"目前没有任何机械触发点：上游游戏数据更新、依赖升级、计算公式改动，都不会有任何东西自动跑一遍测试。接入 CI 是已规划方向，触发时机与验证流水线的设计随藏品 buff 量自动验证一起讨论，见 [10-relic-buff-verification.md](../app/modules/Tool/DamageCalculator/docs/10-relic-buff-verification.md)。在 CI 落地之前，请把"提交前本地 `yarn test` + `yarn typecheck`"当作自我约束（注意第 4 节：当前测试红是已知状态，看 typecheck 和你自己新增用例的结果）。

## 6. 文档生成

`yarn docs:gen`（脚本 `scripts/docs-gen.mjs`）从源码重新生成 `app/modules/Tool/DamageCalculator/docs/generated/` 下的三份清单（独立黑板注册表、通用黑板名单、干员实现覆盖矩阵）。这三份文件**是生成物，禁止手改**——改了也会在下次生成时被覆盖。什么时候必须重新生成、以及它与"代码改动→文档同步"映射表的关系，见 [CONTRIBUTING.md](../CONTRIBUTING.md)。
