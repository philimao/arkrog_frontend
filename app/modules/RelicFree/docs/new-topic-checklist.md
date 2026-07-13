---
last-verified: 2026-07-13
sources:
  - app/types/gameData.ts
  - app/types/constant.ts
  - app/utils/stageSelector.ts
  - app/components/Character/Enemy/EnemyAvatar.tsx
  - app/components/RecordCard/RecordCard.tsx
  - app/modules/RelicFree/Selector/index.tsx
  - app/modules/RelicFree/Selector/SelectorBanner.tsx
  - app/modules/RelicFree/Selector/SelectorDetail.tsx
  - app/modules/RelicFree/Stage/SubmitRecordForm.tsx
  - public/images/card/
  - ../arkrog_backend/utils/gamedata/buildGameData.js
  - ../arkrog_backend/utils/gamedata/enemy.js
  - ../arkrog_backend/utils/gamedata/enemyModify/rogue_5.js
  - ../arkrog_backend/utils/appData/shared.js
  - ../arkrog_backend/utils/appData/stagePreview.js
  - ../arkrog_backend/util-scripts/updateGameData.ts
  - ../arkrog_backend/routers/admin.js
  - ../arkrog_backend/routers/relic-free.js
  - ../arkrog_backend/public/images/topic_banner/
---

# 新增肉鸽主题（ro6+）无藏侧上线手册

本手册列出新主题（下文以 `ro6` / `rogue_6` 为例）接入无藏收录的**两仓库全部散点改动**。与[计算器侧新主题手册](../../Tool/DamageCalculator/docs/new-topic-checklist.md)是两份独立清单（散点集不重叠，互链不合并）——新主题完整上线两份都要走完。

三条开工前警告：

> ⚠️ **新主题数据一到位，就立即成为无藏首页的默认主题。**
> `app/modules/RelicFree/Selector/index.tsx` 无 `topicId` 参数时取 `Object.values(topics).slice(-1)[0]`——后端 `topics` 的最后一项。也就是说数据回填先于代码散点部署的话，用户第一眼看到的就是残缺页面（Boss 层消失、banner 破图、卡片无装饰）。**先部署代码散点，再回填数据。**

> ⚠️ **回填依赖的写路径曾断裂近 8 个月。**
> `fc2f75f`～`790afd6` 区间的后端代码无法执行本手册的数据回填（`yarn update-data` 因 `stageEnemies.js` 的失效 import 整体无法启动，admin 全量重算必 500）。本地 HEAD（`790afd6`，2026-07-13）已修复；执行回填前确认目标服务器已部署至含该修复的版本，历史断裂期的数据回填流程见 [07-ops-runbook.md](07-ops-runbook.md)。

> ⚠️ **`ro10` 会击穿单字符主题号假设**，见文末[专节](#ro10roguekey-单字符假设的击穿点)。

绝大多数散点漏改**不产生任何报错**——每项都标注了静默失败的具体表现。值快照见 [generated/hardcode-snapshot.md](generated/hardcode-snapshot.md)。

## 改动总览

| # | 仓库 | 文件 + 符号 | 要做什么 | 漏改的静默失败表现 |
|---|---|---|---|---|
| 1 | 后端 | `utils/gamedata/buildGameData.js` 的 `names_en` | 按位置追加新主题英文名 | banner 英文装饰行空白（回退 `""`） |
| 2 | 后端 | `utils/gamedata/buildGameData.js` 的 `hiddenEnemies` | 追加新主题需从"代表敌人"分析中排除的敌人 id | 同名关 TYPE 角标 tooltip 展示无区分度的敌人 |
| 3 | 后端 | `utils/appData/shared.js` 的 `numOfZone3Boss` / `numOfZone5Boss` / `numberOfZone67Boss` | 三张表各加 `ro6` 键 | `skipStage` 对 Boss 关失效（三层小 Boss 混入数据），面包屑层数/结局显示 `误入奇境`/`undefined结局` |
| 4 | 后端 | `utils/appData/stagePreview.js` 的 `preload` 与 `buildPreloadData` | 特殊关预载文案（带船类 `boatDesc` 等）；新类型码需加面包屑分支 | 关卡页无带船描述块；新类型码关面包屑缺失（只剩主题名） |
| 5 | 后端 | `utils/gamedata/enemyModify/rogue_6.js` + `utils/gamedata/enemy.js` 的 `processEnemyData` | 新建主题敌人修正模块并在 `processEnemyData` 加 `levelId.includes("rogue6")` 接线 | 主题特供敌人（陷阱转化敌人、隐藏敌人）不出现在敌方情报与代表敌人候选中 |
| 6 | 后端 | `public/images/topic_banner/rogue_6.jpg` | 上传主题 banner 图 | 选择页顶部 banner 破图（`img` 无 onError 兜底） |
| 7 | 前端 | `app/types/gameData.ts` 的 `RogueKey` 与 `RogueTopic` | 联合类型与枚举各加 `rogue_6` | 类型撒谎：运行时数据存在但 `Record<RogueKey,...>` 缺键，后续索引全靠 `as` 断言蒙混 |
| 8 | 前端 | `app/types/constant.ts` 的 `topicMaxLevels`（连带核对 `StageLevels`） | 加 `[RogueTopic.ROGUE_6]: "N18"`（或该主题实际难度上限） | 提交表单难度下拉失去默认选中（不阻断提交，靠用户手选）；若主题引入新难度档还需扩 `StageLevels` |
| 9 | 前端 | `app/utils/stageSelector.ts` 的 `numOfMinorBoss`（连带核对 `navOfZone` 特判与 `excludeIds`） | 表加 `ro6` 键；若主题有第 7 层 / `sv` 式新区域 / 新类型码，扩对应筛选器 | **险路恶敌组整组消失**（查表 undefined 回退 99，全部 Boss 编号判为小 Boss）；新区域/新类型码关卡不被任何筛选器命中，静默不渲染 |
| 10 | 前端 | `app/components/Character/Enemy/EnemyAvatar.tsx` 的 `preset` 与 `enemyNameTransform` | prts.wiki 无头像的主题特供敌人：上传 COS 并登记 preset；wiki 命名不一致的敌人加转换映射 | 敌方情报/TYPE tooltip 显示"无图片占位符"图 |
| 11 | 前端 | `public/images/card/` 的 `rogue_6_deco_l.png` / `rogue_6_deco_r.png` / `rogue_6_logo.png` | 补记录卡三件装饰图 | 记录卡左上/右下装饰与主题 logo 静默空白（CSS 背景图 404 不报错）。**现行实例：`rogue_5` 三图至今缺失，界园记录卡即此状态** |

## 后端散点细节

### 1. `names_en`——按位置索引的英文名表

`buildGameData` 用 `names_en[parseInt(topics[tp].id.slice(-1)) - 1] || ""` 给每个主题填 `name_en`。这是**位置数组**：`rogue_6` 取下标 5，必须恰好是第 6 个元素。消费方是 `SelectorBanner` 的英文装饰行（蓝色下划线那行）。漏改回退空串，banner 只少一行字，极易漏测。（`slice(-1)` 的 `rogue_10` 问题见文末专节。）

### 2. `hiddenEnemies`——代表敌人分析的排除名单

`buildGameData` 对同 `stageName` 组做敌人差集分析生成 `stage.mainEnemy`（消费链见 [03-stage-taxonomy-and-selector.md](03-stage-taxonomy-and-selector.md) 第四节）。名单里是不应作为"代表敌人"的彩蛋/通用敌人（现有条目如 `enemy_2001_duckmi`）。新主题若有这类敌人不排除，同名关 TYPE 角标的 tooltip 会选中它们展示。

### 3. 三张 Boss 数量表——数据侧收录范围的根

`skipStage` 靠 `numOfZone3Boss[args[0]]` 判断 Boss 关是否略过；查表 undefined 时 `bossNum <= undefined` 恒 false → **所有 Boss 关（含三层小 Boss）都进 stage-preview / stage-enemies**。`buildPreloadData` 同时用三张表折算层数与结局：缺键时结局序数是 `NaN`，面包屑渲染成 `// 误入奇境 // undefined结局` 直接暴露给用户。

改这里必须**同 PR 同步前端** `app/utils/stageSelector.ts` 的 `numOfMinorBoss`（第 9 项），两表同值双份的完整同步义务见 [03-stage-taxonomy-and-selector.md](03-stage-taxonomy-and-selector.md) 第三节。

### 4. `stagePreview.js` 的 preload 文案与面包屑分支

- `preload` 对象按 stageId 写死特殊关的预载字段（现有唯一条目是 `ro4_b_4` 的带船描述 `boatDesc`）。新主题的"带船"类机制要在这里补条目——`StageDetail` 的"带船"描述块读的就是 `stagePreview[id].boatDesc`。
- `buildPreloadData` 的面包屑分支按类型码写死文案。两点注意：新类型码（类似界园的 `sv`）不加分支则面包屑为空；`sv` 分支的文案写死"岁兽残识 · 是非境/今昔境"，**新主题若复用 `sv` 类型码会顶着界园文案**——需要加主题条件或新码。

### 5. `enemyModify/rogue_6.js` 与 `processEnemyData` 接线

主题特供敌人（如界园的雕伥——由 `character_table` 陷阱数据经 `convertTrapToEnemyData` 转化、怪葫芦——从 `enemy_database` 手工注入）按主题放在 `utils/gamedata/enemyModify/rogue_N.js`。**光建文件不生效**：`utils/gamedata/enemy.js` 的 `processEnemyData` 里是写死的 `levelId.includes("rogue4")` / `includes("rogue5")` 分支 + import，新主题要加第三段接线（狭路关另有 `level_rogue\d_d-` 的跳过与 duel 专用修正的先例，照 `rogue5DuelModify` 模式）。漏改后果沿链路传导：stage-enemies 缺这些敌人 → 关卡页敌方情报不全；`mainEnemy` 候选缺失 → TYPE tooltip 失真。

### 6. `topic_banner/rogue_6.jpg`

前端 `SelectorBanner` 拼 URL `${VITE_API_BASE_URL}/images/topic_banner/${currentTopic.id}.jpg`，由后端静态目录承载。`img` 标签**没有 onError 兜底**，缺图就是浏览器默认破图图标叠在深灰底上。

## 前端散点细节

### 7. `RogueKey` / `RogueTopic`——类型层先行

与计算器侧同一对类型（`RogueKey` 已标 `@deprecated` 但仍被 `stages`/`topics` 等 Record 键广泛使用，两者都要加）。无藏侧几乎所有 `stages[rogueKey]` 索引都经 `as RogueKey` 断言，**加不加成员都不会有编译错误**——这一步的价值是让类型不撒谎，而不是让编译器帮你找漏。

### 8. `topicMaxLevels` 与 `StageLevels`

`SubmitRecordForm` 用 `topicMaxLevels[rogueKey]` 做难度下拉的默认选中（`defaultSelectedKeys={[maxLevel]}`）。缺键时 `maxLevel` 为 undefined，下拉无默认值——表单仍可提交（字段 required），但"默认最高难度"的引导消失，实际提交里低难度误标的比例会上升。若新主题难度档位体系有变（不止 N0/N15/N18），还要动 `StageLevels`，那会波及后端 `calculateOptimalNum` 的难度序列与徽标 reduce 序列，见 [version-sensitive-hardcode.md](version-sensitive-hardcode.md) 难度体系条目。

### 9. `numOfMinorBoss` 与 `navOfZone` 特判

- `numOfMinorBoss` 加 `ro6` 键，值与后端 `numOfZone3Boss` 一致。漏改是本清单**用户可见度最高的静默失败**：险路恶敌筛选组整组消失（查表回退 99，所有 Boss 编号都 ≤ 99 被判小 Boss），且筛选按钮本身也因组内无关卡而不渲染——页面看起来"正常只是没有 Boss 层"。
- 逐条核对 `navOfZone` 是否覆盖新主题的关卡形态：有第 7 层 → 现有 `args[2]==="7"` 特判已兜住（无主题条件）；有 `sv` 式 DLC 区域 → 组名"是非境/今昔境"是写死的界园文案，需要新组或改名；有全新类型码 → 必须加筛选器，否则整类关卡静默不可见（`fs` 渡劫关就是现存的"无人认领"先例）。语义细节见 [03-stage-taxonomy-and-selector.md](03-stage-taxonomy-and-selector.md) 第二节。
- 新主题若有"误入奇境"类超编号 Boss 关需要隐藏，加 `excludeIds`（先例 `ro4_b_9`）。

### 10. `EnemyAvatar` 的 `preset` 与 `enemyNameTransform`

敌人头像默认走 prts.wiki 的 `头像_敌人_{名}.png`（MD5 哈希路径，机制见 [version-sensitive-hardcode.md](version-sensitive-hardcode.md)）。两类新主题敌人需要人工介入：

- **wiki 上没有头像的特供敌人**（陷阱转化类如雕伥、"岁躯"）：手工把头像上传到 COS 的 `/images/rogue_6/` 目录，并在 `preset` 里按现有 rogue_4（`.png`）/ rogue_5（`.webp`）的 reduce 模式登记名单——注意两批先例的扩展名不同，新批次自行统一；
- **wiki 命名与解包名不一致的敌人**：加 `enemyNameTransform` 映射（先例：`鼠王` → `“鼠王”` 的引号差异）。

漏登记的表现完全一致：头像 onError 回退到写死的 prts"无图片占位符"图，无控制台可读报错。

### 11. `public/images/card/` 装饰三图

`RecordCard` 按 `"rogue_" + stageId 首段末字符` 拼三张背景图：`{ro}_deco_l.png`（左上装饰）、`{ro}_deco_r.png`（右下装饰）、`{ro}_logo.png`（主题 logo）。CSS `background-image` 404 静默不绘制。**本篇核实时 `rogue_5` 三图即缺失**——界园记录卡当前就没有装饰层和 logo，可作为漏改效果的实物参照（修复它是独立工作项）。

## 数据回填顺序

散点代码全部就位后，按以下顺序回填（顺序错误的典型症状：用户先于数据看到残缺默认主题、或缓存吐旧数据）：

1. **部署两仓库代码**。后端部署重启即隐式全量重建内存/Redis 缓存；确认后端版本 ≥ `790afd6`（否则第 2 步无法启动）。
2. **后端跑 `yarn update-data`**（生产库用 `yarn update-data:prod --yes`；上游解包仓库未拉取时加 `--pull`）。脚本七步依次完成：清 dumpdata/leveldata 缓存 → `buildGameData` → 清 gamedata 缓存 → `stageEnemiesUpdate` → `stagePreviewFullUpdate` → `warmUpCache`，与线上服务共享 Redis，跑完即生效。
3. **如第 2 步用了 `--skip-preview`（或此后需要单独重算预览）**：以 Level 4+ 管理员会话 `POST /admin/calculate-stage-preview` 触发全量重算（curl 示例见 [07-ops-runbook.md](07-ops-runbook.md)）。
4. **无痕窗口验证**。`/relic-free/bundle` 带 24 小时强缓存（`strongCacheMiddleware(86400)`，见 `routers/relic-free.js`），常规窗口会吐旧 bundle；无痕窗口从零缓存开始才能验证全链路。核对清单：
   - banner 图与英文名行（散点 1、6）；
   - 层筛选按钮齐全、险路恶敌组有 Boss 关（散点 3、9）；
   - 关卡卡片面包屑无 `undefined`、无"误入奇境"误报（散点 3、4）；
   - 关卡页敌方情报含特供敌人且头像不是占位符（散点 5、10）；
   - 提交表单难度默认选中为主题上限（散点 8）；
   - 提交一条测试记录，记录卡三件装饰齐全（散点 11），2 秒后卡片徽标出现最少人数（验证增量重算链路，见 [06-data-pipeline.md](06-data-pipeline.md)）。

## ro10：rogueKey 单字符假设的击穿点

`ro` 前缀转 `rogue_` 键存在两种写法并存：多数调用点是 `"rogue_" + ro.slice(-1)`——**主题号到两位数（`ro10`）时产出 `rogue_0`**，关卡页首当其冲直接崩溃（`stages["rogue_0"]` 为 undefined 后的属性访问 TypeError）；仅 `SubmitRecordForm` 的 `replace("ro", "rogue_")` 写法安全。后端 `buildGameData` 的 `names_en` 索引（`id.slice(-1)`）同样击穿。分布点全量枚举以 [generated/hardcode-snapshot.md](generated/hardcode-snapshot.md) 为准；分歧成因与收敛建议见 [version-sensitive-hardcode.md](version-sensitive-hardcode.md)。

**ro10 主题上线前，收敛 rogueKey 推导写法是硬性前置工程项**，不是可选优化。

## 相关篇目

- 关卡分类学与筛选器语义（本清单多数散点的原理篇）：[03-stage-taxonomy-and-selector.md](03-stage-taxonomy-and-selector.md)
- 版本敏感硬编码正文：[version-sensitive-hardcode.md](version-sensitive-hardcode.md)；值快照：[generated/hardcode-snapshot.md](generated/hardcode-snapshot.md)
- 数据链路与回填原理：[06-data-pipeline.md](06-data-pipeline.md)、[07-ops-runbook.md](07-ops-runbook.md)
- 计算器侧同名手册（散点集独立，互链不合并）：[../../Tool/DamageCalculator/docs/new-topic-checklist.md](../../Tool/DamageCalculator/docs/new-topic-checklist.md)
