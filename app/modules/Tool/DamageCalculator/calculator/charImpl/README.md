# charImpl —— 干员特化计算实现

每个干员一份文件。**命名铁律**（违反即静默失效）：

- 文件名（去 `.ts`）**必须严格等于 `charData.name`**（干员中文名）——它就是注册键，`calculator/calculator.ts` 按 `charData.name` 查表。
- 文件**必须放在某个职业子目录内**（如 `近卫/`、`狙击/`）。`calculator/index.ts` 的 `import.meta.glob("./charImpl/*/**.ts")` **只扫子目录，不扫本根目录**——直接放在 `charImpl/` 下不会被注册。
- 改名 / 移动 = 静默解除注册：计算输出全零、仅一条 `console.warn`，UI 不报错。

新增/修改干员实现的完整步骤、标准模板、乘区读取样板与收尾 checklist 见 [docs/04-char-impl-cookbook.md](../../docs/04-char-impl-cookbook.md)。
