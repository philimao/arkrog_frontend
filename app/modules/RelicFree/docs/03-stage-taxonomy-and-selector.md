---
last-verified: 2026-07-28
sources:
  - app/utils/stageSelector.ts
  - app/modules/RelicFree/Selector/index.tsx
  - app/modules/RelicFree/Selector/SelectorDetail.tsx
  - app/modules/RelicFree/Selector/SelectorBanner.tsx
  - app/modules/RelicFree/Stage/index.tsx
  - app/modules/RelicFree/Stage/StageDetail.tsx
  - app/modules/Tool/DamageCalculator/EnemySection/enemyUtils.ts
  - app/types/gameData.ts
  - ../arkrog_backend/utils/appData/shared.js
  - ../arkrog_backend/utils/appData/stagePreview.js
  - ../arkrog_backend/utils/gamedata/buildGameData.js
---

# stage id 语法与关卡分层筛选

本篇是无藏模块的基石文档：整个模块**没有独立的关卡分类数据结构**，所有"这关属于哪层/哪类"的判断都建立在对 `stage.id` 字符串的切分解析上。同一套 id 语法同时支撑：

- 前端 `app/utils/stageSelector.ts` 的 `navOfZone` 八组筛选器（关卡选择页分层渲染）；
- 后端 `utils/appData/shared.js` 的 `skipStage`（决定哪些关进 stage-preview / stage-enemies 数据）与 `utils/appData/stagePreview.js` 的 `buildPreloadData`（面包屑文案）；
- 关卡详情页的紧急关推导（`app/modules/RelicFree/Stage/StageDetail.tsx`）；
- 伤害计算器侧的另一套同名异物筛选器（见[消歧警告](#七与伤害计算器筛选器的消歧警告)）。

改 id 解析逻辑或新增关卡类型码，等于同时动以上所有消费方。数值快照（boss 数量表、排除名单等）以 [generated/hardcode-snapshot.md](generated/hardcode-snapshot.md) 为准，本文不复制值。

## 一、stage id 语法分段表

```
ro{n} _ {类型码} _ {编号} [ _ {变体} ]
 │        │         │         │
 主题号    关卡类型    序号/层内编号  可选尾缀
```

示例：`ro4_b_5_d`（萨卡兹 boss 关 5 号的 d 变体）、`ro5_sv_1_b`（界园岁兽残识 1 号同名变体）、`ro5_n_6_dlc1`。

### 类型码

| 类型码 | 语义 | 无藏筛选器归属（`navOfZone`） | 后端面包屑（`buildPreloadData`） |
|---|---|---|---|
| `b` | Boss 关（含三层小 Boss 与五层以上结局 Boss，异格变体同码） | 险路恶敌（仅编号大于 `numOfMinorBoss` 的大 Boss） | `// 第 N 层 // [异格]x结局` |
| `n` | 普通层作战 | 第四/五/六层（编号 4/5/6，7 归第六层） | `// 第 x 层` |
| `e` | 紧急作战（普通关的紧急变体） | **无**——不被任何筛选器命中，经普通关推导展示（见[第六节](#六紧急关推导)） | 无独立分支（`e_t` 组合例外，见下） |
| `sv` | 岁兽残识（界园 DLC 区域） | 是非境 / 今昔境（按 `dlc1` 尾缀分流） | `// 岁兽残识 · 是非境` / `· 今昔境` |
| `c` | 未萌生的摇篮（黑流树海 GRID_ZONE 传送门关卡，ro6 新增）；**编号段是序号而非层数** | 未萌生的摇篮（`zone_portal`，不带主题条件） | `// 未萌生的摇篮` |
| `ev` | 诡意行商（商店类遭遇） | 特殊关卡 | `// 诡意行商` |
| `t` | 不期而遇 | 特殊关卡 | `// 不期而遇` |
| `duel` | 狭路相逢 | 特殊关卡 | `// 狭路相逢` |
| `dv` | 分明（指点迷津类） | 特殊关卡 | `// 指点迷津` |
| `fs` | 渡劫（指点迷津类，界园） | **无**——`others` 列表未收录 `fs`，渡劫关不出现在无藏选择器 | `// 指点迷津` |

两处已核实的口径杂音，读代码时注意：

- `app/utils/stageSelector.ts` 的 `navOfZone` 中 `ev` 的行内注释写的是"不期而遇"，与后端 `buildPreloadData` 的 `// 诡意行商` 口径不一致——以后端面包屑与游戏内语义为准，`ev` 是行商类。
- 组合码 `e_t`（如 `ro4_e_t_2`，紧急不期而遇）：`args[1]` 是 `"e"`，前端任何筛选器都不命中；后端 `buildPreloadData` 靠 `args[2] === "t"` 的补充判断归入不期而遇，`skipStage` 对它返回 false（`args[2]` 非数字）。结果是**数据侧存在、选择器不渲染**——这类关只能通过直接输入 URL 或关卡页"上一关/下一关"（遍历 stagePreview 键序）到达。

### 变体尾缀

| 尾缀 | 语义 | 判定方 |
|---|---|---|
| `_dlc1` | 今昔境（岁兽残识 DLC 分境） | 前端 `navOfZone` 与后端 `buildPreloadData` 都用 `args.slice(-1)[0] === "dlc1"` |
| 单字母 `_a`…`_e` | 三种用途混用：异格 Boss（`ro4_b_5_d`）、带船变体、同名关消歧（`ro5_sv_1_b`） | 后端 `buildPreloadData` 以 `/_[a-z]$/` 判定 Boss 关"异格"前缀；前端以同名分组编号 TYPE-a/b（见[第四节](#四stagepreview-徽标口径与同名关-type-ab-消歧)） |

### 解析的隐含前提（破坏即静默出错）

1. **主题号是单个数字**。`rogueKey` 推导存在两种写法：多数调用点用 `"rogue_" + ro.slice(-1)`（`ro10` 会产出 `rogue_0`），仅 `SubmitRecordForm` 用 `replace("ro", "rogue_")`（安全）。分布枚举以 [generated/hardcode-snapshot.md](generated/hardcode-snapshot.md) 为准，分歧解析与收敛建议见 [version-sensitive-hardcode.md](version-sensitive-hardcode.md)。
2. **`ro{n}` 段不含字母 `n`**。紧急关推导 `id.replace("n", "e")` 替换的是首个 `n`，只因主题段是 `ro`+数字才恰好落在类型码上。
3. **编号段是层数**这一假设仅对 `n` 类成立；对 `t`/`ev`/`duel`/`dv`/`fs`/`c` 而言编号是序号。后端 `skipStage` 只对 `c` 做了显式豁免（`args[1]==="c"` 直接返回 false，绕开"编号 ≤3 略过"分支），其余几类仍被当层数比较（后果见[第五节](#五前-3-层不收录规则分裂在三处)）。

## 二、navOfZone 八组筛选器逐条语义

`app/utils/stageSelector.ts` 的 `navOfZone` 是模块级常量数组，每项 `{ id, name, filter }`。消费方是 `app/modules/RelicFree/Selector/SelectorDetail.tsx`：先用它渲染层级筛选按钮（额外拼一个伪筛选器"全部"，其 `filter` 恒返回非空数组，只用于按钮可见性判断，不参与关卡分组），再按组渲染关卡卡片。机器生成的规则对照表见 [generated/stage-filter-rules.md](generated/stage-filter-rules.md)。

| # | id | 名称 | 规则（对 `args = stage.id.split("_")`） |
|---|---|---|---|
| 1 | `boss` | 险路恶敌 | `args[1]==="b"` 且编号大于 `numOfMinorBoss[主题]`，排除 `excludeIds`，同名去重 |
| 2 | `6` | 第六层 | `args[1]==="n"` 且 `args[2]` 为 `"6"` 或 `"7"` |
| 3 | `5` | 第五层 | `args[1]==="n"` 且 `args[2]==="5"` |
| 4 | `4` | 第四层 | `args[1]==="n"` 且 `args[2]==="4"` |
| 5 | `zone_sky_1` | 是非境 | `args[1]==="sv"` 且末段不是 `dlc1` |
| 6 | `zone_sky_2` | 今昔境 | `args[1]==="sv"` 且末段是 `dlc1` |
| 7 | `zone_portal` | 未萌生的摇篮 | `args[1]==="c"`（不带主题条件） |
| 8 | `others` | 特殊关卡 | `args[1]` ∈ `ev` / `t` / `duel` / `dv` |

逐条要点：

**1. 险路恶敌（boss filter）——唯一的双参签名，带 push 副作用。**

- 签名是 `filter(stage, array)`，其余六组都是单参。`array` 用于**同名去重**：通过编号与排除检查后，若 `stage.name` 已在 `array` 中则拒绝，否则 `array.push(stage.name)` 并放行——异格 Boss 变体只显示第一个。
- **调用方契约：每一轮筛选必须传入新数组。** `SelectorDetail` 中每个层组渲染前新建 `renderedStageIds`（注意变量名与实际内容不符：里面 push 的是 `stage.name`），筛选按钮可见性检查则逐次传 `[]`（等于禁用去重，只判非空）。若复用跨渲染的旧数组，第二次渲染起所有 Boss 关会被"已渲染"误判而整组消失。
- `excludeIds` 是文件内写死的排除名单（当前含 `ro4_b_9`）——该关在后端 `skipStage` 不略过、stagePreview 中有数据，仅前端隐藏。
- `numOfMinorBoss` 是"三层小 Boss 数量"表（异格记同一个），键为 `ro1`…`ro5`：编号 ≤ 表值判为三层小 Boss，不入险路恶敌。**未登记主题回退 99**——新主题漏加此表时全部 Boss 关静默消失（见 [new-topic-checklist.md](new-topic-checklist.md)）。

**2–4. 第四/五/六层。** 只认 `n` 类型码；`args[2]==="7"`（洞天福地，界园第 7 层）并入"第六层"组。该特判不带主题条件——任何主题出现 `n_7` 关都会归入第六层。

**5–6. 是非境 / 今昔境。** 按 `dlc1` 尾缀二分 `sv` 关。组名"是非境/今昔境"写死在 `navOfZone`，与后端面包屑的"岁兽残识 · X境"文案是两份独立硬编码。

**7. 未萌生的摇篮。** ro6（黑流树海）的 GRID_ZONE 传送门关卡，判定只有 `args[1]==="c"` 一条，**不带主题条件**——与"第六层"的 `n_7` 特判同类，任何主题出现 `c` 关都会落进本组。该类关卡的编号段是序号而非层数，后端 `skipStage` 为此专设了豁免分支（见第一节前提 3）。

**8. 特殊关卡。** 收录 `ev`/`t`/`duel`/`dv` 四码。`fs`（渡劫）不在列表中，也不被其余七组命中——**渡劫关当前不出现在无藏选择器**。

**未命中即静默不可见。** `SelectorDetail` 只按 `navOfZone` 分组渲染，不存在"其他未分类"兜底组。因此 1–3 层 `n` 关、全部 `e` 关、`fs` 关都不渲染卡片。这是刻意的收录范围表达方式之一（另两处见[第五节](#五前-3-层不收录规则分裂在三处)），但也意味着**新增类型码若不扩筛选器就整类蒸发，无任何报错**。

ro6 的 `c` 码是这条约束的正面样本：新增类型码的同时补齐了三处——前端 `zone_portal` 筛选组、后端 `skipStage` 的豁免分支、后端 `buildPreloadData` 的面包屑分支。三处缺任何一处的表现各不相同且都不报错（缺筛选组＝有数据无卡片；缺 `skipStage` 豁免＝编号 ≤3 的传送门关被当低层略过，有卡片无数据；缺面包屑分支＝落进末尾的"第 N 层"兜底，编号被误读成层数）。新增类型码时按这三处逐一核对。

另：筛选栏右上的「按干员」入口是占位 stub（Tooltip "开发中，敬请期待"），无实现。

## 三、跨仓库双份 Boss 数量表的同步义务

"三层小 Boss 数量"这张表在两个仓库各有一份，**值必须逐键相等**：

| 位置 | 符号 | 用途 |
|---|---|---|
| 前端 `app/utils/stageSelector.ts` | `numOfMinorBoss` | 险路恶敌筛选器的编号阈值 |
| 后端 `utils/appData/shared.js` | `numOfZone3Boss` | `skipStage` 略过三层 Boss；`buildPreloadData` 推导结局序号 |

后端另有 `numOfZone5Boss`、`numberOfZone67Boss` 两张表，与 `numOfZone3Boss` 一起用于 `buildPreloadData` 把 Boss 编号折算成"第 5/6/7 层"和"x结局"（编号减去三层 Boss 数即结局序数；超出三表之和显示"误入奇境"）。前端不消费这两张，但三表任何一张过期都会让面包屑层数/结局错位。

**改任意一侧必须同 PR 改另一侧，并重跑 `pnpm docs:gen` 刷新快照**（触发映射见 [CONTRIBUTING.md](../../../../CONTRIBUTING.md)）。当前两侧值一致（快照见 [generated/hardcode-snapshot.md](generated/hardcode-snapshot.md)）。

此外伤害计算器在 `app/modules/Tool/DamageCalculator/EnemySection/enemyUtils.ts` 还持有**第三份**私有拷贝（`numOfZone3Boss`/`numOfZone5Boss`/`numberOfZone67Boss` 三表全量），其同步义务由[计算器侧新主题手册](../../Tool/DamageCalculator/docs/new-topic-checklist.md)覆盖，不在本模块职责内——但排查"两边 Boss 关归层不一致"时要记得一共有三份。

## 四、stagePreview 徽标口径与同名关 TYPE-a/b 消歧

关卡卡片（`SelectorDetail`）从 `relicFreeStore` 的 `stagePreview`（`GET /relic-free/stage-preview` 下发，见 [06-data-pipeline.md](06-data-pipeline.md)）读取每关的 `StagePreviewData`（类型定义在 `app/types/gameData.ts`）：

**最少人数位。** 卡片头部左半格显示 `normalNum`（"普通"），右半格显示 `eliteNum` 或 `boatNum`——**紧急优先于带船**（`eliteNum` 存在时显示"紧急"，否则有 `boatNum` 才显示"带船"），两者不会同时展示。

**难度徽标（maxLevel）。** 计算方式是对序列 `["??", "N0", "N18", "N15"]` 做 reduce：依次检查 `normalLevel`/`eliteLevel`/`boatLevel` 三个字段是否包含序列元素，**后位覆盖前位**，即优先级 `N15 > N18 > N0 > "??"`（无任何数据时停在初始值 `"??"`）。各 `xLevel` 字段本身来自后端 `calculateOptimalNum`（`utils/appData/stagePreview.js`）按 `["N0","N15","N18"]` 升序覆盖写入，语义是"该作战类型有记录的最高难度"。两个口径叠加的已知后果：同一关不同作战类型分别存在 N18 与 N15 记录时，徽标显示 **N15** 而非 N18——序列后位优先是为兼容 N15 封顶主题（ro3/ro5）设的，跨类型混难度时会以 N15 压过 N18。

**同名关 TYPE-a/b 消歧。** 界园岁兽残识存在同名不同 id 的关卡（如"地有四难"`ro5_sv_1` 与 `ro5_sv_1_b`）。`SelectorDetail` 在**当前层组的渲染列表内**按 `name + isElite` 相同分组，组内按渲染顺序赋字母 `a`…`e`，卡片右下角显示 `TYPE-a`/`TYPE-b` 角标；鼠标悬停角标显示该变体的代表敌人头像（`EnemyAvatar`，外链依赖见 [version-sensitive-hardcode.md](version-sensitive-hardcode.md)）。

角标仅在 `stage.mainEnemy` 非空时渲染。`mainEnemy` 由后端 `utils/gamedata/buildGameData.js` 生成：只对**同 `stageName` 组**（组内多于一关）做敌人差集分析，排除 `hiddenEnemies` 名单与"每个变体都出现"的敌人后，按出现次数少、血量高排序取首个敌人名；不在同名组的关卡该字段为空串。注意前端分组键（`name + isElite`）与后端分组键（`stageName`）不同源，两者恰好在 `sv` 同名场景重合——若后端差集分析给不出代表敌人，同名关就没有 TYPE 角标可区分。

## 五、"前 3 层不收录"规则分裂在三处

"无藏不收录前 3 层"这一条产品规则没有单一实现点，分裂在三处，**改收录范围必须三处同步**：

| # | 位置 | 实现形态 | 只改这处漏其他的后果 |
|---|---|---|---|
| 1 | 后端 `utils/appData/shared.js` 的 `skipStage` | 数据侧：`stagePreviewFullUpdate` 与 `stageEnemiesUpdate` 生成时跳过——`b` 类编号 ≤ `numOfZone3Boss` 略过，`c` 类显式豁免（一律不略过），其余类型 `args[2]` 为数字且 ≤3 略过 | 有卡片无数据：徽标恒 `"??"`、最少人数空、关卡页敌方情报空 |
| 2 | 前端 `navOfZone` 结构 | 展示侧：不存在 1–3 层筛选组，低层关不被命中即不渲染 | 有数据无卡片：只能靠 URL 直达 |
| 3 | `SelectorDetail` 页面文案 | "注：前3层不做无藏收录，特定干员开局攻略见攻略博客页" | 文案与行为脱节 |

**`skipStage` 的编号误读警告**（读第一节前提 3）：除 `b` 与显式豁免的 `c` 之外，它对其余类型统一把 `args[2]` 当层数比较，而 `t`/`ev`/`duel`/`dv`/`fs` 的该段是序号。（ro6 新增 `c` 码时专门加了豁免分支，说明这个坑是已知的；但既有的四五个类型码并未一并修，仍是下面这个后果。）已核实的后果：`ro5_duel_1`（狭路，序号 1 ≤ 3）被数据侧略过，但前端"特殊关卡"组照常渲染其卡片——徽标 `"??"`、无最少人数、敌方情报空。且 `stagePreviewSingleUpdate`（提交/删除记录触发的增量重算，`utils/appData/stagePreview.js`）**不调用 `skipStage`**：对这类关提交记录会把它临时写进 stagePreview（顺带出现在上一关/下一关键序里），下一次全量重建又会抹掉。这一不对称在修改收录规则时极易踩中。

## 六、紧急关推导

紧急作战（`e` 类）没有独立卡片和列表入口，其信息在**普通关详情页**呈现。`app/modules/RelicFree/Stage/StageDetail.tsx` 的 `eliteStageData` useMemo 实现推导：

1. 守卫：`stageData.id.match(/ro\d_n/)`——仅普通层关尝试推导（Boss/sv/特殊关直接 null）；
2. `eliteId = stageData.id.replace("n", "e")`——把类型码 `n` 换成 `e`（替换首个 `n`，见第一节前提 2）；
3. `rogueKey = "rogue_" + ro.slice(-1)`，在 `gameDataStore.stages[rogueKey][eliteId]` 查找；
4. 命中 → 详情页渲染"紧急"描述块（`eliteStageData.eliteDesc`）；未命中 → 回退检查 `stagePreview[id].boatDesc` 渲染"带船"块；两者皆无则不渲染。

推导成立的前提：**紧急版 id 与普通版仅类型码一字之差（编号与变体尾缀完全一致）**。上游命名一旦偏离此约定，紧急信息静默消失（无报错、无占位）。

与此对应，记录的归属也是"挂在普通关上"：`SubmitRecordForm` 提交的 `stageId` 就是当前普通关 id，紧急/带船通关以 `type` 字段（`elite`/`boat`）区分，不落在 `e` 关 id 下——记录契约详见 [02-record-lifecycle-and-schema.md](02-record-lifecycle-and-schema.md)。

`ro10` 双重击穿预告：守卫正则 `/ro\d_n/` 只匹配单数字主题号，且 `slice(-1)` 推导会得到 `rogue_0`——实际在 `app/modules/RelicFree/Stage/index.tsx` 的关卡查找处就会先崩（`stages["rogue_0"]` 为 undefined），详见 [version-sensitive-hardcode.md](version-sensitive-hardcode.md)。

## 七、与伤害计算器筛选器的消歧警告

仓库里存在**两套同名异物的"关卡分层筛选器"**，`app/utils/stageSelector.ts` 文件头注释已声明不得混用：

| | 无藏：`stageSelector.ts` 的 `navOfZone` | 计算器：`EnemySection/enemyUtils.ts` 的 `getNavOfZone` |
|---|---|---|
| 形态 | 模块级静态常量数组 | 工厂函数，按 `zones` 解包数据动态生成 `baseZones + otherZones + sharedZones` |
| 覆盖范围 | 仅收录范围（4–6 层、大 Boss、sv、`c` 传送门、部分特殊关） | 全部层与全部关卡类型（含 1–3 层、`fs`、按层归属的 `duel`） |
| filter 签名 | 险路恶敌组为双参 `(stage, array)` 带 push 副作用 | 一律单参 `(stage)` 无副作用 |
| 附加职责 | 无 | 每组带 `getLayer`（难度层数推导） |
| Boss 表 | `numOfMinorBoss` 一张 | 私有三表（`numOfZone3Boss` 等） |

误引对照：把计算器的 `getNavOfZone` 引进无藏页会让前 3 层与渡劫关混入收录列表、丢失 Boss 同名去重；把无藏的 `navOfZone` 引进计算器会丢层数档位推导，敌人数值整体错档。`gameDataUtils.ts`（计算器 store 侧）内还有一个局部变量恰好也叫 `navOfZone`，全文检索时注意甄别。

## 相关篇目

- 架构与数据流总览：[01-architecture-and-data-flow.md](01-architecture-and-data-flow.md)
- 记录契约与生命周期：[02-record-lifecycle-and-schema.md](02-record-lifecycle-and-schema.md)
- stage-preview / stage-enemies 的生成与下发链路：[06-data-pipeline.md](06-data-pipeline.md)
- 筛选规则机器对照表：[generated/stage-filter-rules.md](generated/stage-filter-rules.md)
- 版本敏感硬编码（rogueKey 两写法、Boss 表快照）：[version-sensitive-hardcode.md](version-sensitive-hardcode.md) 与 [generated/hardcode-snapshot.md](generated/hardcode-snapshot.md)
- 新主题上线散点清单：[new-topic-checklist.md](new-topic-checklist.md)
