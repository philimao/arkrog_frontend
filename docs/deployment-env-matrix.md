---
last-verified: 2026-08-10
sources:
  - ../arkrog_backend/package.json
  - ../arkrog_backend/pm2.config.json
  - ../arkrog_backend/app.ts
  - ../arkrog_backend/app.js
  - ../arkrog_backend/database/mongo.js
  - ../arkrog_backend/database/redis.js
  - ../arkrog_backend/utils/record.js
  - ../arkrog_backend/utils/gamedata/shared.js
  - ../arkrog_backend/utils/gamedata/buildCharacterRawBundle.js
  - ../arkrog_backend/services/llm/config.ts
  - ../arkrog_backend/storage/sts.js
  - ../arkrog_backend/storage/cos.js
  - ../arkrog_backend/routers/mapRecognition.ts
  - ../arkrog_backend/utils/tencentApi.ts
  - ../arkrog_backend/middleware/rateLimit.ts
  - ../arkrog_backend/util-scripts/updateGameData.ts
  - vite.config.ts
  - app/utils/tools.ts
---

# 部署与环境矩阵

本文固化 arkrog 前后端的**部署实态**：进程入口、nginx 契约、环境变量矩阵、prod/dev 共库风险与双入口分歧。凡标注"核实于 2026-07-13"的均为当日登服务器（SSH 别名 `arkrog`）取证的线上事实；代码事实以本地 HEAD 为准。

> ⚠️ 安全约定：本文只出现环境变量**名**，严禁把 `.env` 实际值（连接串、密钥）写入文档或提交记录。

## 1. 站点矩阵（核实于 2026-08-05）

> 2026-08-03 服务器完成迁移，全部内容收敛到 `/arkrog` 下。**旧的 `/var/www/*` 与 `/home/ubuntu/arkrog_backend` 布局已作废**，本节曾按旧布局记载（核实于 2026-07-13），现更新。日常运维以服务器上的 `/arkrog/README.md` 为准。

|                                      | prod                                                               | dev                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 域名                                 | `arkrog.com`（含 `*.arkrog.com` 兜底）                             | `dev.arkrog.com`                                                                                                       |
| 前端静态根（nginx `root`）           | `/arkrog/prod/frontend/current`                                    | `/arkrog/dev/frontend/current`                                                                                         |
| 前端产物实体                         | `current` 是软链，指向 `frontend/releases/<时间戳>/`，回滚即改软链 | 同左                                                                                                                   |
| 后端 pm2 进程                        | `arkrog`，fork 单实例                                              | `arkrog-dev`，cluster ×2                                                                                               |
| 后端 cwd                             | `/arkrog/prod/backend`                                             | `/arkrog/dev/backend`                                                                                                  |
| 端口（`.env` 的 `PORT`）             | 5174                                                               | 5175                                                                                                                   |
| `NODE_ENV`                           | production                                                         | **production**（不是 development）——由 pm2 在进程内注入（来自 `dump.pm2`），`/proc/<pid>/environ` 里看不到，别据此误判 |
| 部署分支 / 提交（核实于 2026-08-05） | 后端 `dev_tournament` @ `c82ca59`                                  | 后端 `dev_tournament` @ `10eb7b6`；前端 `teresa-dev` @ `f869aae`                                                       |
| Redis 前缀（`REDIS_PREFIX`）         | 未配置 → 默认 `arkrog`                                             | `arkrog-dev`                                                                                                           |
| Mongo                                | **同一台 localhost mongod、同一个 `arkrog` 库**（见第 4 节）       | 同左                                                                                                                   |

部署一律通过 `/arkrog/bin/` 下的脚本，不要手动改文件或直接调 pm2：`sudo -u arkrog /arkrog/bin/deploy-frontend.sh <env> --from-release`（前端，产物由 GitHub Actions 发布到固定 tag `dist-latest`）、`sudo -u arkrog /arkrog/bin/deploy-backend.sh <env>`（后端，会 pm2 stop → `git pull --ff-only` → `yarn install --frozen-lockfile` → 起进程 → 轮询 `/app/banners` 健康检查）。

> ⚠️ **不要在服务器上构建前端**。该机器 2 核 1.7GB 内存，Vite 构建峰值过 1GB 会触发 OOM killer，而它优先杀的正是 mongod / redis / node。

## 2. 后端进程与入口

### 2.1 实际入口：tsx watch（pm2.config.json 是死配置）

两个 pm2 进程的真实启动命令都是 `yarn run dev:tsx`，即 `arkrog_backend/package.json` scripts 里的 `tsx watch app.ts`（核实于 2026-07-13：`pm2 jlist` 的 exec path 为 yarn，args 为 `run dev:tsx`）。

`arkrog_backend/pm2.config.json`（script 指向 `./app.js`、instances 0）**从未被 pm2 使用**，属死配置；`package.json` 的 `dev` / `prod` 脚本（`node ./app.js`）也已无法启动（第 6 节）。判断入口一律以 pm2 实际进程为准。

两个衍生事实：

- **tsx watch 自带热重载**：文件一变即重启。在服务器上切分支/拉代码前必须先 `pm2 stop`，否则会用旧 `node_modules` 跑新代码直接崩溃；装完依赖再 start。
- **重启后端 = 隐式全量缓存重建**：`app.ts` 启动序列会清掉除 `sess:` 外的所有 Redis 键并 `warmUpCache` 预热（`dataCacheManager.warmUpCache`），这是数据不一致时的事实兜底手段，详见[无藏运维手册](../app/modules/RelicFree/docs/07-ops-runbook.md)。

### 2.2 日志

pm2 日志落在各后端目录 `logs/` 下，由 pm2 模块 `pm2-logrotate-ext` 轮转（核实于 2026-07-13：max_size 10M、retain 30、每日 0 点强制轮转，产物形如 `err__YYYY-MM-DD_HH-mm-ss.log`）。排查历史错误（如数据链路断裂的 TypeError）就在这里翻。

## 3. nginx `/api` 前缀契约

nginx（`/etc/nginx/sites-available/arkrog`，核实于 2026-07-13）对两个站点各配置了：

```nginx
location /api/ {
    proxy_pass http://localhost:5174/;   # dev 站为 5175
    rewrite ^/api/(.*)$ /$1 break;
    ...
}
```

即：**剥掉 `/api` 前缀后反代到后端根路径**（`proxy_pass` 尾斜杠与 `rewrite` 双保险）。后端路由全部挂载在根路径（`arkrog_backend/app.ts` 的 `app.use("/record", ...)` 等挂载表），前端一切 `/api/*` 调用都依赖这次改写。推论：

- 后端新增顶级路由**不需要**改 nginx，只要挂在 Express 根路径下；
- 反之，任何"实现在 nginx 别处"的想象都不成立——nginx 只有这一条 API 规则。`/api/parse-redirect` 之所以 404，是被剥前缀转发到后端 `/parse-redirect` 后无路由承接：它是**待新增端点**（幻影端点权威结论见[无藏提交表单与外链解析](../app/modules/RelicFree/docs/05-submit-form-and-links.md)）。新增实现时同样只需在后端挂 `/parse-redirect` 路由，无 nginx 改动。

### 前端如何拼出 `/api`

- `app/utils/tools.ts` 的 `_get` / `_post` / `_delete` 以 `import.meta.env.VITE_API_BASE_URL` 为前缀：本仓库 `.env.production` 设为 `/api`（走上面的 nginx 契约），`.env.development` 设为 `http://localhost:5174`（直连本地后端）。
- `vite.config.ts` 的 dev server 另有一条 `/api` proxy → `https://dev.arkrog.com/api`：它服务的是源码中**硬编码 `/api/` 前缀**的调用（如 `app/utils/record.ts` 对 `/api/parse-redirect` 的 fetch），与 `VITE_API_BASE_URL` 是两条互不相干的通路。

## 4. ⚠️ prod / dev 共用生产库

**dev 站（dev.arkrog.com）的一切写操作直达生产数据。** 机制链（代码 + 线上核实于 2026-07-13）：

1. `arkrog_backend/database/mongo.js` 的 `connect(env = "development")` 按**入参**（而非 `NODE_ENV`）在 `MONGO_URI` / `MONGO_URI_PROD` 之间二选一；
2. `app.ts` 与 `app.js` 都以**无参**调用 `connect()` → 恒走 `MONGO_URI` 分支；
3. 线上两份 `.env` 中 `MONGO_URI` 与 `MONGO_URI_PROD` 的值相同（已比对），都指向同一台 localhost mongod；
4. 库名 `"arkrog"` 硬编码在 `connect` 内（`client.db("arkrog")`），连"用不同库名隔离"的退路也没有。

Redis 侧靠 `REDIS_PREFIX` 做了隔离（prod 默认 `arkrog`、dev 配置 `arkrog-dev`，见 `database/redis.js` 的 `redisConnect`），**Mongo 侧没有任何隔离**。在 dev 站提交/删除无藏记录、发反馈、注册用户，改的都是生产数据——测试写操作前先想清楚。

（`MONGO_URI_PROD` 目前只被 `util-scripts/updateGameData.ts` 与 `syncDatabase.js` 按 `NODE_ENV` 读取；主服务实际只消费 `MONGO_URI`。）

## 5. .env 键矩阵

dotenv 加载顺序（`app.ts`）：`.env` → `.env.${NODE_ENV}`，`override: true` 使**后者覆盖前者**。线上 `NODE_ENV=production`（pm2 注入 + `.env.production` 再声明一次），故生效层叠为 `.env` ← `.env.production`。

下表"读取点"经全仓库 `process.env` grep 核实；"线上配置"为 2026-07-13 服务器 `.env` / `.env.production` 键名清单比对结果（只看键名，不看值）。

| 键                                                         | 读取点（路径 + 符号）                                                                                | 线上配置                                          | 备注                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                                                     | `app.ts`（默认 5174）                                                                                | `.env`：prod 5174 / dev 5175                      | nginx 反代目标即此端口                                                                                                                                                                                               |
| `NODE_ENV`                                                 | `app.ts`（默认 development）、`middleware/errorHandler.js`、`util-scripts/updateGameData.ts`         | pm2 注入 + `.env.production`                      | 决定 dotenv 层叠与 updateGameData 连哪个库                                                                                                                                                                           |
| `SESSION_SECRET`                                           | `app.ts` 的 session 中间件                                                                           | `.env`                                            |                                                                                                                                                                                                                      |
| `MONGO_URI` / `MONGO_URI_PROD`                             | `database/mongo.js` 的 `connect`、`util-scripts/updateGameData.ts`、`syncDatabase.js`                | `.env`，两键值相同                                | 主服务恒走 `MONGO_URI`（第 4 节）                                                                                                                                                                                    |
| `REDIS_URI` / `REDIS_PORT` / `REDIS_DB` / `REDIS_PASSWORD` | `database/redis.js` 的 `redisConnect`（默认 localhost:6379 / db 0）                                  | `REDIS_PASSWORD` 在 `.env.production`             |                                                                                                                                                                                                                      |
| `REDIS_PREFIX`                                             | `database/redis.js`（默认 `arkrog`）、`services/bilibili/cache.ts`、`updateGameData.ts`              | 仅 dev 的 `.env.production`（`arkrog-dev`）       | prod/dev Redis 隔离的唯一机制                                                                                                                                                                                        |
| `DATA_PATH`                                                | `utils/gamedata/shared.js`、`updateGameData.ts`                                                      | `.env`（`~` 开头）+ `.env.production`（绝对路径） | **层叠顺序 load-bearing**：Node 不展开 `~`，靠 `.env.production` 的绝对路径覆盖才可用                                                                                                                                |
| `ACTIVE_CHARS`                                             | `utils/gamedata/buildCharacterRawBundle.js`                                                          | `.env`                                            |                                                                                                                                                                                                                      |
| `SECRET_ID` / `SECRET_KEY` / `BUCKET`                      | `storage/sts.js`、`storage/cos.js`、`utils/appData/db.js`、`utils/tencentApi.ts` 的 `callTencentApi` | `.env.production`                                 | 腾讯云 COS 与云 API 共用同一对密钥；`BUCKET` 仅 COS 用。该密钥需具备 `ocr:GeneralBasicOCR` 权限，否则地图识别返回 502                                                                                                |
| `OCR_ENDPOINT_HOST`                                        | `routers/mapRecognition.ts`（默认 `ocr.tencentcloudapi.com`）                                        | dev `.env` 已配                                   | 生产应设 `ocr.internal.tencentcloudapi.com`（内网端点，解析到 169.254.1.10，不占公网带宽）。**该域名只在腾讯云 VPC 内解析**，本地开发/CI 必须留默认公网域名。换端点由代码走 TC3 签名的 `host` 参数完成，不是只改 URL |
| `OCR_REGION`                                               | `routers/mapRecognition.ts`（默认 `ap-guangzhou`）                                                   | dev `.env` 已配                                   | 服务器在 ap-beijing，生产应设 `ap-beijing`                                                                                                                                                                           |
| `SECRET_ID_2` / `SECRET_KEY_2`                             | `utils/ocrStrategies.ts` 的 `credentialsOf`                                                          | dev 已配，prod 未配                               | 可选的第二组腾讯云密钥，用于延长 OCR 降级链（见[黑流模块 01](../app/modules/Tool/BlackFlowMap/docs/01-screenshot-recognition.md) 3.1）。未配置时相关策略静默跳过，不影响功能                                         |
| `DASHSCOPE_API_KEY`                                        | `services/llm/config.ts`、`routers/tournament.js`                                                    | `.env`                                            | 百炼 LLM                                                                                                                                                                                                             |
| `LLM_BASE_URL` / `LLM_DEFAULT_MODEL` / `LLM_TIMEOUT`       | `services/llm/config.ts` 的 `config` / `getEnvConfig`                                                | 仅 `LLM_DEFAULT_MODEL`                            | 服务器 `.env` 里的 `DASHSCOPE_BASE_URL`、`DASHSCOPE_TIMEOUT` 两键**无任何代码读取**（死键，代码读的是 `LLM_` 前缀）                                                                                                  |
| `YoutubeToken`                                             | `utils/record.js` 的 `parseYoutubeURL`（视频 + 频道两次 API 调用）                                   | **两环境均未配置**                                | 请求 URL 拼出 `key=undefined` → YouTube 解析必走失败分支 → YouTube 链接的记录提交失败。详见[提交表单与外链解析](../app/modules/RelicFree/docs/05-submit-form-and-links.md)                                           |

上游数据仓库：`DATA_PATH` 指向的 `/home/ubuntu/ArknightsGameData` 是**浅克隆**（核实于 2026-07-13：`git rev-parse --is-shallow-repository` = true，按 `--depth=1` 方式维护）——它没有完整历史，更新走 `git pull`（或 `updateGameData --pull`），不要在服务器上对它做依赖历史的 git 操作。

## 6. app.js / app.ts 双入口分歧

后端存在两个入口文件，**只有 `app.ts` 是活的**。差异清单（逐行比对本地 HEAD）：

| 能力                                                                    | `app.ts` | `app.js`        |
| ----------------------------------------------------------------------- | -------- | --------------- |
| B站用户信息缓存启动构建（`#services/bilibili` 的 `buildUserInfoCache`） | ✅       | ✗               |
| 定时任务（`jobs/index.js` 的 `startJobs` / `stopJobs`）                 | ✅       | ✗               |
| `/misc` 路由挂载（`routers/misc.ts`）                                   | ✅       | ✗               |
| `bodyParser.json` 10mb limit                                            | ✅       | ✗（默认 100kb） |
| `SIGINT` / `SIGTERM` 优雅关闭                                           | ✅       | ✗               |
| `PORT` 做 `Number()` 归一                                               | ✅       | ✗               |

**`app.js` 用 plain node 已经起不来**（`yarn dev` / `yarn prod` 均不可用），原因是它 import 的若干模块只有 `.ts` 实体，`node` 无法解析而 `tsx` 可以：

- `app.js` 直接 `import("./routers/permission.js")` → 磁盘上只有 `routers/permission.ts`；
- `routers/redis-admin.js` → `#services/bilibili/index.js` → 目录内全部为 `.ts`；
- `routers/tournament.js` → `#services/tournament-agent/index.js` → 只有 `index.ts`。

**收敛建议**：删除 `app.js` 及 `package.json` 的 `dev` / `prod` 脚本与 `pm2.config.json`（或把后者改为真实的 `tsx watch app.ts` 配置并重新纳管）；在此之前，任何人不应再向 `app.js` 添加挂载或修改——改了也不会生效，只会加深双源漂移。

## 7. 部署流程与工作树滞后

> 以下为 2026-08-03 迁移后的流程（核实于 2026-08-05）。手动 scp / 手调 pm2 的老办法已作废，一律走 `/arkrog/bin/` 脚本。

### 前端

`pnpm build`（SPA，`ssr: false`）产出 `build/client/`。**推荐路径是零上传**：push 到 `teresa-dev` 触发 GitHub Actions 的 build-release 工作流（约 2–3 分钟），产物以固定资产名发布到 pre-release tag `dist-latest`，然后在服务器：

```bash
sudo -u arkrog /arkrog/bin/deploy-frontend.sh dev --from-release
# dev 验证无误后，把同一份产物提升到 prod（纯本地复制，不重新下载）
sudo -u arkrog /arkrog/bin/deploy-frontend.sh prod --from-dir /arkrog/dev/frontend/current
```

脚本会校验 sha256（跨境链路可能截断，校验不过直接拒绝部署）、写入新的 `releases/<时间戳>/` 并切换 `current` 软链，**无需重启任何进程**；旧 release 保留若干份作回滚。备选路径（rsync 增量上传、打包上传）见服务器 `/arkrog/README.md`。

### 后端

```bash
sudo -u arkrog /arkrog/bin/deploy-backend.sh dev     # 或 prod；加 --dry-run 只做校验
```

脚本内部：校验 `dev:tsx` 脚本仍在（它是 pm2 的启动命令，删了下次 restart 直接挂）→ `pm2 stop`（必须先停，tsx watch 热重载会用旧依赖跑新代码）→ `git pull --ff-only` → `yarn install --production=false --frozen-lockfile`（tsx 是 devDependency，必装）→ 起进程 → 轮询 `/app/banners` 直到返 200，失败则打日志并以非 0 退出。

> 后端安装用的是 **yarn**（`yarn.lock`），与前端仓库的 pnpm 不同，别混。

### ⚠️ 工作树不会自动更新

服务器不自动拉代码，prod 与 dev 的提交常不同步（当前状态见第 1 节表格）。在文档或排障中引用"后端行为"时，须区分 prod / dev 与本地 HEAD。

部署含缓存修复的版本后，还需按[无藏运维手册](../app/modules/RelicFree/docs/07-ops-runbook.md)回填：L4 管理员 `POST /admin/calculate-stage-preview` 重算 stage-preview，再跑 `util-scripts/updateGameData.ts` 重建 stage-enemies。

## 相关文档

- [全站鉴权与权限机制](auth-and-permissions.md) —— 线上守卫滞后的具体影响面
- [游戏数据管线](data-pipeline.md) —— updateGameData / 缓存 / HTTP 强缓存链路
- [无藏运维手册](../app/modules/RelicFree/docs/07-ops-runbook.md) —— curl 操作矩阵与回填顺序
- [无藏 known-issues](../app/modules/RelicFree/docs/known-issues.md) —— 部署滞后与断裂登记簿
