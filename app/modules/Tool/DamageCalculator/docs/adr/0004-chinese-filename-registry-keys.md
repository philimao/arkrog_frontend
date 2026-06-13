---
status: 补记
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/calculator/index.ts
  - app/modules/Tool/DamageCalculator/calculator/impls.ts
  - app/modules/Tool/DamageCalculator/calculator/calculator.ts
  - app/modules/Tool/DamageCalculator/calculator/blackboard.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/Hoederer_beta.ts
---

# ADR-0004：注册键采用中文文件名与数据字符串，而非 ID

| | |
|---|---|
| 状态 | 补记（2026-06-11） |
| 决策归属 | 原作者（未记录，由代码考古补记） |

## 背景

两类扩展点需要"按数据内容找到对应实现"：干员 → 计算脚本，藏品 buff → 独立黑板。上游解包数据有稳定的 ID（`charId` 如 `char_4088_hodrer`、藏品 id），但 UI 展示、调试输出与日常沟通全用中文名；用 ID 做键则每次对照都要查表。

## 决策

两套注册表都用"游戏域字符串"做键：

1. **干员实现**：`calculator/index.ts` 用 `import.meta.glob("./charImpl/*/**.ts", { eager: true })` 自动注册，键 = 文件路径最后一段去掉 `.ts`，即中文文件名（`charImpl/<职业>/<干员中文名>.ts`）；查找方是 `calculator/calculator.ts` 的 `calculator`，按 `input.charData.name` 取实现。**文件名必须严格等于 `charData.name`**。
2. **独立黑板**：`calculator/blackboard.ts` 顶层数十处（写作时 38 处）`registerRelicBlackboard(key, ...)` 调用，靠模块加载副作用完成注册；键 = buff 黑板中 `key == "key"` 词条的 `valueStr`（如 `damage_scale[caster]`）；查找方是 `calculator/impls.ts` 的 `getRelicBlackboard`，buff 无该词条时回退键 `"char"`。

## 后果

正面：新增一个干员/独立黑板就是"建一个中文名文件 / 抄一个 valueStr"，无需维护映射表；调试日志与 UI 直接可读。

负面全部是**静默失效**模式：

| 失效模式 | 触发方式 | 表现 |
|---|---|---|
| 干员文件改名 | 文件名 ≠ `charData.name`（含上游改译名） | `getCalculatorImpl` 仅 console.warn 并返回全 0 输出，UI 不报错 |
| 文件放错位置 | 文件放在 `charImpl/` 根目录而非子目录 | glob 模式要求至少一层子目录，模块根本不被加载（实例：`Hoederer_beta.ts` 文件内的 `registerCalculatorImpl` 永不执行） |
| 黑板键写错/未注册 | `getRelicBlackboard` 查不到键 | 返回 `isActive` 恒真 + `apply` 空实现的 no-op，**且未注册告警被注释掉**——藏品"看似生效实际无效果" |
| 上游数据改字符串 | `charData.name` 或 `valueStr` 变更 | 同上，整条链路无任何报错 |

> ⚠️ 这是本模块最危险的失败模式：改名不会编译报错、不会运行时报错，只会让数值静默归零或增益静默消失。重命名 `charImpl` 文件、移动文件位置、修改 `registerRelicBlackboard` 的键，三者都属于高危操作。接入流程详见[藏品接入手册](../03-relic-adaptation-guide.md)与[干员实现 Cookbook](../04-char-impl-cookbook.md)。

## 重启条件

若要改用 ID 做注册键，需先满足：

1. 生成式对账工具上线：`generated/char-impl-coverage.md`（干员×技能覆盖矩阵）与 `generated/relic-blackboard-registry.md`（已注册黑板清单）由脚本从源码导出，CI 校验"每个文件名都能在当前游戏数据中找到对应 `charData.name`"，作为迁移期间的失配探测器；
2. 恢复 `getRelicBlackboard` 的未注册告警（或等价的注册校验测试），保证迁移中任何键失配可见而非静默；
3. 一次性同步迁移两套注册表的全部注册点与查找方，并保留中文名 ↔ ID 映射表供调试输出使用——半迁移状态（一套 ID 一套中文名）比现状更糟。
