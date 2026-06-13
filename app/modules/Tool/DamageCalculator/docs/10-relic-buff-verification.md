---
last-verified: 2026-06-11
sources:
  - app/stores/damageCalculator/calcUtils/relicUtils.ts
  - app/stores/damageCalculator/slices/calculatorSlice.ts
  - app/stores/gameDataStore.ts
  - app/modules/Tool/DamageCalculator/calculator/debug/print-relics-info.ts
  - app/modules/Tool/DamageCalculator/calculator/helper.ts
  - app/modules/Tool/DamageCalculator/calculator/impls.ts
  - app/modules/Tool/DamageCalculator/calculator/buff-context.ts
  - app/modules/Tool/DamageCalculator/calculator/ast/index.ts
  - app/modules/Tool/DamageCalculator/calculator/blackboard.ts
  - app/modules/Tool/DamageCalculator/utils.ts
  - app/modules/Tool/DamageCalculator/TopicSpecSection/components/use-rogue5-topic-spec-items.ts
  - app/types/gameData.ts
---

# 10 新增藏品 buff 量自动验证设计

> 状态：**设计文档**。本篇描述的报告脚本与 CI 均尚未实现；当前唯一可用的验证手段是浏览器控制台的人工核对（见 [07-debugging.md](07-debugging.md)）。实施顺序见第 6 节。

目标场景：上游数据更新后，**自动**识别本次新增的藏品/通宝，判定每条 buff 被计算器以何种方式消化，输出"藏品 × 乘区 × 数值"的结构化报告供人工签核——把现在"在浏览器里逐个藏品点选、肉眼看 console.table"的人肉流程变成一条 `yarn test`/脚本命令。

## 1. 目标拆解

| 环节 | 做什么 | 技术依据 | 本篇章节 |
|---|---|---|---|
| ① 识别新增 | 新旧数据版本的 relicId 集合差集 | `getRelicsData` 产出的 id 表 | §4 |
| ② 判定消化方式 | 每条 buff 走了独立黑板 / 通用黑板 / 部分消化 / 完全未消化 | `isRelicBlackboard` + `applyAnyRelics` + `invalidRelics` | §4 |
| ③ 输出 buff 量 | 每条已消化 buff 在各乘区产生的数值 | `analyzeRelics` + 从 `printAdditionContext` 抽取的遍历纯函数 | §3、§5 |
| ④ 人工签核 | 对照游戏内文本确认数值 → 回填金值 → 销项 | 报告文件 + [09 篇](09-fixtures-and-baselines.md)回填流程 | §5.4 |

不在本篇范围：判定一个未消化藏品**应该**走通用黑板还是注册独立黑板（决策树在 [03-relic-adaptation-guide.md](03-relic-adaptation-guide.md)）；上游数据如何进到前端（见 [docs/data-pipeline.md](../../../../../docs/data-pipeline.md)）。

## 2. 技术入口：一条不依赖 React/zustand 的纯函数链

报告脚本不需要起页面。从原始数据到 buff 上下文的整条链路都是普通函数：

```
relics + items（bundle-ext 原始数据，gameDataStore 的 relics/items 字段同构）
  → getRelicsData(relics, items, rogueKey)        // relicUtils.ts：ItemData+RelicData 合并为 RelicDataExt
  → getRelicWrappers(relicsData) / wrapRelicData   // relicUtils.ts：补 layer/userActive 等包装字段
  → CalculatorHelper.analyzeRelics(...)            // helper.ts：真实生效判定 + 写入乘区
    或 applyAnyRelics(...)                          // debug/print-relics-info.ts：跳过生效判定，全量应用
  → BuffContext                                    // buff-context.ts：遍历产报告
```

`app/stores/damageCalculator/calcUtils/relicUtils.ts` 的 `getRelicsData` / `getRelicWrappers` 与 `calculator/debug/print-relics-info.ts` 的 `applyAnyRelics`、`calculator/helper.ts` 的 `CalculatorHelper.analyzeRelics` 都不读 store、不碰 React——线上 `calculatorSlice`（`app/stores/damageCalculator/slices/calculatorSlice.ts`）也是这样组合它们来预计算各主题的藏品禁用状态的。**这条链可以在 vitest 用例里直接调用**。

两个硬约束：

- **必须在 vite/vitest 体系内跑。** 独立黑板的注册是 `calculator/blackboard.ts` 顶层副作用，靠 `calculator/index.ts` 的 `export *` 触发；干员实现注册靠 `import.meta.glob`（vite 编译期 API）。纯 node/ts-node 脚本拿到的是空注册表且**无任何报错**——所以报告脚本推荐写成 vitest 用例或经 vitest 入口执行，而不是 `package.json` 里的裸 node 脚本。详见 [docs/testing.md](../../../../../docs/testing.md)。
- 原始数据来源：脚本输入是两份 `{ relics, items }` JSON（旧版本基准 + 新版本），如何从后端 bundle-ext 拿到并固化版本标识，见 [docs/data-pipeline.md](../../../../../docs/data-pipeline.md)（数据版本可观测性目前是缺口）。

> ⚠️ **`applyAnyRelics` 跳过 `isActive`，只能回答"黑板实现了没有"，不能回答"数值是多少"。** 它对每个 buff 无条件 `apply`，互斥 buff 会同时生效（`printRelicsInfo` 的 `@deprecated` 注释明言此事）；同一藏品三档词条会全部叠进同一乘区。它的正确用途有且只有"消化方式判定"（§4）——线上 `getRogue5Coppers`（`TopicSpecSection/components/use-rogue5-topic-spec-items.ts`）判定通宝是否置灰、`calculatorSlice` 预计算藏品 disabled，用的都是这个语义。**报告中的数值列必须走 `analyzeRelics` 真实路径**（带真实的 `charData`/`charInput`/`enemyData`/`stageData` 生效判定）。

由"数值必须走 `analyzeRelics`"推出一个设计必需品——**基准档案（profile）**：`analyzeRelics` 的生效判定依赖具体干员（职业/子职业选择器）与敌人（`enemyData` 是签名必填），同一藏品对近卫干员生效、对术师不生效。因此报告数值只在"指定干员 + 指定敌人 + 指定 rogueInput"的档案下有意义，档案必须写进报告头（§5.1 的 `profile` 字段）。建议每主题维护 1~3 个覆盖面互补的基准档案（如物理近卫 + 法术术师 + 普通敌人）；在所有档案下都未激活、但 §4 判定为已消化的 buff，在报告中标"基准档案未触达"，留给人工补测。

## 3. 乘区遍历：从 printAdditionContext 抽取纯函数

`CalculatorHelper.printAdditionContext`（`calculator/helper.ts`）已经实现了报告所需的核心遍历：按乘区组遍历 `BuffContext`，把每个 AST 节点按 `tooltip`（写入时统一填藏品中文名）聚合成"藏品 × 乘区"矩阵，最后补上未生效藏品行——但它输出的是 `console.table`，只能人眼看。`CalculatorHelper.printRelic` 则是反向查询：给定藏品名，扫全部乘区组的第一层 children 取 `calculate()` 值。

第一步改造就是把这套遍历逻辑抽成返回结构化数据的纯函数（放 `calculator/debug/` 或新建 `calculator/report/`，**不要改动现有两个 print 方法的行为**，UI/控制台调试还在用它们）：

```ts
/** 设计草案 */
interface RelicEffectEntry {
  relicName: string;            // = 节点 tooltip
  group: keyof IBuffContext;    // 乘区组名，如 "relic_rune_mul"
  slot: string;                 // 组内槽位，如 "atk" / "enemy_max_hp"
  value: number;                // 该节点 calculate() 的结果（不含基数）
}
function collectRelicEffects(context: BuffContext): RelicEffectEntry[];
```

实现要点（均为现有两个 print 方法已验证的细节）：

- 遍历 `Object.entries(context)`，跳过数组字段（`invalidRelics`）；每组每槽位是一个 `ExpressionGroupNode`，取其**第一层** `children`，每个 child 产出一条 entry；
- 过滤 `tooltip === "基数"` 的占位节点（乘算组以 1、union/max 组以 0 起步）；
- child 本身可能是嵌套的 `ExpressionGroupNode`（如肉鸽难度的逐层指数组），`calculate()` 对组节点同样有效，不需要递归展开。

> ⚠️ 三个坑：
>
> 1. **`printAdditionContext` 只遍历了 8 组乘区中的 6 组**（`relic_rune_add`、`relic_rune_mul`、`in_game_buff_add`、`in_game_buff_mul`、`in_game_buff_final_add`、`in_game_buff_final_mul`），漏掉 `stage_rune_mul` 与 `global_buff_stack`——直接写入 `global_buff_stack` 的独立黑板（如增伤类）在现有表格里**根本不显示**。抽纯函数时必须遍历全部 8 组，否则继承这个盲区。
> 2. **`global_buff_stack` 与 `in_game_buff_final_mul` 共享节点引用。** `analyzeRelics` 末尾把 `in_game_buff_final_mul` 的 `enemy_damage_scale_phy/mag/pure` 三个组节点原样 `addChild` 进 `global_buff_stack` 的对应槽位。只遍历第一层 children 时不会重复计数（嵌套组在 `global_buff_stack` 里的 tooltip 是"敌人物理易伤"这类组名而非藏品名），但任何递归展开的实现都必须对这三个槽位去重。
> 3. **`tooltip` 是唯一可靠的归属标识。** `NumericLiteralNode` 构造器有第三参 `source?: { relic, buff }`，但只有通用干员黑板的部分写入路径填了它，独立黑板、`analyzeRogueDifficulty` 等大量路径不填——不要依赖 `source` 做归属，统一按 `tooltip === relic.name` 匹配（与两个 print 方法一致）。

**buff 级归属**：节点只带藏品名，分不清来自同一藏品的哪条 buff。解法是对每条 buff 构造单 buff 副本逐一应用：`applyAnyRelics([{ ...relic, buffs: [buff] }])`，产出的节点即可绑定到 `buffIndex`。注意个别独立黑板依赖 `relics` 全集扫描（套装计数类），单 buff 副本下语义会变——但这类黑板既已注册，消化方式判定不受影响，其数值报告走 §2 的 `analyzeRelics` 真实路径（传完整藏品列表）即可。

**层数语义探测**：通用黑板的局内分支无条件乘 `relic.layer`，局外分支仅 `layer_` 前缀 key 才乘（双轨细节见 [03-relic-adaptation-guide.md](03-relic-adaptation-guide.md)）。报告对 `hasLayer`（`relicUtils.ts` 的 `relicHasLayer` 判定）的藏品用 `layer=1` 与 `layer=2` 各跑一次，数值翻倍者标 `perLayer`，不变者标 `fixed`，其余标 `unknown` 交人工。

## 4. 新旧版本 diff 与"未消化新藏品"告警

### 4.1 识别新增

对新旧两份数据各跑 `getRelicsData(relics, items, rogueKey)`，取键集差集：`新增 = keys(new) − keys(old)`。通宝与藏品同表同构，按现行约定以 `id.includes("copper")` 区分并在报告里标记 `isCopper`（这一识别约定的细节与坑由 [05-topic-spec-and-enemy-spec.md](05-topic-spec-and-enemy-spec.md) 负责）。同时建议输出"变更"清单（id 相同但 `buffs` 深比较不等）——上游对存量藏品的数值调整同样需要签核。

### 4.2 必须覆盖的静默失败模式

> ⚠️ 这套系统最危险的不是报错，是**不报错**。三种静默模式（均已对照源码核实）：
>
> 1. **未注册键的空实现兜底**：`calculator/impls.ts` 的 `getRelicBlackboard` 对未注册键返回 `{ isActive: () => true, apply() {} }`，且 `console.warn` 被注释——任何绕过 `isRelicBlackboard` 守卫直接取黑板的调用路径都会"看似生效、实际无效果"。
> 2. **部分消化**：真实分发里（`CalculatorHelper.applyRelic`），带 `key=='key'` 词条但未注册的 buff 会**落入通用黑板**——通用黑板把它认识的词条（atk/max_hp 等）吃掉、把特殊语义（生效条件、特殊乘区）丢掉，全程无警告。新藏品"数值有但条件不对/缺一半效果"多源于此。
> 3. **键拼写错误**：注册键取自 buff 黑板中 `key=='key'` 词条的 `valueStr`（不是 `buff.key`、不是藏品 id）；注册时拼错键，效果同模式 2。

### 4.3 消化方式判定算法

对每个新增藏品的每条 buff（`buffIndex` 为其在 `relic.buffs` 中的下标）：

1. 提取 `blackboardKey = buff.blackboard.find(b => b.key === "key")?.valueStr ?? null`；
2. 若 `isRelicBlackboard(buff)` 为 true → **`registered`**（已有独立黑板）；
3. 否则跑 `applyAnyRelics([{ ...relic, buffs: [buff] }])`，收集 `tooltip === relic.name` 的节点：
   - 有节点且 `blackboardKey === null` → **`generic`**（通用黑板完整消化的候选——仍需人工确认词条没有被白名单截断）；
   - 有节点但 `blackboardKey !== null` 且未注册 → **`partial`**（模式 2 的部分消化，**最高优先级告警**）；
   - 无节点 → **`none`**（完全未消化）。`none` 再细分：在 `disallowedRelicNames`/`disallowedValueStrs` 黑名单中（`utils.ts`，有意排除，低优先级）；或出现在 `context.invalidRelics`（`buff-context.ts` 的 `BuffContext.invalidRelics`，通用黑板一个词条都没吃下时由 `commonCharRelicBlackboard.apply` / `commonEnemyRelicBlackboard.apply` 推入）；
4. `partial` 与非黑名单 `none` 进入"未消化新藏品告警清单"，对应动作是走 [03-relic-adaptation-guide.md](03-relic-adaptation-guide.md) 的接入决策树。

注意 `invalidRelics` 的粒度是藏品而非 buff，且同一藏品可能被多条 buff 各推一次（有重复）；判定算法以"单 buff 副本是否产出节点"为准，`invalidRelics` 只作佐证。

## 5. 报告 schema 与签核流程（本篇核心增量）

### 5.1 JSON schema

报告是机器可 diff 的事实记录，schema 如下（JSON Schema draft-07 表意）：

```json
{
  "title": "RelicBuffVerificationReport",
  "type": "object",
  "required": ["dataVersion", "baseDataVersion", "generatedAt", "topic", "profile", "entries"],
  "properties": {
    "dataVersion":     { "type": "string", "description": "新数据版本标识（解包仓库 commit / bundle-ext 抓取时间）" },
    "baseDataVersion": { "type": ["string", "null"], "description": "diff 基准版本；null 表示全量报告" },
    "generatedAt":     { "type": "string", "format": "date-time" },
    "topic":           { "type": "string", "description": "肉鸽主题 key，如 rogue_5" },
    "profile": {
      "type": "object",
      "description": "数值列生效的基准档案（见 §2）",
      "properties": {
        "charName":   { "type": "string" },
        "enemyId":    { "type": "string" },
        "difficulty": { "type": "integer" },
        "layer":      { "type": "string" }
      }
    },
    "entries": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["relicId", "name", "buffIndex", "digestion", "signedOff"],
        "properties": {
          "relicId":       { "type": "string" },
          "name":          { "type": "string", "description": "藏品中文名（= AST 节点 tooltip）" },
          "isCopper":      { "type": "boolean", "description": "id.includes(\"copper\")" },
          "buffIndex":     { "type": "integer", "description": "buff 在 relic.buffs 中的下标" },
          "buffKey":       { "type": "string", "description": "buff.key 原文" },
          "blackboardKey": { "type": ["string", "null"], "description": "key=='key' 词条的 valueStr（独立黑板注册键）" },
          "digestion":     { "enum": ["generic", "registered", "partial", "none"] },
          "blacklisted":   { "type": "boolean", "description": "digestion=none 时：是否位于 disallowed 名单（有意排除）" },
          "effects": {
            "type": "array",
            "description": "digestion≠none 时：该 buff 在各乘区产生的数值（analyzeRelics 真实路径，基准档案下）",
            "items": {
              "type": "object",
              "required": ["group", "slot", "value", "layerSemantics"],
              "properties": {
                "group": { "enum": ["stage_rune_mul", "relic_rune_add", "relic_rune_mul",
                                     "in_game_buff_add", "in_game_buff_mul",
                                     "in_game_buff_final_add", "in_game_buff_final_mul",
                                     "global_buff_stack"] },
                "slot":  { "type": "string", "description": "乘区内槽位，如 atk / enemy_max_hp" },
                "value": { "type": "number", "description": "layer=1、基准档案下节点 calculate() 的值" },
                "layerSemantics": { "enum": ["fixed", "perLayer", "unknown"] }
              }
            }
          },
          "notReachedByProfile": { "type": "boolean", "description": "已消化但在基准档案下未激活（数值列为空的原因）" },
          "usage":     { "type": "string", "description": "游戏内效果文本，签核对照用" },
          "signedOff": { "type": "boolean", "description": "人工签核标记，生成时恒为 false" },
          "note":      { "type": "string", "description": "签核人备注/销项去向" }
        }
      }
    }
  }
}
```

字段对应的术语口径：乘区组名与 [02-buff-context-and-formulas.md](02-buff-context-and-formulas.md) 的乘区定义一致；`digestion` 四值分别对应"通用黑板 / 独立黑板 / 部分消化 / 未消化"。

### 5.2 markdown 报告模板

JSON 给机器，markdown 给签核人。从同一份 JSON 渲染：

```markdown
# 新增藏品 buff 量验证报告 — <dataVersion>（基准 <baseDataVersion>）

- 生成时间：…　主题：rogue_5　基准档案：干员=赫德雷，敌人=…，难度=N15，层数=layer_3
- 新增藏品 N 个 / 通宝 M 个；待签核条目 K 条，其中告警（partial/none）J 条

## 告警清单（先处理）
| 藏品 | buff | 注册键 | 消化方式 | 游戏内文本 | 处置 |
|---|---|---|---|---|---|
| 某新通宝 | 0 | rogue_5_xxx | partial | …… | → 03 决策树，注册独立黑板 |

## 待签核数值
| 藏品 | buff | 消化方式 | 乘区 | 槽位 | 数值 | 层数语义 | 游戏内文本 | 签核 |
|---|---|---|---|---|---|---|---|---|
| 某新藏品 | 0 | generic | relic_rune_mul | atk | 0.15 | perLayer | 攻击力+15% | ☐ |
```

### 5.3 存放路径

推荐 `test/DamageCalculator/reports/<dataVersion>/<topic>.report.json`（+ 同名 `.md`），随仓库提交。理由：报告是**数据版本维度**的事实快照，和夹具同属测试资产，按版本归档天然支持回溯"某藏品是哪个版本签核的"。不放 `docs/generated/`——那里是 `yarn docs:gen` 从**当前源码**再生的内容、CI 要校验"与源码一致"，而报告与某个历史数据版本绑定、再生没有意义，混放会破坏 generated 目录"可随时删掉重建"的约定。

### 5.4 人工签核流程

报告生成后逐条走完才算闭环：

1. **确认数值**：对照 `usage` 游戏内文本（必要时游戏内实测）核对每条 effect 的乘区与数值；通过则 `signedOff: true`。对不上的先查第 7 节的笔误登记簿，再怀疑黑板实现。
2. **回填金值**：签核通过且影响存量金值的（新藏品被纳入既有用例场景、或存量藏品数值变更），按 [09 篇 §3.3](09-fixtures-and-baselines.md) 的流程回填基线；签核确认的数值是回填的对账依据。
3. **销项**：`partial`/`none` 告警转为适配任务（走 [03](03-relic-adaptation-guide.md) 接入），完成后**重新生成报告**确认该条目变为 `generic`/`registered`，在 `note` 记录去向；全部条目 `signedOff` 后报告随 PR 入库，本次数据更新的验证流程结束。

## 6. 实施路线

| 阶段 | 内容 | 前置 |
|---|---|---|
| 0 | **修绿基线**：按 [09 篇](09-fixtures-and-baselines.md)重建 4 份夹具与用例，`yarn test` 全绿 | 无 |
| 1 | **报告脚本**：抽 `collectRelicEffects` 纯函数（§3）→ 实现 diff 与消化判定（§4）→ 产出 §5 双格式报告；以 vitest 用例形态落地（§2 的 vite 体系约束），输入的新旧数据 JSON 路径走环境变量或 CLI 参数 | 阶段 0（报告里的 analyzeRelics 数值路径依赖与金值同一套管线被验证过） |
| 2 | **CI**：仓库当前**没有 `.github/workflows`、没有 git hooks**（2026-06-11 复核），一切验证靠人手跑。最小起步是 PR/push 跑测试（见下）；"数据更新自动触发报告生成"则受阻于数据版本可观测性缺口（无版本端点，见 [docs/data-pipeline.md](../../../../../docs/data-pipeline.md)），需先立 ADR 决定版本来源，暂不纳入 | 阶段 0 |

最小 workflow 建议（`.github/workflows/test.yml`）：

```yaml
name: test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: yarn }
      - run: yarn install --frozen-lockfile
      - run: yarn test
```

> ⚠️ 仓库同时存在 `yarn.lock` 与 `pnpm-lock.yaml`，CI 选定 yarn（README 约定）意味着锁文件歧义必须先收敛，否则 CI 与本地装出来的依赖树可能不同——现状与建议见 [docs/testing.md](../../../../../docs/testing.md)。

## 7. 已知笔误对账提示

> ⚠️ 自动报告的数值与游戏内文本对不上时，**不要先怀疑报告脚本**——计算器侧存在已确认的手抄笔误与缺陷（如岁时/天象配置中寅诗的残缺 key、通宝数值抄录错误等），它们会让"正确读取了错误数据"的报告看起来像 bug。逐项登记与修复状态见 [known-issues.md](known-issues.md)；对账流程遇到差异时按"先查登记簿 → 再查上游数据 → 最后查脚本"的顺序排除。反过来，报告脚本也是发现新笔误的工具：签核中确认的新笔误应同步登记到 known-issues.md，使其成为下次对账的已知项。
