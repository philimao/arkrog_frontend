---
last-verified: 2026-08-05
sources:
  - package.json
  - README.md
  - vite.config.ts
  - scripts/docs-gen.mjs
  - app/modules/Tool/DamageCalculator/calculator/index.ts
  - app/modules/Tool/DamageCalculator/calculator/impls.ts
  - app/modules/Tool/DamageCalculator/calculator/blackboard.ts
  - app/modules/Tool/DamageCalculator/calculator/buff-context.ts
  - app/modules/Tool/DamageCalculator/utils.ts
  - app/stores/damageCalculator/localStorage.ts
  - app/stores/damageCalculator/slices/gameDataSlice.ts
  - app/components/VersionLocalStoarge.ts
  - app/utils/stageSelector.ts
  - app/types/constant.ts
  - app/types/recordType.ts
  - app/components/Character/Enemy/EnemyAvatar.tsx
  - test/DamageCalculator/index.test.ts
---

# 贡献指南（CONTRIBUTING）

本文约定两件事：**工程环境与代码硬约定**，以及 **doc-as-code 的文档维护规则**。文档体系的全貌与阅读路线见 [docs/README.md](docs/README.md)。

## 一、工程环境

### 包管理器与 Node

**本仓库以 pnpm 为准**（2026-07-18 起，此前为 yarn classic 1.x），`pnpm-lock.yaml` 是唯一权威锁文件。Node 版本要求 `>= 20`。首次切换：`corepack enable` 后 `pnpm install`。

> ⚠️ `package.json` 的 `"packageManager": "pnpm@11.2.2"` 会让 **yarn 1.x 直接拒绝运行**（报 `yarn@pnpm@11.2.2`），`yarn build` / `yarn typecheck` 等全部失效。仓库中残留的 `yarn.lock` 已失效：**不要用 yarn 安装依赖，也不要更新 `yarn.lock`**。残留锁文件的删除待维护者决定。

### 命令速查

| 命令 | 作用 |
|---|---|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 启动开发服务器（HMR，端口 5173） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 运行已构建产物（`react-router-serve`，**不是**开发服务器） |
| `pnpm typecheck` | `react-router typegen` + `tsc` 类型检查 |
| `pnpm test` | 单次运行 vitest（当前 4/4 全红为已知状态，见下） |
| `pnpm test:watch` | vitest 监听模式 |
| `pnpm docs:gen` | 从源码重新生成各模块 `docs/generated/` 清单文档（伤害计算器 + 无藏收录共六份）；单模块用 `pnpm docs:gen:damage-calculator` / `pnpm docs:gen:relic-free`，架构见 [docs/doc-generation.md](docs/doc-generation.md) |

两点容易踩的环境事实，正文解释见 [docs/testing.md](docs/testing.md)：

- vitest **没有独立配置文件**，隐式复用 `vite.config.ts`；`~/*` 路径别名靠 `vite-tsconfig-paths` 插件从 `tsconfig.json` 解析。单独新建 `vitest.config.*` 而漏带该插件会导致所有 `~` 导入失败。
- `pnpm test` 当前 4 个用例全部失败是**已知状态**（fixture 为旧 schema、缺 `buffContext`），不是你的改动弄坏的；修复方案见 [模块 09](app/modules/Tool/DamageCalculator/docs/09-fixtures-and-baselines.md)。在测试修复前，PR 的底线是"不引入新增失败"。

## 二、代码硬约定速列

每条一行，机制细节与示例在链接的权威文档里：

| 约定 | 一句话规则 | 权威文档 |
|---|---|---|
| 中文文件名 = 注册键 | `calculator/charImpl/<职业>/<干员中文名>.ts` 的文件名（去 `.ts`）就是干员注册键，必须与 `charData.name` 完全一致，**改名即解除注册**；且 `calculator/index.ts` 的 `import.meta.glob` 只扫子目录，文件放 charImpl 根目录不会被加载 | [模块 04](app/modules/Tool/DamageCalculator/docs/04-char-impl-cookbook.md)、[ADR-0004](app/modules/Tool/DamageCalculator/docs/adr/0004-chinese-filename-registry-keys.md) |
| 黑板注册靠模块副作用 | `calculator/blackboard.ts` 的 `registerRelicBlackboard` 调用全部在模块顶层执行，只有该模块被求值（经 `calculator/index.ts` barrel 导入）注册才生效；`getRelicBlackboard`（`calculator/impls.ts`）对未注册 key **静默返回 no-op**（告警被注释） | [模块 03](app/modules/Tool/DamageCalculator/docs/03-relic-adaptation-guide.md) |
| immer 冻结对象需深拷贝 | `damageCalculatorStore` 走 zustand 的 immer 中间件，store 内对象被冻结；slice 中要整体改写既有对象必须先深拷贝（现行写法为 `JSON.parse(JSON.stringify(...))`，见 `app/stores/damageCalculator/slices/gameDataSlice.ts` 的 `setRogueKey`） | [模块 01](app/modules/Tool/DamageCalculator/docs/01-architecture.md) |
| 新乘区三同步 | 在 `calculator/buff-context.ts` 新增乘区/槽位时，`IBuffContext` 接口、`BuffContext` 类字段初始化、`BuffContext.clone()` 三处**必须同时更新**，漏 `clone()` 会静默丢加成 | [模块 02](app/modules/Tool/DamageCalculator/docs/02-buff-context-and-formulas.md) |

## 三、文档维护规则（doc-as-code 核心）

文档与代码**同一个 PR** 提交。下表是触发映射：左列的代码改动发生时，右列的文档动作是该 PR 的必做项。

| 代码改动 | 必须同步的文档动作 |
|---|---|
| 改 `app/modules/Tool/DamageCalculator/utils.ts` 中任一名单（`allowedBlackboardKeyMap`、`allowedBlackboardValueStrs`、`blackboardValueStrsForEnemy`、`blackboardValueStrsForChar`、`layerValueStrs`、`inGameRelicNames`、各 `*_layer_sync`、`disallowedRelicNames`、`disallowedValueStrs`、`allyTraps`） | 更新[模块 03](app/modules/Tool/DamageCalculator/docs/03-relic-adaptation-guide.md) 对应章节 + 重跑 `pnpm docs:gen`（刷新 `generated/allowed-keys.md`） |
| 改 `calculator/buff-context.ts`（新增/调整乘区、`IBuffContext`/`BuffContext`/`clone`） | 更新[模块 02](app/modules/Tool/DamageCalculator/docs/02-buff-context-and-formulas.md) |
| 新增/修改 `calculator/charImpl/` 干员实现 | 过一遍[模块 04](app/modules/Tool/DamageCalculator/docs/04-char-impl-cookbook.md) 的 checklist + 按[模块 09](app/modules/Tool/DamageCalculator/docs/09-fixtures-and-baselines.md) 新增/更新测试 fixture + 重跑 `pnpm docs:gen`（刷新 `generated/char-impl-coverage.md`） |
| 改 `calculator/blackboard.ts` 的 `registerRelicBlackboard` 注册 | 重跑 `pnpm docs:gen`（刷新 `generated/relic-blackboard-registry.md`）；若引入了新的注册模式，同步[模块 03](app/modules/Tool/DamageCalculator/docs/03-relic-adaptation-guide.md) |
| 改 `app/stores/damageCalculator/`（slices、`localStorage.ts`） | 更新[模块 01](app/modules/Tool/DamageCalculator/docs/01-architecture.md)；若改了 `CalculatorLocalState` 结构，**必须 bump** `calculatorStorage`（`app/stores/damageCalculator/localStorage.ts`）的版本号——版本不符时旧数据会被整体清空（`app/components/VersionLocalStoarge.ts` 的 `VersionLocalStorage`），但**不 bump 会让旧数据以新结构被读出** |
| 改后端数据脚本（`arkrog_backend/util-scripts/updateGameData.ts`、buildGameData 链路、`ACTIVE_CHARS` 机制） | 更新 [docs/data-pipeline.md](docs/data-pipeline.md) |
| 改 `app/utils/stageSelector.ts` 的任一筛选器或数量表（`navOfZone`、`numOfMinorBoss`） | 更新[无藏模块 03](app/modules/RelicFree/docs/03-stage-taxonomy-and-selector.md) + 核对后端 `arkrog_backend/utils/appData/shared.js` 三张 boss 表的跨仓库同步（同值双份硬编码）+ 重跑 `pnpm docs:gen`（刷新 `stage-filter-rules.md`/`hardcode-snapshot.md`） |
| 改 `app/types/recordType.ts` 或 `arkrog_backend/routers/record.js`（记录 schema、守卫、提交/删除副作用） | 更新[无藏模块 02](app/modules/RelicFree/docs/02-record-lifecycle-and-schema.md) |
| 改 `app/types/constant.ts` 的 `StageTypes`/`StageLevels`/`topicMaxLevels` | 更新[无藏模块 03](app/modules/RelicFree/docs/03-stage-taxonomy-and-selector.md) + 核对[无藏 new-topic-checklist](app/modules/RelicFree/docs/new-topic-checklist.md) + 重跑 `pnpm docs:gen`（刷新 `hardcode-snapshot.md`） |
| 改 `arkrog_backend/utils/appData/stagePreview.js`（增量/全量重算、面包屑生成） | 更新[无藏模块 06](app/modules/RelicFree/docs/06-data-pipeline.md) |
| 改 `app/components/Character/Enemy/EnemyAvatar.tsx` 的 `preset`/`enemyNameTransform`，或增删无藏范围内任何 `_get`/`_post` 调用点 | 重跑 `pnpm docs:gen`（刷新 `hardcode-snapshot.md` / `api-endpoints.md`） |
| 改 `app/modules/Tool/BlackFlowMap/recognition/` 任一模块（压缩参数、词表、层名判定、网格标定、打分权重、可信度阈值） | 更新[黑流模块 01](app/modules/Tool/BlackFlowMap/docs/01-screenshot-recognition.md)，尤其「关键不变量」与「实测基线」两节；改判据/阈值须说明依据的实测数据 |
| 改 `arkrog_backend/routers/mapRecognition.ts`、`utils/tencentApi.ts`、`middleware/rateLimit.ts`（接口契约、限流额度、OCR 端点） | 更新[黑流模块 01](app/modules/Tool/BlackFlowMap/docs/01-screenshot-recognition.md) 第三节 + [deployment-env-matrix.md](docs/deployment-env-matrix.md) 的 `.env` 键矩阵 |
| 改 `app/modules/Tool/BlackFlowMap/mapData.tsx` 的 `initialMaps`（地图拓扑） | 它是地图拓扑的**唯一数据源**，识别与渲染共用；**不要另建副本**（后端曾有一份手抄的 `ZONE_MAPS`，已因漂移删除，见 [ADR-0001](app/modules/Tool/BlackFlowMap/docs/adr/0001-cloud-ocr-frontend-inference.md)） |

各模块 `docs/generated/` 目录（`app/modules/Tool/DamageCalculator/docs/generated/` 三份 + `app/modules/RelicFree/docs/generated/` 三份）是 `pnpm docs:gen` 的产物，**禁止手改**——手改会在下次生成时被覆盖，且生成物与源码的一致性是 CI 校验目标（现状与目标形态见 [docs/doc-generation.md](docs/doc-generation.md)）。

### 写作与引用约定

1. **引用代码用"相对路径 + 导出符号名"**（如 `calculator/helper.ts` 的 `applyRelic`），**禁止出现行号**——行号在下一次提交后必烂。
2. **frontmatter**：每篇正文文档头部带 `last-verified: <日期>` 与 `sources:`（逐行列出该文档论断依赖的源码相对路径）。修改文档时核实内容仍与源码一致后更新 `last-verified`。
3. **过时即标横幅**：发现文档与现行实现不符而又来不及重写时，先在顶部加 `> ⚠️ 已过时，现行实现见 <链接>`，不要让误导性文档裸奔（`docs/DamageCalculatorDataSchema.md` 曾以"描述不存在的 WASM 接口"误导新人数月）。
4. **图片入库**：截图等图片资产统一放 `docs/assets/`，**禁止外链图床**（旧 `docs/debuger.md` 的全部截图挂在语雀 CDN，外链失效即文档报废）。
5. **单一正文源**：每个主题只有一份正文，其余位置只放链接；不要把其他文档的内容复制过来。
6. **术语**：与 [docs/glossary.md](docs/glossary.md) 用词保持一致（藏品/通宝/岁时/年代/灵感/乘区/独立黑板/通用黑板/伪黑板等）。

## 四、PR Checklist

复制以下内容到 PR 描述并逐项勾选：

```markdown
## Checklist
- [ ] `pnpm typecheck` 通过
- [ ] `pnpm test` 已运行，未引入新增失败（4/4 全红为已知基线，见 docs/testing.md）
- [ ] 本次改动是否触及 CONTRIBUTING「文档触发映射表」中的条件？
  - [ ] 否
  - [ ] 是 → 已同步对应文档，并更新其 frontmatter 的 last-verified
- [ ] 若改动命中映射表中任何「重跑 `pnpm docs:gen`」条目：已重跑并提交对应模块 generated/ 变更
- [ ] 若改了 CalculatorLocalState 结构：已 bump calculatorStorage 版本号
- [ ] 新增/修改的文档：引用代码用"路径 + 导出符号"，无行号
- [ ] 新增图片已放入 docs/assets/，无外链图床
```

## 五、文档目录结构

原则：**正文就近放模块内，顶层只放索引与跨模块共享内容**。

| 位置 | 放什么 |
|---|---|
| `app/modules/Tool/DamageCalculator/docs/` | 伤害计算器全部正文文档（编号 01–10、专题清单、`adr/`、`generated/`） |
| `app/modules/RelicFree/docs/` | 无藏收录全部正文文档（编号 01–07、专题清单、`adr/`、`generated/`） |
| `app/modules/Tool/BlackFlowMap/docs/` | 黑流树海地图工具正文文档（编号 01–、`adr/`；无 `generated/`，该模块未接入 `docs:gen`） |
| `docs/` | 全仓库索引（`README.md`）、术语表（`glossary.md`）、跨模块/跨仓库流程（`data-pipeline.md`、`auth-and-permissions.md`、`deployment-env-matrix.md`）、仓库级工程说明（`testing.md`、`doc-generation.md`） |
| 模块根 `README.md`（如 `app/modules/RelicFree/README.md`）、`calculator/charImpl/README.md`、`test/DamageCalculator/README.md`、`app/components/RecordCard/README.md`、`app/modules/RecordDisplay/README.md` | 3–5 行指针文件，只放链接，防止双源漂移 |

完整文档地图、按任务导航与 onboarding 阅读顺序见 [docs/README.md](docs/README.md)。
