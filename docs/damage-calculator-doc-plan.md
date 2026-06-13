# 伤害计算器 doc-as-code 文档落地计划

> 状态：执行中（2026-06-11 基于 8 智能体全模块调研产出；同日按用户要求调整目录结构：正文下沉模块内、顶层只留索引与跨模块共享内容）
> 范围：`app/modules/Tool/DamageCalculator` + `app/stores/damageCalculator*` + `test/DamageCalculator` + 跨仓库数据管线（arkrog_backend）

## 一、影响文档设计的关键调研结论

1. **计算 100% 为纯 TypeScript**，WASM 从未接入（`wasm.d.ts`/`wasmStore.ts` 为零调用残留）。而仓库唯一现存文档 `docs/DamageCalculatorDataSchema.md` 描述的恰是不存在的 WASM 接口（输出字段 `auto`/`atk` vs 现行 `attack`/`dph`）——**负价值文档，新人首读即被误导**。
2. **测试套件 4/4 全红**（实测）：fixture 为旧 schema、缺 `buffContext`；且 `BuffContext` 是带方法的类实例树，JSON fixture 根本无法承载，必须在测试内用 `CalculatorHelper.analyzeChar→analyzeRelics→...` 真实管线 headless 重建。这是"数据更新→自动验证"目标的第一个阻塞。
3. **独立黑板注册机制**：`calculator/blackboard.ts` 顶层约 40 处 `registerRelicBlackboard(key, {isActive, apply})`，key 取 buff 黑板中 `key=='key'` 词条的 `valueStr`。**未注册 key 静默返回 no-op（告警被注释）**——新藏品"看似生效实际无效果"是最危险的静默失败模式。
4. **通用黑板的隐式约定极多**：`utils.ts` 七八个手工中文名单（白名单/黑名单/局内名单/层数同步组）、数值正负双语义（`sign(v)==1 ? v : 1+v`）、"乘算"乘区组内实为加算、层数双轨、`tooltip` 字符串当事实标识符。全部只存在于代码细节中。
5. **数据管线跨仓库**：ArknightsGameData 解包仓库 → `arkrog_backend/util-scripts/updateGameData.ts`（buildGameData→Mongo+Redis）→ `/gamedata/bundle`、`/gamedata/bundle-ext` API → 前端 `gameDataStore`。前端有 24h（bundle）/1 年（level，ETag=levelId）HTTP 强缓存且无失效机制、无版本可观测端点；新干员上架由后端 `.env` 的 `ACTIVE_CHARS` 中文名白名单控制。
6. **版本敏感硬编码十余处**：主题切片 `Object.values(topics).slice(3,5)`、boss 关数量表、岁时/年代/灵感数值手抄（含已确认笔误：寅诗 key 残缺 `enemy_damage_`、怪葫芦 24 源石锭写成 1.2）、技能倍率硬编码在 charImpl switch 中（上游平衡性调整不会自动反映）。
7. **三代 simulate 残骸并存**（`calculator/simulate-core.ts` 死代码、`simulate/` 骨架、`Hoederer_beta.ts` 永不加载），与现行架构同名混居，极易误读。
8. **干员实现注册键=文件名（中文）**，glob `'./charImpl/*/**.ts'` 只扫子目录；17 份实现已分化出至少 3 代写法（mitigation 两种取法、atk 两种取法、dph 口径不一）。

## 二、目录结构（2026-06-11 调整版）

原则：**正文就近放模块内**（`app/modules/Tool/DamageCalculator/docs/`）；**顶层 `docs/` 只放**：全仓库索引、跨模块共享的概念（游戏/项目术语表）、跨模块共享的流程（数据管线）、仓库级工程说明。

```
arkrog_frontend/
├─ CLAUDE.md                                  # 新建：AI 协作导航（仓库根）
├─ CONTRIBUTING.md                            # 新建：工程约定 + 文档维护规则（仓库根）
├─ docs/                                      # 顶层：索引 + 跨模块共享
│  ├─ README.md                              # ★全仓库文档索引：文档地图 + 按任务导航 + onboarding 路线
│  ├─ glossary.md                            # ★术语表：游戏域专有名词 + 项目域专有名词（跨模块共享）
│  ├─ data-pipeline.md                       # ★游戏数据管线与上游更新 Runbook（跨模块/跨仓库共享）
│  ├─ testing.md                             # 测试运行与工程环境（仓库级）
│  ├─ damage-calculator-doc-plan.md          # 本计划
│  ├─ DamageCalculatorDataSchema.md          # 旧：加过时横幅 → 过渡期后删除
│  ├─ debuger.md                             # 旧：加指针横幅指向模块 07-debugging
│  └─ TournamentDataSchema.md                # 旧：保留，由索引收录
└─ app/modules/Tool/DamageCalculator/
   ├─ README.md                              # 新建：模块简介 + 文档入口（指针）
   ├─ docs/                                  # ★模块正文文档
   │  ├─ README.md                           # 模块文档索引/阅读顺序
   │  ├─ 01-architecture.md                  # 计算管线架构总览
   │  ├─ 02-buff-context-and-formulas.md     # 乘区与属性合成公式规格
   │  ├─ 03-relic-adaptation-guide.md        # 藏品/通宝增益接入手册 ★
   │  ├─ 04-char-impl-cookbook.md            # 干员实现 Cookbook
   │  ├─ 05-topic-spec-and-enemy-spec.md     # 主题/敌人特殊词条伪黑板语义表
   │  ├─ 06-data-schema.md                   # 现行计算器输入输出契约（替换旧 WASM 文档）
   │  ├─ 07-debugging.md                     # 调试与排查手册（吸收 docs/debuger.md）
   │  ├─ 08-simulate-and-legacy.md           # 模拟器现状盘点与遗留代码清单
   │  ├─ 09-fixtures-and-baselines.md        # 夹具生成与金值基线管理 ★
   │  ├─ 10-relic-buff-verification.md       # 新增藏品 buff 量自动验证设计 ★
   │  ├─ known-issues.md                     # 已知问题与笔误登记簿
   │  ├─ version-sensitive-hardcode.md       # 版本敏感硬编码清单
   │  ├─ new-topic-checklist.md              # 新增肉鸽主题扩展手册
   │  ├─ adr/                                # 架构决策记录
   │  │  ├─ template.md
   │  │  ├─ 0001-pure-ts-over-wasm.md
   │  │  ├─ 0002-expectation-formula-vs-frame-simulation.md
   │  │  ├─ 0003-buffcontext-class-not-serializable.md
   │  │  ├─ 0004-chinese-filename-registry-keys.md
   │  │  ├─ 0005-manual-ingame-relic-name-lists.md
   │  │  └─ 0006-exact-golden-values-and-frozen-prng.md
   │  └─ generated/                          # ★脚本生成物（勿手改，yarn docs:gen 重新生成）
   │     ├─ relic-blackboard-registry.md     # 已适配独立黑板清单
   │     ├─ allowed-keys.md                  # 白名单/黑名单/局内名单/层数同步组
   │     └─ char-impl-coverage.md            # 干员×技能实现覆盖矩阵
   └─ calculator/charImpl/README.md          # 新建：指针（命名铁律 + glob 警示 → 04）
test/DamageCalculator/README.md               # 新建：指针（全红原因声明 → 09）
scripts/docs-gen.mjs                          # 新建：生成脚本（package.json 加 "docs:gen"）
```

## 三、文档清单与优先级

### A. 仓库级横切件
| 文档 | 优先级 | 要点 |
|---|---|---|
| `docs/README.md` 全仓库文档索引 | P0 | 文档地图（标题/路径/状态）；按任务导航；onboarding 阅读顺序；收录存量文档（Tournament/RouteGuard/赛事Data）；与 arkrog_backend 互链 |
| `docs/glossary.md` 术语表 | P0 | 游戏域（藏品/通宝/岁时/年代/灵感/主题/化境地块/伺烛客/木桩…）+ 项目域（黑板双义消歧、乘区、伪黑板、金值基线、解包数据、bundle/bundle-ext…）；中文名/代码标识/上游字段/定义/权威源码路径五列对照；buff.key 前缀语义速查 |
| `docs/data-pipeline.md` 数据管线 Runbook | P0 | 后端段（updateGameData.ts、ACTIVE_CHARS、Mongo/Redis）→ 前端感知段（HTTP 缓存陷阱、如何确认新数据已到）→ 模块适配段（指向模块 03/04）→ 验证段（指向模块 09/10） |
| `docs/testing.md` 测试与工程环境 | P1 | vitest 隐式复用 vite.config（依赖 vite-tsconfig-paths）；命令；双锁文件问题；CI 现状（无 workflows） |
| `CONTRIBUTING.md` | P1 | 包管理器约定；**"代码改动→必须同步哪篇文档"触发映射表**进 PR checklist；引用代码用符号禁行号；frontmatter `last-verified`+`sources`；图片入库 |
| `CLAUDE.md` | P1 | 一页：项目速述、高危约定速列、命令速查、测试现状声明、数据更新任务入口 |

### B. 模块正文 `app/modules/Tool/DamageCalculator/docs/`
| 文档 | 优先级 | 要点 |
|---|---|---|
| `01-architecture.md` | P0 | CalcCenter 五段 analyze 编排图；双 BuffContext 同步义务；store slice 与重算触发链路；干员自动注册；木桩/带船关特殊分支 |
| `02-buff-context-and-formulas.md` | P0 | 各乘区定义与 operator 语义；属性合成顺序；新增乘区三同步；stage_rune_mul 幽灵乘区 |
| `03-relic-adaptation-guide.md` ★ | P0 | 通用黑板 or 独立黑板决策树；registerRelicBlackboard 模板；utils.ts 全部名单语义；数值正负双语义；层数双轨；通宝特殊性；失败模式排查 |
| `04-char-impl-cookbook.md` | P1 | 文件模板与命名铁律；乘区读取样板；applySkill 不参与 DPS；帧量化约定；新旧写法收敛规范；checklist |
| `05-topic-spec-and-enemy-spec.md` | P1 | WRATH_CONFIG/年代/灵感手抄数据维护；EnemySpecConfigs 伪黑板（bbKey 直写 BuffContext 槽位）；两套档位映射 |
| `06-data-schema.md` | P0（首周） | CalculatorInput/Output 现行契约；logs 恒空；fixture 与验证报告 schema 的权威依据 |
| `07-debugging.md` | P2 | debugRelic 日志阅读法；printAdditionContext 解读；症状导向速查；吸收 debuger.md 断点教程 |
| `08-simulate-and-legacy.md` | P2 | 三代残骸代际关系；二代帧引擎设计意图（30fps、种子化 PRNG 契约）与路线图；可复用资产备忘 |
| `09-fixtures-and-baselines.md` ★ | P0 | BuffContext 不可序列化→fixture 只存原始输入、测试内重建；金值得出与回填流程；非确定性处理；防假绿 |
| `10-relic-buff-verification.md` ★ | P0 | applyAnyRelics/analyzeRelics 纯函数链；乘区遍历输出 buff 量；新旧版本差集报告；invalidRelics 告警；**报告 schema/存放/签核**；CI 路线 |
| `known-issues.md` | P1 | 已确认笔误与缺陷登记（寅诗残缺 key、怪葫芦 1.2、resetStore 空操作、缺 break、Math.random 等）；自动化对账前提 |
| `version-sensitive-hardcode.md` | P1 | 十余处散点硬编码逐项清单 + 触发更新的上游变更类型 |
| `new-topic-checklist.md` | P2 | 新主题 10+ 文件散点改动清单 |
| `adr/0001~0006` | P1 | 六条已发生决策补记，各注明"推翻条件" |
| `generated/` ×3 | P1 | 脚本生成，CI 可校验与源码一致 |

### C. 指针（只放链接防双源漂移）
模块根 README、charImpl/README、test/DamageCalculator/README——各 3~5 行。

## 四、写作与维护约定（落地时执行）

1. 文件名英文 kebab-case + 编号前缀，正文中文。
2. 每篇 frontmatter：`last-verified: 日期` + `sources: [关联源码路径]`。
3. 引用代码用"路径 + 导出符号名"，**禁用行号**（行号必烂）。
4. 单一正文源：每个主题一份正文，其余位置只放链接。
5. 清单类内容生成化：`yarn docs:gen` 从源码导出 generated/ 三件，CI 校验一致性。
6. 过时即标横幅：旧 DamageCalculatorDataSchema.md、debuger.md 处理见目录树注释。
7. 文档与代码同 PR：CONTRIBUTING 中维护"触发条件→文档"映射表。

## 五、与短期自动化目标的衔接（文档完成后再启动）

目标五环节 → 文档覆盖：① 上游更新落地→data-pipeline.md（缺口：数据版本可观测性需立 ADR 决定是否加版本端点）；② 识别新增藏品/通宝 diff→10；③ 通用黑板 or 独立黑板判定→03；④ buff 量验证→09+10+known-issues（笔误对账）；⑤ 数值正确性基准→02。
