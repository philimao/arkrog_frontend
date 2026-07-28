# 无藏收录 doc-as-code 文档落地计划

> 状态：已落地（2026-07-13 基于 11 智能体全模块调研产出，含线上部署实态核查与四处链路断裂的 tsx 实测确认；同日完成全部文档落地——正文/生成物/共享增补见 docs/README.md 收录，断裂已由 arkrog_backend@790afd6 修复，第六节遗留裁决项仍待维护者定夺）
> 范围：`app/modules/RelicFree` + `app/modules/RecordDisplay` + `app/modules/IndexPage/IndexRelicFree` + `app/components/RecordCard` + `app/stores/relicFreeStore` + 跨仓库记录/数据链路（arkrog_backend 的 `routers/relic-free.js`、`routers/record.js`、`routers/user.js` favorite/feedback、`utils/appData/*`）
> 范式：沿用 [damage-calculator-doc-plan.md](damage-calculator-doc-plan.md) 确立的约定——正文下沉模块内、顶层 docs/ 只放跨模块共享、清单类内容脚本生成、frontmatter `last-verified`+`sources`、引用代码用路径+符号名禁行号。

## 一、影响文档设计的关键调研结论

1. **现有文档对无藏近乎零覆盖**：全仓库唯一提及是 `docs/data-pipeline.md` 中一句"服务于无藏记录关卡等展示场景"；glossary 无任何无藏术语、CONTRIBUTING 映射表无触发条目、模块内无 docs/、`test/` 零测试。另有一篇**负价值文档**：`app/docs/RouteGuard使用指南.md` 描述的 RouteGuard/routePermissions 整套子系统零生产引用（纯死代码）——无藏路由公开是因为根本没挂守卫，不是 `"/relic-free": {}` 配置生效。
2. **权限有三层真相，且仓库内已有权威定义却无人引用**：①前端 level 门槛（提交 ≥3、删除 ≥4）全部是渲染层软守卫；②后端 `routers/record.js` 现行代码有 `router.use` L3 + delete 处理器内 L4 双守卫（本地 HEAD 含 6fe4525 安全修复，**线上部署 3b04de7 落后三周未含**）；③等级语义权威在 `arkrog_backend/docs/Permission.md`（0=VISITOR、1=USER、2=LINKED、3=CONTENT_ADMIN、4=ADMIN、5=SU、6=ROOT）——三个调研切面把它当悬而未决问题，实际仓库里有答案。level 阈值以魔数散落前后端 ≥5 处，且 `/admin` 要求 `>=4` 而 `/redis-admin` 要求 `>4`，一字之差。
3. **数据写路径断裂实锤（已实测 + 线上 err 日志确认）**：fc2f75f（2025-11-14）删除 `dataCacheManager.get/set` 后三处调用点未迁移，`stagePreviewSingleUpdate`（提交/删除触发的增量重算）100% TypeError 且被 `.catch(console.error)` 吞掉、admin 全量重算必 500、`updateGameData.ts` 因 `stageEnemies.js` 引用已删除的 `processLevelData` 导出而**整体无法启动**；另有隐藏层断裂（`processLevelData` 已变 async 未 await、`camelToKebab[key]` 对函数做下标访问恒 undefined）。**`docs/data-pipeline.md`（last-verified 2026-06-11）把该链路描述为可用，属重大失实，必须勘误**。前端"提交后 2 秒强刷最少人数"的契约实际落空。
4. **`/api/parse-redirect` 是幻影端点**：nginx 无此配置、后端全分支 git 历史从未有过、线上实测 404——b23 短链解析自上线以来一直是坏的，且 `URLValidation` 不校验 `res.ok` 会把 404 body 当解析结果。另线上两份 .env 均未配 `YoutubeToken`，YouTube 解析必走失败分支。
5. **举报是写入即黑洞**：ReportModal 发送的 `stageId` 被 `routers/user.js` POST /feedback 的 insertOne 字段清单静默丢弃，Feedback 集合全仓库零读取方，成功 toast 承诺的"个人中心回执"对应 `Home/Message` 静态 stub。
6. **删除是硬删除且副作用矩阵不完整**：Records ✓删、stagePreview ✓刷新（当前断裂）、`Users.favorite` ✗、session ✗、`latestRecordIds` 永久缓存 ✗ → 悬挂收藏永久残留且无 UI 清理入口。Favorite 页有叠加缺陷组：分页控件因 `title==='record'` vs 实际 `'记录收藏'` 字符串比较永不渲染（收藏只能看前 60 条）、`mergeArray` 是从索引 0 起的按位覆盖、前 60 条全悬挂时无限 POST 循环、RecordCard 条件 Hook 违规（延迟引爆）。
7. **stage id 命名约定是全模块的隐式基石**：`ro{n}_{b|n|e|sv|ev|t|duel|dv}_{idx}[_变体]` 的字符串解析支撑前端 `navOfZone` 七组筛选器、后端 `skipStage`/breadcrumb 生成、甚至计算器 blackboard。版本敏感硬编码横跨两仓库 10+ 处：前端 `numOfMinorBoss` ↔ 后端 `numOfZone3Boss` 同值双份必须人工同步；rogueKey 推导 5 文件 7 处两种写法（6 处 `"rogue_"+ro.slice(-1)` 在 ro10 时产出 rogue_0，仅 SubmitRecordForm 的 `replace("ro","rogue_")` 安全）；`topicMaxLevels`/`StageLevels`/EnemyAvatar preset/按主题命名的静态图素材，缺项全部静默失败。
8. **隐式契约密集且多为刻意设计**：上一关/下一关导航依赖 `Object.keys(stagePreview!)` 的后端键序；`/relic-free/bundle` 24h 强缓存 vs `/stage-preview` 无缓存头的不对称是设计而非疏漏；`uniequip_basic` 由前端从 `character_basic` 摊平派生；记录列表刻意不进 store（局部 useState + setRecords prop 链）；sessionStorage `relicFreeReturnUrl` 一次性消费。
9. **docs:gen 生成器可扩展性已论证**：现为伤害计算器专用单文件（正则+括号配对、确定性输出、无 CI 强制）；为无藏生成三份清单全部可行（端点表完全可行、筛选规则表需 NAV_PURPOSES 手工字典、硬编码快照需扩展 `parseObjectEntries` 支持数值与枚举键）。推荐抽 `scripts/docs-gen/lib.mjs` 按模块分文件。
10. **运维面只能 curl**：Admin 后台仅赛事两页，`POST /admin/calculate-stage-preview`（L4）与 `/redis-admin/*`（L5）无任何 UI 入口；`GET /redis-admin/flush-all` 与 `DELETE /pattern/:pattern` 不过滤 `sess:` 前缀会全站登出。pm2 实际入口是 `tsx watch app.ts`（`pm2.config.json` 是从未使用的死配置），prod/dev 两进程共用生产库。

## 二、目录结构

```
arkrog_frontend/
├─ CLAUDE.md                                   # 增补：高危约定加无藏条目（见 A 表）
├─ CONTRIBUTING.md                             # 增补：映射表加无藏触发条目（见 A 表）
├─ docs/                                       # 顶层：索引 + 跨模块共享
│  ├─ README.md                               # 增补：文档地图/按任务导航加无藏行
│  ├─ glossary.md                             # 增补：无藏域术语
│  ├─ data-pipeline.md                        # ★勘误+增补：断裂警示块 + /relic-free 端点小节（正文路由到模块 06）
│  ├─ auth-and-permissions.md                 # ★新建：全站真实权限机制 + RouteGuard 死代码宣告
│  ├─ deployment-env-matrix.md                # 新建：部署实态（nginx /api 契约、tsx 入口、prod/dev 共库、.env 矩阵）
│  ├─ doc-generation.md                       # 新建：docs:gen 架构与新模块扩展手册
│  └─ relic-free-doc-plan.md                  # 本计划
├─ app/docs/RouteGuard使用指南.md              # 处置：加"机制从未启用"过时横幅 → 过渡期后删除
├─ app/modules/RelicFree/
│  ├─ README.md                               # 新建：指针（3~5 行）
│  └─ docs/                                   # ★模块正文
│     ├─ README.md                            # 模块文档索引/阅读顺序
│     ├─ 01-architecture-and-data-flow.md     # 架构与数据流总览
│     ├─ 02-record-lifecycle-and-schema.md    # 记录数据契约与生命周期 ★
│     ├─ 03-stage-taxonomy-and-selector.md    # stage id 语法与关卡分层筛选 ★
│     ├─ 04-record-card-and-display.md        # RecordCard/RecordDisplay 复用契约
│     ├─ 05-submit-form-and-links.md          # 提交表单规格与外链解析
│     ├─ 06-data-pipeline.md                  # 无藏专有数据链路正文 ★
│     ├─ 07-ops-runbook.md                    # 运维操作手册（curl 矩阵 + 回填流程）★
│     ├─ known-issues.md                      # 已确认缺陷登记簿 ★
│     ├─ version-sensitive-hardcode.md        # 版本敏感硬编码正文（配生成物快照）
│     ├─ new-topic-checklist.md               # 新主题上线无藏侧手册 ★
│     ├─ adr/                                 # 架构决策补记（0001~0006）
│     └─ generated/                           # ★脚本生成物（pnpm docs:gen）
│        ├─ api-endpoints.md                  # 端点-调用点对照表
│        ├─ stage-filter-rules.md             # navOfZone 筛选规则表
│        └─ hardcode-snapshot.md              # 版本敏感字面量快照
├─ app/components/RecordCard/README.md         # 新建：指针
└─ app/modules/RecordDisplay/README.md         # 新建：指针
scripts/docs-gen/                              # 重构：lib.mjs + damage-calculator.mjs + relic-free.mjs
arkrog_backend/docs/DataCache.md               # 跨仓库联动件（见 E 表）
```

## 三、文档清单与优先级

### A. 仓库级横切件（增补/新建）

| 文档 | 优先级 | 要点 |
|---|---|---|
| `docs/data-pipeline.md` 勘误 | **P0（第一篇）** | 以警示块登记四处断裂（stageEnemies 失效 import→脚本无法启动、dataCacheManager.get/set 缺失→增量/全量重算全灭、未 await 的 async、camelToKebab 下标访问）；措辞规范："写路径自 fc2f75f 起断裂、线上 2026-06-20 err 日志仍在抛错"，不写无法考证的"冻结于 2025-11"；补 /relic-free 三端点缓存行为小节并链接模块 06 |
| `docs/auth-and-permissions.md` | P0 | 真实守卫清单（RequireAuth、AdminLayout LevelGuard、组件级隐藏）vs RouteGuard 死代码宣告；level 0-6 语义以 `arkrog_backend/docs/Permission.md` 为权威源引用；前端软守卫/后端硬门槛对照表；`/admin`(≥4) 与 `/redis-admin`(>4) 阈值不一致点；处置 RouteGuard使用指南.md |
| `docs/glossary.md` 增补 | P0 | 无藏（relic-free）、记录 Record、raider/submitter、StagePreview（normalNum=最高难度最少人数、面包屑）、stage-enemies、作战类型 normal/elite/boat、难度 N0/N15/N18、异格、层名（险路恶敌/是非境/今昔境）、收录原则 inclusionPrinciple（正文在 Mongo Data 集合，仓库文档覆盖不到——只登记其存在与下发链） |
| `docs/README.md` 增补 | P0 | 文档地图加无藏模块段；"按任务导航"加行：新主题上线→new-topic-checklist、排查记录/预览数据不更新→07+data-pipeline 勘误、改关卡筛选→03 |
| `CONTRIBUTING.md` 映射表增补 | P0 | 改 `stageSelector.ts` 任一筛选器/数量表 → 模块 03 + 检查后端 `shared.js` 跨仓库同步 + 重跑 docs:gen；改 `recordType.ts`/`routers/record.js` → 模块 02；改 `types/constant.ts` 三常量 → 模块 03；改 `stagePreview.js` → 模块 06；任何 `_get/_post` 调用点变更 → 重跑 docs:gen |
| `CLAUDE.md` 增补 | P1 | 高危约定加三条：stage id 字符串解析是模块基石（rogueKey 两种写法、ro10 击穿）；前后端双份 boss 数量表必须同步改；数据写路径断裂现状（勿按 data-pipeline 旧文操作）。命令速查更新 docs:gen 描述 |
| `docs/deployment-env-matrix.md` | P1 | pm2 实际入口 `tsx watch app.ts`（pm2.config.json 死配置）；nginx 剥 `/api` 前缀反代 5174/5175 的隐式契约；prod/dev 共用生产库警告；.env 键矩阵与已知缺失（YoutubeToken）；app.js/app.ts 双入口分歧与收敛建议；与个人部署 runbook 合并为仓库文档 |
| `docs/doc-generation.md` | P1 | docs:gen 架构（正则非 AST、确定性输出、多行调用静默漏提的局限）；新模块注册三步；两套 frontmatter 约定边界（手写 last-verified vs 生成物 generated:true 无时间戳）；npm script 命名（docs:gen 全量 + 按模块）；CI 校验（`git diff --exit-code`）为待建设项 |

### B. 模块正文 `app/modules/RelicFree/docs/`

| 文档 | 优先级 | 要点 |
|---|---|---|
| `01-architecture-and-data-flow.md` | P0 | Selector/Stage 两页组件树；四 store 分工（relicFreeStore/gameDataStore/appDataStore/recordStore）与端点映射；RootLayout preload + RelicFreeLayout 兜底的双保险加载与 loaded 闩锁；缓存不对称（bundle 24h vs stage-preview 无头）是刻意设计；记录列表局部 state + setRecords prop 链；topicId/zoneId URL params 与 relicFreeReturnUrl 契约；uniequip_basic 前端摊平派生（成文前以 `relic-free.js` 的 requestBundle 核实下发口径）；store 吞错→白屏/无限 Loading 的静默失败模式 |
| `02-record-lifecycle-and-schema.md` ★ | P0 | RecordType/TeamMemberData 契约与 Records 集合真实 schema（无校验层、req.body 落库、仅 _id 索引）——补上 TournamentDataSchema 的无藏对应物；**提交即发布、无审核流**；setRaiderInfo 的 B站/YouTube 解析分派与错误码映射；**删除副作用矩阵**（谁被清理谁不被清理）与悬挂收藏完整链路（favorite 写路径、/record/ids 三重静默：少返回/乱序/80 条截断）；权限对照（前端软守卫 vs record.js 双守卫，注明线上部署滞后）；2 秒 setTimeout 时序契约 |
| `03-stage-taxonomy-and-selector.md` ★ | P0 | stage id 语法权威文档（分段语义表）；navOfZone 七组筛选器逐条语义（numOfMinorBoss、excludeIds、洞天福地 7 层归第六层、dlc1 分境、boss filter 的 push 去重副作用双参签名）；跨仓库双份 boss 表同步义务；stagePreview 徽标口径与 TYPE-a/b 消歧；skipStage"前 3 层不收录"规则分裂三处（后端数据、前端筛选器、页面文案）；与计算器同名异物筛选器的消歧警告 |
| `04-record-card-and-display.md` | P1 | RecordCard 三消费入口（关卡页/首页/收藏页）与 isStagePage/record?/setRecords? props 语义（首页不传 setRecords→删除不刷 UI）；共享组件反向依赖模块 store（fetchStagePreview）的逆向耦合；操作权限矩阵与 openModal DOM-id 全局契约；主题化静态资源清单（deco 三图+banner+默认立绘）；背景立绘 Math.random 非确定性；桌面/移动双套操作栏；`!record` 占位分支现不可达 + Hook 违规延迟引爆警告 |
| `05-submit-form-and-links.md` | P0 | 字段清单与 team 字符串解析规则（`/[+、]/` 分隔、小车 `/-\d$/` 豁免、skillId="error" 哨兵、ignore_ 前缀剥离）；五步校验链顺序；URLValidation 全部归一化规则及"警告不阻断"的真实行为；**parse-redirect 幻影端点权威结论**（必须写"待新增端点"而非"实现在别处"）与新增实现的 nginx 约束；YoutubeToken 缺失后果；模组"继承上次选择"死逻辑等已知怪异 |
| `06-data-pipeline.md` ★ | P0 | 无藏专有数据链路正文：/relic-free 三端点与缓存差异、Mongo Data 两文档 + Redis appdata:* 键、stage-preview 增量（record 触发）/全量（admin 端点、updateGameData 第 6 步）双路径、stage-preview 是唯一混入用户数据的游戏数据产物（--skip-preview 的存在理由）、外部素材依赖（prts.wiki MD5 路径、COS preset、topic_banner）；共享段只链接顶层 data-pipeline.md 不复制 |
| `07-ops-runbook.md` ★ | P0 | 运维操作矩阵（操作→端点→鉴权→curl 示例→影响范围→验证方法）；**危险端点警告**（flush-all/pattern 删 sess: 全站登出、flush-all 是 GET）；断裂修复后的回填顺序（部署修复→L4 curl 全量重算→跑 updateGameData 重建 stage-enemies→无痕窗口验证）；"重启后端=隐式全量缓存重建"的事实兜底手段；HTTP 强缓存导致的可见延迟 |
| `known-issues.md` ★ | P0 | 登记簿：四处链路断裂；parse-redirect 幻影；举报黑洞四重断裂（stageId 丢弃、零读取方、假回执承诺、Message stub）；悬挂收藏与 Favorite 缺陷组（分页字符串比较、mergeArray、无限 POST 循环、Hook 违规、splice(-1) 误删）；StageDetail `stagePreview!` 非空断言崩溃；提交/删除无 try/catch 静默失败；recommendRecordIds 硬编码 ObjectId + latestRecordIds 永久缓存不失效；线上部署滞后于安全修复；/audit-log 无鉴权而无藏无审计的双缺口 |
| `version-sensitive-hardcode.md` | P1 | 逐项解释硬编码对应的上游变更类型与更新流程；正文引用 generated/hardcode-snapshot.md 的表不复制值；重点：rogueKey 两种写法分歧与收敛建议、EnemyAvatar 外链依赖 |
| `new-topic-checklist.md` ★ | P1 | 新主题（ro6+）上线两仓库 10+ 处散点清单：后端（names_en、三张 boss 表、preload 文案、enemyModify、topic_banner 静态图）+ 前端（RogueKey 类型、topicMaxLevels、numOfMinorBoss、navOfZone 特判、EnemyAvatar preset、card 装饰三图）；数据回填顺序；与计算器侧 checklist 互链不合并 |
| `adr/0001~0006` | P1 | 补记已发生决策并注明推翻条件：0001 提交即发布无审核流；0002 记录列表局部 state 不进 store；0003 bundle 强缓存与 stage-preview 无缓存的不对称；0004 stage id 字符串解析作为分类学基础；0005 前端软守卫+后端硬门槛的权限分层；0006 setTimeout 2000 时序契约（vs 响应驱动，修复断裂后再裁决） |

### C. 生成物 `generated/`（扩展 pnpm docs:gen）

| 文档 | 优先级 | 要点 |
|---|---|---|
| `api-endpoints.md` | P0 | 端点-调用点对照表，全文 matchAll `_get/_post`（范围内 100% 静态字面量，已实测验证）；扫描范围：RelicFree、RecordDisplay、IndexRelicFree、RecordCard、relicFreeStore、appDataStore（Home/Favorite 是否纳入待裁决） |
| `stage-filter-rules.md` | P1 | navOfZone 的 id/名称/filter 源码摘录/语义对照表 + numOfMinorBoss/excludeIds 快照；语义列沿 LIST_PURPOSES 手工字典模式 |
| `hardcode-snapshot.md` | P1 | 版本敏感字面量机器快照；rogueKey 推导点全仓正则枚举（防手写登记漏点）；"为何敏感"留给手写正文互链 |

实现：抽 `scripts/docs-gen/lib.mjs` 共享辅助层 + 新增 `relic-free.mjs`；npm script `docs:gen`（全量）+ `docs:gen:damage-calculator` + `docs:gen:relic-free`；同步更新 AUTO_BANNER 路径引用与 CLAUDE.md/CONTRIBUTING 中对旧脚本路径的引用。

### D. 指针（3~5 行，只放链接防双源漂移）

模块根 `app/modules/RelicFree/README.md`；`app/components/RecordCard/README.md` 与 `app/modules/RecordDisplay/README.md`（声明"无藏域展示组件、被首页/收藏页复用、反向依赖 relicFreeStore、删除会触发 fetchStagePreview(true)"，防止被误认为通用组件）。

### E. 跨仓库联动件（arkrog_backend）

| 文档 | 优先级 | 要点 |
|---|---|---|
| `arkrog_backend/docs/DataCache.md` | P1 | dataCacheManager 现有方法契约（清单可脚本生成）；set/get 已于 fc2f75f 移除的事实与三处遗留调用点迁移方案；kebab/camel 键名折叠约定；`.catch(console.error)` 会把方法缺失降级为一行日志的 review 警示；文件头 130 行 JSDoc 是底稿但示例与实际不符需修正 |
| 后端各 router 指针 | P2 | `routers/record.js`、`routers/relic-free.js` 头部注释指向前端模块 docs/ 正文（跨仓库单一正文源：记录域正文放前端模块内，后端只放指针） |

## 四、写作时的口径裁决（调研中已实证的矛盾，成文必须遵守）

1. rogueKey 写法计数以 `generated/hardcode-snapshot.md` 为准（实证：6 处 slice(-1) + SubmitRecordForm 1 处 replace）。
2. 举报缺陷按"写入即黑洞"定性（stageId 被后端丢弃、集合零读取方），不采用早期切面"无法定位到具体记录"的轻描述。
3. `stagePreviewSingleUpdate` 先按"当前 100% 失败"写；"增量更新丢面包屑（不调 buildPreloadData）"是修复后才浮现的次级问题，作为修复后的 known-issue 预登记。
4. level 语义一律引用 `arkrog_backend/docs/Permission.md`，禁止再按业务猜测（level 3 = CONTENT_ADMIN，"提交门槛 ≥3"的语义是内容管理员而非普通达标用户）。
5. `routePermissions.ts` 的任何配置不得作为生效机制引用（死代码）。
6. `uniequip_basic`/`stageEnemies` 的 bundle 下发口径，成文前以 `routers/relic-free.js` 的 requestBundle 实现为准逐字段核实（三切面口径不一）。
7. 权限描述区分"本地 HEAD 现行代码"与"线上部署版本（落后、未含 6fe4525）"，known-issues 登记部署滞后而非把旧行为写进正文。

## 五、与后续自动化目标的衔接

参照伤害计算器"文档完成后才做数据更新自动化"的路径，无藏的对应目标是**新主题上线半自动化 + 数据链路可观测**：① 修复四处断裂（前置工程项，07/known-issues 提供事实依据）；② 新主题散点改动 → new-topic-checklist + hardcode-snapshot 生成物做覆盖对账（对照后端 topics 数据与 navOfZone/数量表缺项）；③ 记录→预览重算链路健康检查 → 07 的验证方法一节；④ 跨仓库双份表一致性 → 可在 docs:gen 中加前后端数值比对（前端仓库内先登记，跨仓库校验为待建设项）。

## 六、需维护者裁决的问题（不阻塞 P0 动笔，但影响部分文档措辞）

1. **修复顺序**：四处断裂是"先登记现状再修"（07 写勘误体）还是"先修复再写 runbook"（07 写操作手册体）？建议前者——文档先固化事实，修复 PR 引用之。
2. RouteGuard 死代码子系统（含 routePermissions.ts、使用指南）删除还是保留待启用？影响 auth-and-permissions.md 的处置一节。
3. 举报黑洞、Favorite 缺陷组、悬挂收藏是否随文档落地附带修复/一次性清理脚本（需先连生产库量化悬挂存量）。
4. 本地 6fe4525 安全修复与 dataCache 修复的部署计划（部署时 07 的"线上现状"段需同步更新）。
5. `api-endpoints.md` 扫描范围是否纳入 `Home/Favorite`（也调 /record/ids，但属个人中心模块）。
6. 「按干员」筛选 stub 与 /seed 路由停用的规划状态——决定 03 是否留占位章节。
