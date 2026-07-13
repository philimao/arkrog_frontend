---
last-verified: 2026-07-13
sources:
  - ../arkrog_backend/routers/admin.js
  - ../arkrog_backend/routers/redis-admin.js
  - ../arkrog_backend/routers/record.js
  - ../arkrog_backend/routers/relic-free.js
  - ../arkrog_backend/app.ts
  - ../arkrog_backend/utils/dataCache.js
  - ../arkrog_backend/utils/appData/stagePreview.js
  - ../arkrog_backend/utils/appData/stageEnemies.js
  - ../arkrog_backend/util-scripts/updateGameData.ts
  - ../arkrog_backend/database/redis.js
  - ../arkrog_backend/docs/Permission.md
  - ../arkrog_backend/package.json
  - app/components/RecordCard/RecordCard.tsx
  - app/modules/RelicFree/Stage/SubmitRecordForm.tsx
  - app/stores/relicFreeStore.ts
  - app/modules/Admin/index.tsx
---

# 无藏运维操作手册

无藏侧运维当前**只能靠 curl 与服务器 shell**：Admin 前端后台（`app/modules/Admin/`）只有赛事审核两页（PendingTournaments / TournamentAudit），`POST /admin/calculate-stage-preview` 与 `/redis-admin/*` 没有任何 UI 入口。数据链路本身的原理见 [06-data-pipeline.md](./06-data-pipeline.md)，已确认缺陷登记见 [known-issues.md](./known-issues.md)。

## 1. 调用前提

- **域名与前缀**：线上 nginx 剥掉 `/api` 前缀后反代到后端进程，故对外 URL 形如 `https://<站点域名>/api/admin/...`；直连后端则为 `http://<主机>:<端口>/admin/...`（`app.ts` 默认端口 5174）。部署实态见 [deployment-env-matrix.md](../../../../docs/deployment-env-matrix.md)。
- **鉴权**：管理端点靠 session cookie。`app.ts` 的 `session` 配置未自定义 cookie 名，即 express-session 默认的 `connect.sid`——用管理员账号登录站点后，从浏览器 DevTools（Application → Cookies）复制该 cookie 值，curl 时带 `-H "Cookie: connect.sid=<值>"`。
- **等级语义**以 `arkrog_backend/docs/Permission.md` 为权威（4=ADMIN、5=SU、6=ROOT；全站权限机制见 [auth-and-permissions.md](../../../../docs/auth-and-permissions.md)）。

> ⚠️ **阈值不一致**：`routers/admin.js` 的 `requireAdminLevel` 要求 `level >= 4`，而 `routers/redis-admin.js` 的守卫写的是 `level <= 4` 拒绝——即 **`/admin/*` 是 Level 4+，`/redis-admin/*` 实际是 Level 5+（SU）**，一字之差。Level 4 管理员可以全量重算 stage-preview，但无法查看/刷新 Redis 缓存。

## 2. 运维操作矩阵

| 操作 | 端点 / 入口 | 鉴权 | 影响范围 | 验证方法 |
|---|---|---|---|---|
| stage-preview 全量重算 | `POST /admin/calculate-stage-preview`（`routers/admin.js` → `stagePreviewFullUpdate`） | Level ≥ 4 | 重算全部关卡最少人数 + 面包屑，写 Redis `appdata:stagePreview` + Mongo `Data.stage-preview`，整体替换 | 响应含 `N stages processed`；再 curl `/relic-free/stage-preview` 抽查（§6） |
| stage-preview 单关增量重算 | 无独立端点；由 `POST /record/submit` / `POST /record/delete` 顺带触发（fire-and-forget） | 提交 Level ≥ 3，删除 Level ≥ 4（`routers/record.js`） | 仅该 `stageId` 条目 | 2 秒后前端自动强刷；或 curl `/relic-free/stage-preview` 看该关字段 |
| 首页"最新"缓存失效 | 无独立端点；`POST /record/submit` / `POST /record/delete` 成功后非阻塞 `del("latestRecordIds")`（`routers/record.js`，2026-07-13；此前该键为永久缓存，只能手动刷或重启） | 同上行 | 仅 `appdata:latestRecordIds` 键；下次请求懒加载重建 | curl `/app/bundle` 看 `latestRecordIds`（注意 §6 的 1 小时 HTTP 强缓存） |
| 删除一条记录 | RecordCard 卡片删除图标（`app/components/RecordCard/RecordCard.tsx` 的 `RecordCard`，图标仅 Level ≥ 4 显示）→ `POST /record/delete` | 前端软守卫 + 后端 Level ≥ 4 硬校验 | 硬删 Records 文档 + 自动增量重算该关 preview（副作用矩阵见 [02](./02-record-lifecycle-and-schema.md)） | 页面记录消失；2 秒后最少人数徽标更新 |
| Redis 单键刷新 | `POST /redis-admin/refresh`（body 带 `key`/`type` → `dataCacheManager.refreshCache`） | Level ≥ 5 | 删该键后按 type 重载 | `GET /redis-admin/key/:key` 看新值 |
| Redis 全量预热 | `POST /redis-admin/refresh`（body 不带 `key` → `warmUpCache`） | Level ≥ 5 | 重载全部 gamedata/appdata/dumpdata 键（从 Mongo/文件回灌，**不重算**） | `GET /redis-admin/keys?pattern=appdata:*` |
| 查看缓存键/键值 | `GET /redis-admin/keys?pattern=...`、`GET /redis-admin/key/:key`、`GET /redis-admin/info`、`GET /redis-admin/categories` | Level ≥ 5 | 只读 | — |
| 删除单个缓存键 | `DELETE /redis-admin/key/:key` | Level ≥ 5 | 仅该键；下次请求触发懒加载回填 | 再 GET 该键应 `exists: false` |
| stage-enemies 重建 | **无 HTTP 端点**。只能 `util-scripts/updateGameData.ts` 第 5 步，或直接执行 `utils/appData/stageEnemies.js` | 服务器 shell | 写 Redis `appdata:stageEnemies` + Mongo `Data.stage-enemies` | curl `/relic-free/stage-enemies`（注意 §6 的 bundle 缓存延迟） |
| 离线全量数据管线 | `yarn update-data` / `yarn update-data:prod --yes`（`util-scripts/updateGameData.ts` 七步，含 stage-enemies + stage-preview） | 服务器 shell；生产库必须 `--yes` | 全部游戏数据 + 两份无藏派生数据 + 缓存预热 | 七步日志全 `done`；正文见[顶层数据管线](../../../../docs/data-pipeline.md)第 3 节 |
| 重启后端（兜底） | `pm2 restart <进程>`；启动时 `app.ts` 清空全部非 `sess:` Redis 键并 `warmUpCache` | 服务器 shell | 隐式全量**缓存**重建（§5） | 启动日志 `Cache warm-up completed` |

> `GET /redis-admin/status` 现整体透传 `dataCacheManager.getStats()` 的 `{ redis, memory, total }` 三层嵌套结构（2026-07-13 修复：此前路由按旧扁平字段名取值恒 undefined，Redis 侧计数又因 KEYS 模式不带物理前缀恒为 0，返回的 `stats` 是空对象；现 `getStats` 内部手动拼物理前缀统计，详见 `arkrog_backend/docs/DataCache.md`）。矩阵与本条标注"2026-07-13"的行为——**以下修复均未部署**：线上仍运行旧版后端，线上 `/status` 仍返回空 `stats`，验证线上缓存请改用 `/redis-admin/keys` 或 `/redis-admin/info`。

### curl 示例

```bash
HOST="https://<站点域名>/api"
COOKIE='Cookie: connect.sid=<从浏览器复制的会话 Cookie 值>'

# stage-preview 全量重算（Level 4+）
curl -X POST "$HOST/admin/calculate-stage-preview" -H "$COOKIE"

# 刷新单个 appdata 缓存键（Level 5+）
curl -X POST "$HOST/redis-admin/refresh" -H "$COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"key":"stagePreview","type":"appdata"}'

# 全量预热（Level 5+；body 不带 key 即 warmUpCache）
curl -X POST "$HOST/redis-admin/refresh" -H "$COOKIE" \
  -H "Content-Type: application/json" -d '{}'

# 查看无藏相关缓存键与键值（Level 5+）
curl "$HOST/redis-admin/keys?pattern=appdata:*" -H "$COOKIE"
curl "$HOST/redis-admin/key/appdata:stagePreview" -H "$COOKIE"

# 删除单个缓存键（Level 5+；下次请求懒加载回填）
curl -X DELETE "$HOST/redis-admin/key/appdata:stagePreview" -H "$COOKIE"
```

两个易错点：

- **刷新 appdata 键必须显式传 `"type":"appdata"`**：`refreshCache` 的 type 默认 `gamedata`，漏传时该键被删除后按 gamedata 重载失败，留空直到下次业务请求触发懒加载。
- 键名 kebab/camel 皆可（`dataCacheManager` 内部经 `kebabToCamel` 折叠，见 [06](./06-data-pipeline.md) 第 2.2 节），但 `/redis-admin/key/:key` 这类直读 Redis 的端点必须用折叠后的实际键名（`appdata:stagePreview`）。

## 3. 危险端点警告

> 🚨 **`GET /redis-admin/flush-all` 与 `DELETE /redis-admin/pattern/:pattern` 不过滤 `sess:` 前缀。**
>
> session 与缓存共用同一个带 `REDIS_PREFIX` 的 ioredis 客户端（`app.ts` 的 RedisStore，键形如 `arkrog:sess:<sid>`），而这两个端点对 `getRedisKeys` 的结果逐键删除、没有任何排除名单：
>
> - `flush-all` 删除**全部**键 → 所有用户（含操作者本人）session 即刻失效，**全站登出**；
> - `flush-all` 是 **GET 方法**——浏览器地址栏补全、爬虫、curl 忘记指定方法都可能误触；
> - `DELETE /pattern/:pattern` 传 `*`、`sess:*` 等宽 pattern 时后果相同；
> - 被删的不只是"缓存"：`seed:stats:*` / `seed:action:*`（种子点赞/复制计数，`dataCacheManager` 只写 Redis、仓库内无 Mongo 落库路径）与 `edit:lock:*` 等**主存储/状态键**一并丢失，且无法恢复。
>
> **操作纪律**：清缓存永远用窄前缀 pattern（`appdata:*`、`gamedata:*`、`dumpdata:*`、`leveldata:*`）或单键删除；需要"全清"时优先重启后端——`app.ts` 的启动清理带 `!key.startsWith("sess:")` 过滤，至少保住登录态（但同样会清掉 `seed:*` 等非 `sess:` 键，见 §5）。

## 4. 断裂修复后的回填顺序

背景与措辞规范见 [06](./06-data-pipeline.md) 第 3.3 节：写路径断裂存在于 fc2f75f ~ 790afd6 区间，已由 790afd6（2026-07-13）修复、本地 HEAD 已含该提交；**线上仍跑 3b04de7，Mongo 的 `Data.stage-preview` / `Data.stage-enemies` 自断裂起未更新，部署后必须回填**。顺序：

1. **部署修复**：服务器拉取含 790afd6 的分支，安装依赖后 pm2 重启后端。重启自带的"清缓存 + warmUpCache"只是把 Mongo 里**仍是旧的**两份数据回灌 Redis，不会重算——所以仅部署不够。
2. **回填 stage-preview**：Level 4 管理员 `POST /admin/calculate-stage-preview`（§2 curl 示例），从现存 Records 全量重算并写 Mongo + Redis。
3. **重建 stage-enemies**：在配置了 `DATA_PATH` 的服务器目录跑 `yarn update-data:prod --yes`（完整七步，其第 6 步会再跑一遍 stage-preview，与上一步重复无害）；若只想重建 stage-enemies 可加 `--skip-preview`，或直接执行 `utils/appData/stageEnemies.js`。注意 `stageEnemiesUpdate` 直调 `processLevelData` 读解包文件，**离开有效 `DATA_PATH` 无法重建**（[06](./06-data-pipeline.md) 第 6 节）。
4. **验证**（§6）：先 curl 直验服务端，再无痕窗口过一遍页面。
5. **善后**：更新本篇与 [known-issues.md](./known-issues.md) 的"线上现状"表述。

## 5. 兜底手段：重启后端 = 隐式全量缓存重建

`app.ts` 启动序列：连 Mongo/Redis → **删除全部非 `sess:` 前缀 Redis 键** → `dataCacheManager.warmUpCache()`（动态枚举 GameData/AppData 全部键名 + 常用 DumpData 逐一回灌）。因此当怀疑 Redis 缓存被污染/不一致时，重启后端进程等价于一次安全版 flush-all + 全量预热，且保留登录态。

两个边界要认清：

- **重建的是缓存，不是数据**：warmUpCache 从 Mongo/文件读取回灌；`stage-preview` 若在 Mongo 里就是旧的，重启多少次都不会变新（重算走 §4 第 2 步）。
- 启动清理同样会删掉 `seed:*`、`edit:lock:*` 等非 `sess:` 键（§3 末尾）——对无藏无影响，但重启不是完全无副作用的操作。

## 6. 验证方法与 HTTP 缓存延迟

服务端验证（不受浏览器缓存干扰）：

```bash
# stage-preview 无缓存头，curl 每次都是实时值；抽查某关（示例 ro4_b_4）
curl -s "$HOST/relic-free/stage-preview" | python -m json.tool | grep -A 6 '"ro4_b_4"'

# 增量链路健康检查：提交/删除一条记录后再查同一关，normalNum/eliteNum/boatNum 应随之变化；
# 同时服务端日志不应出现 "Error calculating stage preview"（fire-and-forget 的唯一痕迹）
```

浏览器侧要牢记 **`/relic-free/bundle` 的 24 小时 HTTP 强缓存**（[06](./06-data-pipeline.md) 第 1 节）：

- 强缓存期内浏览器**根本不发请求**，普通刷新无效——运维改完 `stageEnemies` / `character_basic` 后，已访问过的用户最长 24 小时后才会看到新数据；`/app/bundle`（首页记录卡、收录原则）同理，1 小时。
- 即时验证用**无痕窗口**，或 DevTools → Network 勾选 Disable cache（请求携带 `Cache-Control: no-cache`，`strongCacheMiddleware` 会整体跳过）。
- `stage-preview`（最少人数、面包屑）不受此限，刷新即新。

页面检查点：无痕窗口进入 `/relic-free` 选择器与关卡页，核对最少人数徽标、面包屑文案、敌人列表与头像是否符合预期。

## 7. 现状登记：无 UI、无告警

- **Admin 前端零无藏入口**：`app/modules/Admin/` 仅赛事审核两页，本篇全部操作没有图形界面，短期内以 curl 矩阵为准。
- **stage-enemies 无 HTTP 重建端点**（§2 矩阵），依赖服务器 shell。
- 增量重算失败只留一行 `console.error`，无告警/重试/可观测面板——链路健康只能靠 §6 的主动检查。相关工程化方向见[文档计划](../../../../docs/relic-free-doc-plan.md)第五节。
