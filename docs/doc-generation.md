---
last-verified: 2026-07-13
sources:
  - scripts/docs-gen.mjs
  - scripts/docs-gen/lib.mjs
  - scripts/docs-gen/damage-calculator.mjs
  - scripts/docs-gen/relic-free.mjs
  - package.json
---

# 文档生成器（docs:gen）架构与扩展手册

本仓库把"必随源码漂移的清单类文档"交给脚本生成（各模块 `docs/generated/` 目录），手写正文只负责语义与决策、通过相对链接引用生成物中的表。本文说明生成器的架构、已知局限、给新模块接入生成物的步骤，以及手写文档与生成物两套 frontmatter 的边界。

## 架构

统一入口是 `scripts/docs-gen.mjs`：按命令行参数分发到 `scripts/docs-gen/` 下的模块生成器，无参数时全量执行。生成物首行统一带 `AUTO_BANNER` 横幅（文案固定引用 `scripts/docs-gen.mjs` 这一入口路径，模块拆分不改横幅，避免既有生成物无谓 diff）。

| 文件 | 职责 |
|---|---|
| `scripts/docs-gen.mjs` | 入口分发：`MODULES` 表把参数（`damage-calculator` / `relic-free`）映射到各模块的 `run*` 函数，无参数按表序全跑 |
| `scripts/docs-gen/lib.mjs` | 共享辅助层：`extractBalancedBlock` / `findBalancedEnd`（括号配对，跳过字符串与注释）、`parseArrayEntries` / `parseObjectEntries` / `parseObjectEntriesExt`（字面量解析）、`splitCodeAndComment`、`docCommentAbove`、`walkFiles`（确定性排序的目录遍历）、`mdTable` / `docHeader` / `writeDoc`（Markdown 输出）、`AUTO_BANNER` |
| `scripts/docs-gen/damage-calculator.mjs` | 伤害计算器三件：`relic-blackboard-registry.md`、`allowed-keys.md`、`char-impl-coverage.md` → `app/modules/Tool/DamageCalculator/docs/generated/` |
| `scripts/docs-gen/relic-free.mjs` | 无藏收录三件：`api-endpoints.md`、`stage-filter-rules.md`、`hardcode-snapshot.md` → `app/modules/RelicFree/docs/generated/` |

设计约束（全部生成器共同遵守）：

- **纯 Node（>=20）、零依赖**：不引入 TypeScript 编译器或 AST 解析库。
- **确定性输出**：不写时间戳；排序不依赖 locale（`lib.mjs` 的 `cmp` 按 UTF-16 码元比较）；目录遍历显式排序。同一份源码重跑任意多次，生成物字节级不变——这也是校验手段（见下文 CI 一节）。
- **提取规则统一**：行首（去缩进后）以 `//` 开头的行视为注释，其中的条目/调用不计入；括号配对扫描跳过字符串字面量与块注释，因此 `atk_up[life_point]` 这类含括号的 key 不会破坏配对。

## 局限与防护

生成器用**正则 + 括号配对**做提取，不是 AST 解析。这换来零依赖与低维护成本，但有边界，改动被扫描的源码时要有意识：

- **匹配不到的写法会静默漏提**。锚点正则假定了源码的书写形态（如 `export const 名单名 =`、`registerRelicBlackboard("…"`、`_post<T>("/端点"`）。重构成正则以外的形态——端点改为变量/模板字符串拼接、注册调用改为循环批量注册、名单改为展开运算合并——提取会无声减少条目，产物"看起来正常"。跨行书写大多已兼容（端点提取的正则允许方法名、泛型、括号、字符串之间任意换行），但**动态值**一定提不到。
- **防护一：提取总数为 0 时 throw**。每个生成函数对"一个都没提到"的情况直接抛错、进程退出码 1（如 `relic-free.mjs` 的 `genApiEndpoints`、`damage-calculator.mjs` 的 `genRelicBlackboardRegistry`）——保证锚点整体失配（源文件改名、导出改写法）不会产出一份空表混过 review。
- **防护二：数量比对告警**。`relic-free.mjs` 的 `genApiEndpoints` 用一条只锚"像调用"形态的正则（`ANCHOR_RE`）与成功提取数比对，差值即"有调用但端点不是静态字面量"，生成时打印警告。
- **防护三：手工字典缺项告警占位**。语义列（`damage-calculator.mjs` 的 `LIST_PURPOSES`、`relic-free.mjs` 的 `NAV_PURPOSES`）是脚本内手工字典：源码新增名单/筛选器而字典未补时，产物写入占位文案并打印警告，不会静默留空。
- **部分提取失败仍会漏**：上述防护针对"全空"和"计数不符"，若某一行条目恰好写成正则不识别的形态（而同名单其余条目正常），仍会静默少一行。review 生成物 diff 时留意"改了源码但生成物没跟着变"的反向信号。

## 新模块接入步骤（以 relic-free 为例）

1. **新建模块生成器** `scripts/docs-gen/<模块名>.mjs`：从 `lib.mjs` 引入共享辅助，定义模块内 `OUT_DIR`（指向 `app/modules/<模块>/docs/generated/`）与源码路径表，每份产物一个 `gen*` 函数（内部用 `docHeader(sources)` 生成横幅 + frontmatter，`writeDoc(OUT_DIR, 文件名, 内容)` 落盘），导出一个 `run<模块名>()` 依次执行并打印条目数摘要。参照 `scripts/docs-gen/relic-free.mjs` 的 `runRelicFree`。
2. **登记到入口**：在 `scripts/docs-gen.mjs` 的 `MODULES` 表加一行参数名 → run 函数映射。
3. **加 npm script**：`package.json` 加 `docs:gen:<模块名>`（`node scripts/docs-gen.mjs <模块名>`）；`docs:gen` 无参全量，天然覆盖新模块，无需改动。
4. **补零总数防护与手工字典**：每个 `gen*` 函数对空提取 throw；语义列若需人话解释，建脚本内字典并在缺项时 warn + 占位。
5. **验证**：跑单模块脚本确认产物；重复跑两次确认字节级无 diff（确定性）；跑一次全量确认既有模块生成物零 diff（重构共享层时这是硬标准）。最后在 [CONTRIBUTING.md](../CONTRIBUTING.md) 的"代码改动 → 必须同步文档"映射表登记新的触发条目。

## 两套 frontmatter 的边界

| | 手写文档 | 生成物（`docs/generated/`） |
|---|---|---|
| 首行 | 无横幅 | `AUTO_BANNER` 横幅（勿手改声明） |
| frontmatter | `last-verified: <日期>` + `sources:`（作者核实事实的日期与依据） | `generated: true` + `sources:`（提取自哪些源码），**不写日期** |
| 时效语义 | 日期越旧越可疑，需人工重核 | 与源码的一致性由重跑校验，不靠日期——写时间戳只会让每次重跑都产生无意义 diff，破坏"重跑无 diff = 一致"的校验手段 |
| 改动方式 | 直接编辑，更新 `last-verified` | 只能改源码或生成脚本后重跑 `yarn docs:gen` |

判断一篇清单该手写还是该生成：值会随源码/版本漂移、且能被稳定锚点提取的，生成；需要解释"为什么"与取舍的，手写并链接生成物（例：[app/modules/RelicFree/docs/version-sensitive-hardcode.md](../app/modules/RelicFree/docs/version-sensitive-hardcode.md) 解释为何敏感，值以 [generated/hardcode-snapshot.md](../app/modules/RelicFree/docs/generated/hardcode-snapshot.md) 为准）。

## npm script 清单

| 命令 | 作用 |
|---|---|
| `yarn docs:gen` | 全量生成（伤害计算器 + 无藏收录，共 6 份） |
| `yarn docs:gen:damage-calculator` | 仅伤害计算器三份 → `app/modules/Tool/DamageCalculator/docs/generated/` |
| `yarn docs:gen:relic-free` | 仅无藏收录三份 → `app/modules/RelicFree/docs/generated/` |

## CI 校验（待建设）

生成物与源码的一致性目前**靠人工重跑**，没有 CI 强制。目标形态：CI 中执行 `yarn docs:gen` 后跑 `git diff --exit-code -- app/modules/Tool/DamageCalculator/docs/generated app/modules/RelicFree/docs/generated`，有 diff 即失败——含义是"提交者改了被扫描的源码但没重跑生成/没提交生成物"。确定性输出（无时间戳）是这一校验成立的前提。落地前，[CONTRIBUTING.md](../CONTRIBUTING.md) 映射表中"改 XX 必须重跑 docs:gen"的条目是唯一约束。
