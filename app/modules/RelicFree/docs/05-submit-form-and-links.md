---
last-verified: 2026-07-13
sources:
  - app/modules/RelicFree/Stage/SubmitRecordForm.tsx
  - app/modules/RelicFree/Stage/StageDetail.tsx
  - app/utils/record.ts
  - app/utils/tools.ts
  - app/types/constant.ts
  - app/types/recordType.ts
  - app/types/gameData.ts
  - app/stores/relicFreeStore.ts
  - arkrog_backend/routers/record.js
  - arkrog_backend/utils/record.js
---

# 提交表单规格与外链解析

本篇定义无藏记录提交表单（`app/modules/RelicFree/Stage/SubmitRecordForm.tsx` 的 `SubmitRecordForm`）的字段规格、team 字符串解析规则、校验链顺序，以及外链归一化（`app/utils/record.ts` 的 `URLValidation`）的全部规则。提交后的落库形态、服务端解析与错误码映射见 [02-record-lifecycle-and-schema.md](02-record-lifecycle-and-schema.md)（下称"模块 02"），本篇不重复。

> ⚠️ 本篇标注"2026-07-13 补/起"的行为（b23 分支 `res.ok` 校验与 `null` 阻断、`handleSubmit` try/catch 等）——**以下修复均未部署**：线上仍运行旧版前端，线上行为差异见第 6 节与 [known-issues.md](known-issues.md)。

## 1. 入口与渲染条件

表单由关卡详情页 `StageDetail` 挂载，接收两个 prop：`stageId`（当前关卡）与 `setRecords`（关卡页局部记录列表的 setter，成功提交后用响应整表替换）。组件在 `userInfo.level < 3` 或未登录时直接返回 `null`——这是**渲染层软守卫**，真正的门槛在后端 `routers/record.js` 的前置守卫（本地 HEAD；线上部署滞后，对照表见模块 02 第 9 节）。

## 2. 字段清单与默认值来源

表单用原生 `FormData` 收集（HeroUI `Form`，`validationBehavior="native"`），所有值均为字符串：

| 表单 name | 控件 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `url` | Input | ✓ | — | B 站长短链、裸 BV 号、YouTube 链接；提交前经 `URLValidation` 归一化（第 5 节） |
| （无 name，不进 FormData） | Input（受控，`team` state） | ✓ | — | 队伍组成字符串，实时解析为 `memberDataArray`（第 3 节）；label 动态显示人数 |
| `ignore_{charId}` | RadioGroup（每名有模组干员一组） | — | 该干员 `charEquipOrder` 最大（最新）的模组 | **`ignore_` 前缀字段在 `handleSubmit` 开头整批剥离**，模组选择实际经 `onValueChange` 写入 `memberDataArray`，不走 FormData |
| `type` | Select | ✓ | `Object.keys(StageTypes)[0]` 即 `normal`（"普通作战"） | 选项来自 `app/types/constant.ts` 的 `StageTypes`（普通/紧急/带船） |
| `level` | Select | ✓ | `topicMaxLevels[rogueKey]`（主题最高难度） | 选项来自 `StageLevels`（`N0`/`N15`/`N18`） |
| `note` | Textarea | — | — | 备注（攻略者 ID、等效情况等） |

默认值的两个上游：

- **`rogueKey` 推导**：本组件用 `stageId.split("_")[0].replace("ro", "rogue_")`——这是全仓库两种 rogueKey 写法中**对 ro10+ 安全的那种**（另一种 `"rogue_" + ro.slice(-1)` 在 ro10 会产出 `rogue_0`）。两种写法的全部出现点以 [generated/hardcode-snapshot.md](generated/hardcode-snapshot.md) 为准，语义与收敛建议见 [version-sensitive-hardcode.md](version-sensitive-hardcode.md)。
- **`topicMaxLevels`**（`app/types/constant.ts`）：按主题硬编码的最高难度（rogue_1/2/4 为 N18，rogue_3/5 为 N15）。**新主题缺项时 `maxLevel` 为 `undefined`，难度下拉无默认选中**——属版本敏感散点，登记入 [new-topic-checklist.md](new-topic-checklist.md)。
- **模组默认值**：`Object.values(charData.uniequip).sort((a, b) => b.charEquipOrder - a.charEquipOrder)[0]`，即 `charEquipOrder` 最大的"最新模组"；无模组干员为 `""`。

提交的 `team` 不来自 FormData，而是 `memberDataArray`（剥除 `charData` 后整组随 `data.team` 提交）；`stageId` 由 prop 注入。字段落库形态见模块 02 第 3 节。

## 3. team 字符串解析规则

输入字符串经以下规则实时（`useEffect`，依赖 `team` 与 `character_basic`）解析：

1. **分隔**：按 `/[+、]/`（加号或顿号）切分为干员段。
2. **逐段解析**（`app/utils/record.ts` 的 `charStrToData`）：
   - 先 `trim()`；
   - 段尾匹配 `/(?<!-)\d$/`（**末位数字且前一位不是连字符**）视为技能序号 `skillStr` 并从名字中剥离——负向后行断言即**小车豁免**：`Lancet-2`、`Castle-3` 这类以 `-数字` 结尾的名字，末位数字属于名字本身而非技能序号；
   - 剩余部分与 `character_basic` 全体干员的 `name` 做**大小写不敏感**全等匹配，得到 `charId`/规范 `name`；
   - 有 `skillStr` 时按 `SkillBasicData.skillOrder` 查 `skillId`；**查不到时 `skillId = "error"` 哨兵**，交给校验链第④步拦截；
   - 未匹配到干员的段（`charData` 为空）被 `filter` 丢弃，不进 `memberDataArray`——错拼的段由校验链第③步以错位方式报出。
3. **模组字段回填**：解析后为每名成员设置默认模组（第 2 节）并从摊平的 `uniequip_basic`（来源见 [01-architecture-and-data-flow.md](01-architecture-and-data-flow.md)）取 `typeIcon` 大写作为 `uniequipName`。

人数 label 直接取 `team.split(/[+、]/).length`——空字符串 split 后长度为 1，所以**空输入也显示"（1人）"**（展示层小怪异，见第 7 节）。

## 4. handleSubmit 五步校验链

按代码顺序，任一步失败即 `return`（②~⑤ 以 `toast.warning` 提示）：

| # | 校验 | 失败提示 | 备注 |
|---|---|---|---|
| ① | `URLValidation(data.url)` 归一化 | （见第 5 节） | 返回 falsy（b23 短链解析失败的 `null`，或空串）时拦截；其余分支**警告不阻断**，返回归一化结果继续放行 |
| ② | `findDuplicates` 检查 `memberDataArray` 中重复干员名 | `队伍组成中 X 填写重复！` | 按解析后的规范名判重 |
| ③ | 逐段回对：第 i 段原文（大写化）必须全等于 `memberDataArray[i]` 的 `name + skillStr`（大写化） | `队伍组成中 X 无法解析！请检查拼写是否有误` | 错拼段被解析层丢弃造成错位，在此兜住；**原文段未 trim 即比较**，分隔符两侧的空格会误报"无法解析"（第 7 节） |
| ④ | 任一成员 `skillId === "error"` | `队伍组成中 X 的技能填写有误！` | 技能序号超出该干员技能数 |
| ⑤ | 任一成员无 `skillId` 且名字不匹配 `/-\d$/` | `队伍组成中 X 的技能未填写！` | **小车豁免**：`-数字` 结尾的名字允许不填技能 |

通过后：剥除各成员 `charData` → 组装 `data.team`/`data.stageId` → `_post("/record/submit", data)` → 成功则 `setRecords(响应)` 并关 Modal → `setTimeout(2000)` 后 `fetchStagePreview(true)`（时序契约见模块 02 第 10 节）。

校验链与提交整体包在 try/catch 中（2026-07-13 补）：服务端拒绝（链接格式、解析失败的中文提示、权限不足等，见模块 02 第 4.2 节）以 `toast.error` 呈现，**弹窗与已填内容保留**供修正后重试。

## 5. URLValidation 归一化规则全集

`app/utils/record.ts` 的 `URLValidation`，按执行顺序：

1. `"#"`（无视频链接）原样放行。
2. `trim` 后取第一个空格前的片段；`http:` → `https:`。
3. **b23.tv 短链**：提取 `https://b23.tv/...` 片段，`fetch("/api/parse-redirect?url=" + 短链)`；仅 `res.ok` 时读取响应文本（2026-07-13 补），解析结果不以 `http` 开头（含错误响应/空串）时 toast"短链解析暂不可用"并**返回 `null` 阻断提交**——这是 `URLValidation` 唯一的前置阻断分支。该端点目前是幻影端点（第 6 节），故 b23 短链现阶段一律在此被拦下。
4. 依次截断：`#` 片段、`/&` 之后、`&spm_id_from=` 之后；删除全角 `？`。
5. 折叠多余 `?`：首个 `?` 保留，其余问号段用 `&` 连接。
6. `youtu.be/<id>` → `https://www.youtube.com/watch?v=<id>`。
7. **av 号 → BV 号**：`bilibili.com/video/av\d+` 提取数字，经 `avToBv` 换表算法（固定 58 字符换表 + 位置表 `[11,10,3,8,4,6]` + 异或/偏移常量）转 BV，保留原 query。
8. `m.bilibili` → `www.bilibili`；`www` 开头补 `https://`。
9. 裸 BV 号：`bv`/`BV` 开头 → 拼 `https://www.bilibili.com/video/BV...`；路径中小写 `bv` → 改大写 `BV`。
10. **BV 视频链接只保留 `p` 参数**（`(?<!m)p=` 排除 `mp=` 类参数名；`p > 200` 重置为 1；`p=1` 直接丢弃）——其余 query 全部剥离。
11. 动态/opus 链接（`t.bilibili.com`、`bilibili.com/opus`）：剥离全部 query。
12. YouTube 链接：提取 `v=` 参数重组为 `watch?v=<id>`；**无 `v` 参数时会拼出 `v=undefined`**，后端 `parseYoutubeURL` 对含 `"undefined"` 的 URL 直接返回 404 `"Invalid URL"`。
13. 去除末尾 `/`。（其上有一行结果被丢弃的 `newURL.trim()` 无效语句。）
14. 终检：`new URL()` 构造 —— 非 https 协议 toast `"请使用HTTPS协议！"`，构造失败 toast `"链接格式不合法！"`。

**"警告不阻断"仍是终检的真实行为**：第 14 步的两个失败分支 toast 之后**仍然返回当前 URL 字符串**，`handleSubmit` 第①步的 `if (validatedURL)` 对非空字符串恒为真——提交照常发出，真正的拦截发生在后端 `isValidRecordUrl`（仅本地 HEAD 有，见模块 02）。唯一的前置阻断是第 3 步 b23 分支的 `null`（2026-07-13 起），其余分支的前端警告只是提示，不是校验。

## 6. parse-redirect：幻影端点（权威结论）

`URLValidation` 的 b23 短链分支请求 `/api/parse-redirect`。**该端点从未存在过**：nginx 无对应配置、后端全部 git 历史无任何实现、线上实测 404——b23 短链解析**自上线以来一直是坏的**。写文档、提需求时一律表述为"**待新增端点**"，禁止写成"实现在别处"。

现状故障链（本地 HEAD，2026-07-13 起）：线上 404 → `res.ok` 为假 → toast"短链解析暂不可用，请粘贴完整B站链接"→ 返回 `null` 阻断提交，用户获得明确提示。线上旧前端（待部署）仍是旧链路：404 响应体被当作 URL 继续归一化 → 终检警告不阻断 → 提交后无 try/catch，用户看到的是"点了提交没反应"。

新增实现时的三个约束：

1. **nginx 会剥离 `/api` 前缀**再反代到后端（部署契约见 [docs/deployment-env-matrix.md](../../../../docs/deployment-env-matrix.md)），后端应实现为 `GET /parse-redirect`；
2. 注意这是 `URLValidation` 里唯一**不经 `VITE_API_BASE_URL`** 的同源 fetch（`app/utils/tools.ts` 的 `_get`/`_post` 都拼接 API base，这里是裸 `fetch`）——本地开发环境同样需要代理配置才可联调；
3. 前端 `res.ok` 校验已补（2026-07-13）：错误响应体不再被当作解析结果，端点只需返回纯文本形式的完整 URL 即可接通。

关联缺陷登记：[known-issues.md](known-issues.md)。另：YouTube 解析依赖的 `YoutubeToken` 线上未配置，YouTube 链接提交必被 400 拒绝（详见模块 02 第 4.2 节）。

## 7. 已知怪异（简述）

以下均已于 2026-07-13 源码核实，处置定性与跟踪统一在 [known-issues.md](known-issues.md)，此处仅登记与本表单直接相关的行为：

- **模组"继承上次选择"是死逻辑**：`useEffect` 里 `if (prevData) memberData.uniequipId = prevData.uniequipId` 之后**紧跟无条件的默认模组赋值**，继承结果总被覆盖。
- **编辑 team 会重置模组选择，且 UI 可能与提交数据不一致**：team 每次变更都重建 `memberDataArray`（模组回落默认值），但 RadioGroup 是非受控（`defaultValue`）且 `key`（charId）未变不重建——界面上旧勾选可能保持，实际提交的 `uniequipId` 已是默认模组。
- **两段注释掉的调试 `useEffect` 残留**（提交前打印全量表单的 `console.log(data)` 已于 2026-07-13 删除，同批为 `handleSubmit` 补了 try/catch，见第 4 节）。
- **空输入显示"（1人）"**：人数 label 的 split 长度对空串为 1。
- **分隔符旁空格误报**：第③步校验用未 trim 的原文段比较，`A3 + B3` 这类写法解析成功但校验报"无法解析"。
- **`URLValidation` 的无效 `trim()`**：返回值未赋回，纯死语句。
