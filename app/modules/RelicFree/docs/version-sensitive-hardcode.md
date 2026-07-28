---
last-verified: 2026-07-13
sources:
  - app/utils/stageSelector.ts
  - app/utils/tools.ts
  - app/utils/record.ts
  - app/types/constant.ts
  - app/components/Character/Enemy/EnemyAvatar.tsx
  - app/components/RecordCard/RecordCard.tsx
  - app/modules/RelicFree/Selector/SelectorDetail.tsx
  - app/modules/RelicFree/Selector/SelectorBanner.tsx
  - app/modules/RelicFree/Stage/index.tsx
  - app/modules/RelicFree/Stage/StageDetail.tsx
  - app/modules/RelicFree/Stage/SubmitRecordForm.tsx
  - app/modules/RecordDisplay/ReportModal.tsx
  - ../arkrog_backend/utils/appData/shared.js
  - ../arkrog_backend/utils/appData/stagePreview.js
  - ../arkrog_backend/utils/gamedata/buildGameData.js
  - ../arkrog_backend/routers/record.js
---

# 版本敏感硬编码正文

本篇登记无藏模块所有"上游一变、这里必须人改"的散点硬编码，解释**每处对应的上游变更类型与更新流程**。共同特征：漏改不报错，只静默出错。

分工约定：**值本身以 [generated/hardcode-snapshot.md](generated/hardcode-snapshot.md) 的机器快照为准，本文不复制值**（快照由 `pnpm docs:gen` 从源码导出，防手抄漂移）；新增散点硬编码的 PR 必须同步本文与快照（触发映射见 [CONTRIBUTING.md](../../../../CONTRIBUTING.md)）。体例与边界对齐[计算器侧同名清单](../../Tool/DamageCalculator/docs/version-sensitive-hardcode.md)：本文只管"会过期的位置"，已经错了的存量缺陷登记在 [known-issues.md](known-issues.md)。

## 总表

| 位置（路径 + 符号） | 硬编码内容 | 触发更新的上游变更类型 | 漏改症状 | 详见 |
|---|---|---|---|---|
| app/utils/stageSelector.ts 的 `numOfMinorBoss`、`navOfZone`（内含 `excludeIds`、洞天福地 `"7"` 特判、`dlc1` 尾缀判断、`others` 类型码名单） | 各主题三层小 Boss 数量表；八组筛选器的类型码/层号/尾缀规则 | 新主题上线；现有主题新增 Boss/层/区域/类型码；上游改 stage id 命名 | Boss 组整组消失（查表回退 99）；新类型关卡静默不渲染 | [03 第二节](03-stage-taxonomy-and-selector.md) |
| 后端 utils/appData/shared.js 的 `numOfZone3Boss` / `numOfZone5Boss` / `numberOfZone67Boss`（消费方 `skipStage` 与 stagePreview.js 的 `buildPreloadData`） | 与前端同值双份的 Boss 数量三表 | 同上；**与前端 `numOfMinorBoss` 必须同 PR 同步** | 小 Boss 关混入数据侧；面包屑层数/结局错位或出现 `undefined结局` | [03 第三节](03-stage-taxonomy-and-selector.md) |
| 后端 utils/appData/stagePreview.js 的 `preload` 与 `buildPreloadData` 文案分支 | 按 stageId 写死的带船描述；按类型码写死的面包屑文案（含"岁兽残识"专名） | 新特殊关上线；新类型码；主题复用 `sv` 码 | 带船块缺失；面包屑空白或顶错主题文案 | [new-topic-checklist.md](new-topic-checklist.md) 散点 4 |
| 后端 utils/gamedata/buildGameData.js 的 `names_en`、`hiddenEnemies` | 位置索引的主题英文名表；代表敌人排除名单 | 新主题上线；新彩蛋/通用敌人 | banner 英文行空白；TYPE tooltip 代表敌人失真 | [new-topic-checklist.md](new-topic-checklist.md) 散点 1、2 |
| app/types/constant.ts 的 `topicMaxLevels`、`StageLevels`（连带 SelectorDetail 的 `maxLevel` reduce 序列与后端 `calculateOptimalNum` 的难度序列） | 主题难度上限表；全站难度档枚举；徽标难度优先级序列 | 新主题上线；游戏难度体系扩档（如新增 N 值） | 提交表单失默认难度；新难度档在最少人数统计与徽标中被无视 | 本文[难度体系](#难度体系四处联动的序列)一节 |
| **rogueKey 推导（跨多文件）** | `ro{n}` → `rogue_{n}` 的两种互斥写法 | 主题号到两位数（ro10） | `rogue_0` 键查找 → 关卡页崩溃/装饰静默丢失 | 本文[专节](#roguekey-推导两种写法并存与收敛建议) |
| app/components/Character/Enemy/EnemyAvatar.tsx 的 `preset`、`enemyNameTransform`、onError 兜底 URL | COS 托管敌人名单（按主题目录+扩展名）；wiki 命名转换映射；写死的占位图外链 | 新特供敌人；prts.wiki 文件改名/敌人改名 | 头像回退占位符图 | 本文[专节](#enemyavatar-的外链依赖与-md5-路径约定) |
| app/utils/tools.ts 的 `imageHost` / `assetsHost` / `cosHost` / `getPath` | 三个外部资产域名；MediaWiki MD5 哈希路径算法 | prts.wiki 换域名/改防盗链/改上传路径规则；COS 桶迁移 | 敌人头像与关卡地图（`assetsHost` 的 `map_preview/{stageId}.png`，StageDetail 消费）全量破图 | 本文[专节](#enemyavatar-的外链依赖与-md5-路径约定) |
| app/utils/record.ts 的 `avToBv` | B 站 av→BV 转换的字母表/异或/加数/位序常数组 | B 站变更 BV 编码算法或 av 号超出旧算法适用范围 | 提交的 av 号链接被归一化成格式合法但指向错误视频的 BV 链接 | 本文[专节](#avtobv-的逆向魔数) |
| app/modules/RelicFree/Stage/SubmitRecordForm.tsx 的 `handleSubmit` 与 app/components/RecordCard/RecordCard.tsx 的 `handleDeleteRecord` | `setTimeout(..., 2000)` 后 `fetchStagePreview(true)` | 后端增量重算耗时增长（记录量/部署形态变化） | 强刷拿到旧预览，最少人数徽标滞后到下次访问 | 本文[专节](#settimeout-2000时序契约而非同步机制) |
| public/images/card/ 与后端 public/images/topic_banner/ 的按主题命名静态图 | `rogue_N_deco_l/r.png`、`rogue_N_logo.png`、`rogue_N.jpg` | 新主题上线 | 记录卡装饰静默空白 / banner 破图（rogue_5 装饰三图现缺，见 known-issues） | [new-topic-checklist.md](new-topic-checklist.md) 散点 6、11 |

以下各节展开。

## Boss 数量三表：层级由公式反推，ro6 是一处刻意的"填错值"

后端 `numOfZone3Boss` / `numOfZone5Boss` / `numberOfZone67Boss` 不只是计数，它们是 `buildPreloadData` **反推层级与结局序数的唯一输入**：

```
endingNum = bossNum - zone3                                   // 第几个结局
bossNum <= zone3+zone5                        → 第 5 层
bossNum <  zone3+zone5+zone67                 → 第 6 层
bossNum === zone3+zone5+zone67                → 第 7 层        // ← 注意：区间最后一个恒判为第7层
否则                                           → 误入奇境
```

`skipStage` 另用 `numOfZone3Boss` 判定"三层小 Boss 略过收录"，前端 `numOfMinorBoss` 是它的同值双份。

**该公式假定 zone67 区间里恰好有一个第 7 层 Boss**（末位那个）。主题若没有第 7 层，就无法如实填写——这正是 ro6 的情况：

| 主题 | zone3 | zone5 | zone67 | 实际结构 |
|---|---|---|---|---|
| ro5 | 3 | 2 | 2 | b_4/b_5 五层，b_6 六层，b_7 七层——与公式吻合 |
| **ro6** | **3** | **2** | **2** | b_1~b_3 三层小Boss（略过），b_4/b_5 五层一/二结局，**b_6 六层三结局，无第七层** |

⚠️ **ro6 的 `numberOfZone67Boss = 2` 是刻意与实情不符的**：六七层实际只有 `b_6` 一关，但填 `1` 会让 `b_6` 命中"区间末位 → 第 7 层"分支而错标层数；填 `2` 才落进"第 6 层"，且不存在的 `b_7` 永不被查询，无副作用。**下一个没有第七层的主题会再次踩到这里**——真正的修法是给公式增加"该主题有无第七层"的显式输入，而不是继续靠配错数值绕过。

另一处教训：ro6 上线初期曾误判为"需要专用分支"（把 b_1~3 当作应收录的第 3 层 Boss），实际它完全符合通用模型，只是三表没填。**新主题优先怀疑"表没填"，而不是"模型不适用"**；`b_*` 出现 `undefined结局` 基本等同于三表缺键。散点清单见 [new-topic-checklist.md](new-topic-checklist.md) 散点 3、9。

## 难度体系：四处联动的序列

难度档（N0/N15/N18）在无藏链路上以**四份各自为政的硬编码序列**存在，任何一份过期都让新难度档"部分生效"：

| 位置 | 序列语义 |
|---|---|
| app/types/constant.ts 的 `StageLevels` | 提交表单难度下拉的选项全集 |
| app/types/constant.ts 的 `topicMaxLevels` | 各主题难度上限（下拉默认选中） |
| 后端 utils/appData/stagePreview.js 的 `calculateOptimalNum` 内联难度数组 | 升序覆盖计算"有记录的最高难度"（`xLevel` 字段） |
| app/modules/RelicFree/Selector/SelectorDetail.tsx 的 `maxLevel` reduce 序列 | 卡片徽标的难度优先级（后位覆盖前位，含 `"??"` 兜底位） |

**上游变更类型**：游戏难度体系扩档（新 N 值）或新主题采用非 N0/N15/N18 的档位。**漏改症状**：新档记录能提交（若 `StageLevels` 已加）但后端统计与前端徽标把它当不存在——`calculateOptimalNum` 不遍历它则 `xLevel` 不更新，徽标 reduce 序列不含它则显示降档。**更新流程**：四处同 PR 改齐，注意后端序列是升序（低→高覆盖）、前端徽标序列是优先级序（现状 N15 排最后即最高优先，其"跨类型混难度时 N15 压过 N18"的既有怪癖见 [03 第四节](03-stage-taxonomy-and-selector.md)），两者顺序语义不同，不能互相照抄。

## rogueKey 推导：两种写法并存与收敛建议

stage id 首段（`ro4`）转 `gameDataStore`/`topics` 的键（`rogue_4`）这一步，仓库里存在两种互斥写法：

| 写法 | 行为 | ro10 时 |
|---|---|---|
| `"rogue_" + ro.slice(-1)` | 取末**一个**字符拼前缀 | 产出 `rogue_0`，键查找 miss |
| `ro.replace("ro", "rogue_")` | 前缀替换，保留完整数字 | 产出 `rogue_10`，安全 |

`slice(-1)` 写法散布在关卡页（`app/modules/RelicFree/Stage/index.tsx`、`StageDetail.tsx` 的紧急关推导）、记录卡（`app/components/RecordCard/RecordCard.tsx` 的装饰图 `ro` 与 stageData 查找）、举报弹窗（`app/modules/RecordDisplay/ReportModal.tsx`）等处；`replace` 写法目前仅 `app/modules/RelicFree/Stage/SubmitRecordForm.tsx` 一处。**分布点数量与精确位置以 [generated/hardcode-snapshot.md](generated/hardcode-snapshot.md) 的正则枚举为准，本文刻意不写死处数**——这正是散点会随重构漂移的典型场景。

击穿后果分档：关卡页的 `stages["rogue_0"]` 是 undefined 后再索引，**TypeError 崩页**；记录卡的 `/images/card/rogue_0_*.png` 是背景图 404，**装饰静默消失**；紧急关推导另有 `/ro\d_n/` 守卫在 ro10 时不匹配，紧急块静默不渲染（见 [03 第六节](03-stage-taxonomy-and-selector.md)）。

**收敛建议**：抽单一工具函数（如在 `app/utils/stageSelector.ts` 或 `app/utils/tools.ts` 导出 `roToRogueKey(stageIdOrRo: string): RogueKey`，实现取 `replace` 语义），全仓替换两种内联写法，并把该函数登记进 docs:gen 的扫描锚点。在 ro10 主题公布前完成是硬性前置（见 [new-topic-checklist.md](new-topic-checklist.md) 文末警告）。

## EnemyAvatar 的外链依赖与 MD5 路径约定

无藏的敌人头像（关卡页敌方情报、同名关 TYPE tooltip）**不托管在本站**，`app/components/Character/Enemy/EnemyAvatar.tsx` 按三级来源解析：

1. **`preset` 名单**（COS 托管）：命中则走 `app/utils/tools.ts` 的 `cosHost`（腾讯云 COS 桶）下 `/images/rogue_4/{名}.png` 或 `/images/rogue_5/{名}.webp`——**按主题目录、按批次扩展名**，全是手工上传+手工登记的约定，无清单校验。
2. **prts.wiki 默认路径**：`imageHost`（`media.prts.wiki`）+ `getPath("头像_敌人_" + 名 + ".png")`。`getPath` 实现的是 **MediaWiki 哈希上传路径**约定：`md5(文件名)` 的首个十六进制字符/前两个字符作两级目录（`a/ab/文件名`）。文件名先经 `enemyNameTransform` 映射修正 wiki 与解包的命名差异（如引号全半角、改名条目）；个别敌人文件名带 `(敌方)` 后缀的特例直接登记在 `preset` 第三段（先例：弑君者）。
3. **onError 兜底**：写死的 prts"无图片占位符"缩略图 URL。

对应的上游变更类型与更新动作：

| 上游变更 | 更新动作 |
|---|---|
| prts.wiki 重命名头像文件 / 敌人游戏内改名 | 加/改 `enemyNameTransform` 条目 |
| wiki 根本没有该敌人头像（陷阱转化类特供敌人） | 上传 COS 并登记 `preset`（流程见 [new-topic-checklist.md](new-topic-checklist.md) 散点 10） |
| prts.wiki 换域名 / 改哈希路径规则 / 收紧防盗链 | 改 `imageHost`/`assetsHost` 或 `getPath`；`img` 已带 `referrerPolicy="no-referrer"`，防盗链策略变化时优先排查这里 |
| COS 桶迁移/改名 | 改 `cosHost` |

同一组 host 常量还服务于关卡页地图（`StageDetail` 的 `assetsHost + /map_preview/{stageId}.png`，torappu.prts.wiki）——`assetsHost` 失效的症状是**全部关卡地图破图**，比头像占位符更显眼。三个 host 均无镜像回退，属单点外链依赖。

## avToBv 的逆向魔数

`app/utils/record.ts` 的 `avToBv`（`URLValidation` 在归一化 `bilibili.com/video/av...` 链接时调用）内嵌一组社区逆向的 B 站旧版 av↔BV 互转常数：58 字符查找表、位序数组、异或值与加数（值见快照）。

- **上游变更类型**：B 站官方从未承诺该算法稳定；新算法（更长 av 号空间）已在站方侧存在。当 av 号超出旧算法可表示范围、或站方调整编码时，本函数产出**格式合法但指向错误/不存在视频**的 BV 链接。
- **失败形态**：`URLValidation` 只做格式与协议校验、不回源验证视频存在（其"警告不阻断"行为与外链解析全貌见 [05-submit-form-and-links.md](05-submit-form-and-links.md)），所以坏链接会直接落库进记录的 `url` 字段。
- **更新流程**：无法"对表更新"——算法整体替换。备选路径是把 av→BV 归一化改为服务端解析（与 b23 短链解析同属"待新增端点"的范畴，见 05 篇的 parse-redirect 结论），使前端摆脱对逆向常数的依赖。在此之前，每逢社区报告 av 长号转换异常，第一排查点就是这组常数。

## setTimeout 2000：时序契约而非同步机制

提交记录（`SubmitRecordForm.handleSubmit`）与删除记录（`RecordCard.handleDeleteRecord`）成功后都执行：

```
setTimeout(() => { fetchStagePreview(true); }, 2000);
```

这是一条**跨仓库的隐式时序契约**：后端 `routers/record.js` 在提交/删除后以 fire-and-forget 方式触发 `stagePreviewSingleUpdate`（`utils/appData/stagePreview.js`）增量重算，前端赌它在 2 秒内完成，然后带 `force` 强刷 `/relic-free/stage-preview`（该端点无缓存头，能拿到新值）。

- **"版本敏感"的含义**：2000ms 不对应任何游戏数据，它敏感于**部署与数据规模**——记录集合增长、服务器负载、单进程改多进程等都会拉长重算耗时。超时的症状是强刷拿到旧预览，最少人数徽标要等用户下次访问才更新；没有任何报错（后端侧失败也只是 `.catch` 一行日志）。
- **现状口径**：该链路在后端 `fc2f75f`～`790afd6` 区间整体断裂（增量重算 100% TypeError），已由 `790afd6`（2026-07-13）修复、本地 HEAD 已含该提交；线上部署与数据回填状态见 [known-issues.md](known-issues.md) 与 [07-ops-runbook.md](07-ops-runbook.md)。断裂期间这个 2 秒等待等于白等——排查"提交后人数不刷新"先确认部署版本，再怀疑时序。
- **改动指引**：调大数字只是续命；结构性方案是改为响应驱动（后端重算完成后在提交/删除响应或独立查询中给出信号）。该取舍的决策背景与推翻条件补记在 adr/ 目录的 0006（setTimeout 2000 时序契约）。

## 本清单与自动化的关系

[generated/hardcode-snapshot.md](generated/hardcode-snapshot.md) 已把总表中"可正则枚举"的部分（Boss 数量表、rogueKey 推导点、excludeIds、难度序列等）纳入 `pnpm docs:gen` 的确定性输出；本文与快照的分工是"为什么敏感/怎么更新"vs"现在的值/在哪几行级位置"。尚未被机器覆盖的项（外链 host 存活性、COS/静态图齐备性、前后端 Boss 表跨仓库一致性比对）是 docs:gen 的待建设方向，见 [../../../../docs/doc-generation.md](../../../../docs/doc-generation.md)。

## 相关篇目

- 筛选器与 id 语法原理：[03-stage-taxonomy-and-selector.md](03-stage-taxonomy-and-selector.md)
- 新主题散点总动员：[new-topic-checklist.md](new-topic-checklist.md)
- 外链解析与提交表单：[05-submit-form-and-links.md](05-submit-form-and-links.md)
- 存量缺陷登记簿：[known-issues.md](known-issues.md)
- 计算器侧同名清单：[../../Tool/DamageCalculator/docs/version-sensitive-hardcode.md](../../Tool/DamageCalculator/docs/version-sensitive-hardcode.md)
