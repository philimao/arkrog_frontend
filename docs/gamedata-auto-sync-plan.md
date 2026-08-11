---
last-verified: 2026-08-11
sources:
  - ../arkrog_backend/util-scripts/updateGameData.ts
  - ../arkrog_backend/utils/dataCache.js
  - ../arkrog_backend/utils/gamedata/buildGameData.js
  - ../arkrog_backend/utils/gamedata/buildCharacterRawBundle.js
  - ../arkrog_backend/database/mongo.js
  - ../arkrog_backend/database/redis.js
  - data-pipeline.md
  - deployment-env-matrix.md
---

# 解包数据自动同步（cron）设计

> **状态：规划（未实施）**。本文是设计与取舍记录，不是运维手册。实施后，操作口径并入[数据管线 Runbook](data-pipeline.md)，本文只保留"为什么这么设计"。
> 现行的手动更新流程仍以[数据管线 Runbook](data-pipeline.md) 第 3 节为准。

## 1. 目标与非目标

**目标**：消除"人工定期登服务器跑 `update-data`"这一步。上游解包仓库更新后，服务端数据自动跟进，无人值守。

**非目标**（都是有意不做，理由见第 7 节）：

- 不解决前端缓存延迟——用户仍最多等 24 小时；
- 不自动上架干员——`ACTIVE_CHARS` 白名单与 charImpl 实现保持人工；
- **不自动适配新肉鸽主题**——新主题一律硬阻断，等人工处理（第 4.3 节）。

## 2. 现状（核实于 2026-08-11）

服务器上**没有任何定时任务在同步上游**：`ubuntu` 用户 crontab 只有一条证书续签，`arkrog` 用户无 crontab，`/etc/cron.d/` 与 `systemctl list-timers` 全是系统项，后端 `jobs/index.js` 的 `startJobs` 内容整体被注释、是空壳。上游同步 100% 靠人工。

后果是数据滞后没有下限：2026-08-11 检查时，线上解包数据停在 2026-07-18 拉取的 `Data:26-07-16`，滞后三周有余。

实测一次完整更新的成本（2026-08-11，服务器 2 核 1.7GB）：

| 环节 | 耗时 |
|---|---|
| `git fetch --depth=1`（经 mihomo 代理 7890） | ~30s |
| prod 全量七步（含 stage-preview 全量重算） | 122s |
| dev 一遍（`--skip-preview`） | 122s |

即"有更新"时约 4.5 分钟，"无更新"时只有一次 fetch 的 30 秒。这个成本结构决定了：**调度可以频繁，重建必须条件触发**。

## 3. 参考实现：arkrec（ArkRecordWiki）

arkrec 已有一套跑了很久的同类管线，其设计为 `cron → gamedata-sync.sh →（pull 多源 + poke 后端 /game/refresh）→ 后端在 mtime 水位门控下加锁刷新`。四个设计要点与本项目的取舍：

| arkrec 的设计 | arkrog 是否采纳 | 理由 |
|---|---|---|
| cron 只做 pull + 通知，重建逻辑留在后端进程 | **不采纳** | arkrec 的重建逻辑长在后端里，只能靠 HTTP poke 触发；arkrog 的 `updateGameData.ts` 本就是独立进程，跑完写共享 Redis 即刻生效（[数据管线](data-pipeline.md) 第 3 节），主服务无需重启。加 poke 端点纯属增加攻击面 |
| **变更水位**：只有源真的变了才重算 | **采纳，改用 commit sha** | arkrec 用文件 mtime，arkrog 只有一个 git 源，commit sha 比 mtime 准（`checkout` 会无差别刷新 mtime）。实现见第 4.2 节 |
| **重建加锁** | **采纳** | 重建要 2 分钟，cron 与人工操作可能重叠 |
| `--force` 逃生口：强制重跑而不改水位 | **采纳** | 手工改坏数据后需要强制重建 |

arkrec 没有、而 arkrog 必须解决的三件事，构成本设计的主要内容：新主题闸门（4.3）、prod/dev 两遍执行（4.4）、pull 与 apply 之间的裂缝（4.2）。

## 4. 设计

### 4.1 总览

```
cron（arkrog 用户，每日一次）
 └─ gamedata-sync.sh
     ├─ flock 独占（-n，不排队直接跳过）
     ├─ git fetch --depth=1 → FETCH_HEAD          ← 不动工作树
     ├─ 与「上次成功应用的 commit」比较 → 相同则 NOOP 退出
     ├─ 新主题闸门：比对两个 commit 的主题集合 → 有新主题则 GATE 退出（工作树仍未动）
     ├─ reset --hard FETCH_HEAD                    ← 落地工作树
     ├─ prod: yarn update-data:prod --yes          ← 全量七步
     ├─ dev : yarn update-data:prod --yes --skip-preview   ← 只刷 arkrog-dev 前缀缓存
     └─ 成功后写入状态文件（水位前进）
```

### 4.2 fetch 与 apply 分离，水位记「上次成功应用的 commit」

这是本设计最关键的两点，都源于同一个约束：**工作树必须与 Mongo 同代**。

**为什么不能先 pull 后判断**：`dataCacheManager` 的 `dumpdata:` 前缀只有 24 小时 TTL、`leveldata:` 3 天（[数据管线](data-pipeline.md) 第 2.2 节）。一旦工作树被更新却没重建，缓存过期后主服务会**自行**从磁盘读到新解包文件，形成「Mongo 里是旧关卡表、单关敌人数据却是新的」的半新半旧状态——而且没有任何报错。因此闸门必须在**落地工作树之前**判定，被拦时工作树一个字节都不能动。

**为什么水位不能用工作树 HEAD**：若用 `HEAD == FETCH_HEAD` 判断"是否需要重建"，则一旦 `reset` 成功而随后的重建失败，下一轮就会认定"无更新"而永不重试，故障静默固化。所以状态文件记的是**上次成功跑完重建的 commit**，与 `FETCH_HEAD` 比较；重建失败时状态不前进，下一轮自动重试（`reset` 幂等，重复执行无害）。

这与 arkrec 的 `Data.gamedata-refresh-state` 里 `maxMtimeMs` 水位是同一个思路，只是把"文件 mtime"换成了"commit sha"，把"存 Mongo"换成了"存文件"（脚本不该为了记一个 sha 去连 Mongo）。

**浅克隆注意**：该仓库是 `--depth=1` 浅克隆。用 `git fetch --depth=1` 保持体积（`levels/` 目录已 509MB），代价是嫁接点断开、`git merge --ff-only` 必定报 `refusing to merge unrelated histories`，只能用 `reset --hard FETCH_HEAD` 落地。它是纯上游镜像、无本地提交，该语义安全。成功落地后跑一次 `git gc --prune=now` 回收不可达对象。

### 4.3 新主题闸门：硬阻断，不自动放行

**新肉鸽主题一律不自动入库。** 理由不是保守，而是数据先于代码到达会直接打破前端：无藏侧主题选择器取 `topics` 的最后一项作默认主题，新主题一进库，首页默认就会跳到一个前端毫无适配的主题上（层数表、boss 数量表、类型码分组、面包屑分支全缺），首页残缺。新主题需要两仓十余处散点改动，清单见[无藏 new-topic-checklist](../app/modules/RelicFree/docs/new-topic-checklist.md) 与[计算器 new-topic-checklist](../app/modules/Tool/DamageCalculator/docs/new-topic-checklist.md)。

**判据不硬编码主题白名单**，而是比较"上次成功应用的 commit"与 `FETCH_HEAD` 两个版本的主题集合，取并集两处来源：

1. `zh_CN/gamedata/levels/obt/roguelike/` 下的目录名（`ro1`…`roN`）；
2. `roguelike_topic_table.json` 中形如 `"rogue_N"` 的顶层主题键（流式 grep，不解析整个 17MB JSON）——防止主题表先于关卡文件出现。

新版本比旧版本多出任一主题即命中闸门。这样做的好处是**自我维护**：人工完成适配并手动跑过一次更新后，状态水位前进到含新主题的 commit，下一轮比较自然不再命中，无需回头改脚本里的白名单。

命中闸门时：不动工作树、不重建、写一条 `GATE` 日志、以退出码 2 结束。后续由人工按两份 checklist 适配代码，再手动执行一次完整更新。

### 4.4 两遍执行：prod 与 dev 的 Redis 前缀

prod 与 dev 共用同一个 Mongo `arkrog` 库（机制见[部署与环境矩阵](deployment-env-matrix.md) 第 4 节），只靠 `REDIS_PREFIX` 隔离缓存。因此数据只需写一遍 Mongo，但**缓存要刷两个前缀**：

- prod（`/arkrog/prod/backend`）：`yarn update-data:prod --yes`，走完七步；
- dev（`/arkrog/dev/backend`）：`yarn update-data:prod --yes --skip-preview`，Mongo 已被上一遍写好，这遍只为清并预热 `arkrog-dev:*`；跳过 stage-preview 全量重算省一半时间。

> ⚠️ **两遍都必须用 `update-data:prod`（即 `NODE_ENV=production`）**。`REDIS_PREFIX=arkrog-dev` 只写在 dev 后端的 `.env.production` 里；用 `yarn update-data`（`NODE_ENV=development`）不会加载该文件，前缀回落成默认 `arkrog`，**清掉并预热的是生产缓存**。这条脚枪必须焊死在脚本里，不留人工选择余地。

### 4.5 并发与失败

- **`flock -n` 独占，不排队**：重建 2 分钟，排队只会在故障时堆积。已有实例在跑时直接记 `SKIP` 退出。
- **失败不回滚工作树**：Mongo 可能已被部分写入，回滚工作树并不能修复它，反而制造新的不一致。失败即记 `FAIL` 退出码 1，水位不前进，下一轮重试。
- **失败模式的兜底**：重启后端会清空除 `sess:` 外的全部 Redis 键并 `warmUpCache` 重建（见[部署与环境矩阵](deployment-env-matrix.md) 第 2.1 节），这是数据不一致时的最后手段。

### 4.6 可观测性：只落日志

本期不接任何通知渠道。日志行首统一为 `<ISO 时间> <状态>`，状态取 `OK` / `NOOP` / `SKIP` / `GATE` / `FAIL` 五者之一，便于 `grep`。日志写 `/arkrog/shared/logs/gamedata-sync.log`，配 logrotate（按周、留 8 份）。

退出码与状态一一对应：`0` = OK/NOOP/SKIP，`1` = FAIL，`2` = GATE。分开是为了将来接告警时能区分"坏了"与"需要人来做事"。

## 5. 脚本规格

**位置**：源码纳入版本控制放 `arkrog_backend/util-scripts/gamedata-sync.sh`（它包装的 `updateGameData.ts` 就在隔壁），部署时由 `/arkrog/bin/` 下的软链或拷贝指向它。不要只在服务器上裸放一个未受版本控制的脚本——arkrec 的 `~/.local/bin/gamedata-sync.sh` 就是这种状态，改动无迹可循。

**参数**：

| flag | 作用 |
|---|---|
| `--force` | 跳过水位比较，强制重建（仍受闸门约束）。对应手工修数据后的强制刷新 |
| `--dry-run` | 只做 fetch 与闸门判定，打印将要执行的动作后退出 |

**环境依赖**：cron 的 `PATH` 极简，`yarn` / `node` / `mongosh` 必须用绝对路径或在脚本头显式 `source` 登录环境；代理 `https_proxy=http://127.0.0.1:7890`（mihomo，服务器直连 GitHub 仅 23KB/s）。

**状态文件**：`/arkrog/shared/.gamedata-sync-state`，内容为上次成功应用的 commit sha。首次部署时以当前 `HEAD` 初始化。

## 6. cron 规格

```
# arkrog 用户 crontab
30 7 * * * /arkrog/bin/gamedata-sync.sh >> /arkrog/shared/logs/gamedata-sync.log 2>&1
```

**每日一次**。arkrog 对数据时效性要求不高，可接受一天延迟；无更新时脚本 30 秒结束，有更新时约 4.5 分钟。arkrec 用 `30 6,7,16,17`（每日四次）是因为它还跟外服多源、时效要求更紧，arkrog 不需要。

## 7. 本设计解决不了的

1. **用户侧仍最多等 24 小时**。`bundle` / `bundle-ext` 是 24 小时强缓存、`level/:levelId` 是一年强缓存，前端 `_get` 无 cache-busting（[数据管线](data-pipeline.md) 第 5 节）。自动化只是让服务端更勤快，反而会让"服务端已新、用户看到旧"的窗口更频繁出现。真正闭环需要数据版本端点 + 前端感知，那是独立议题（该缺口已在[数据管线](data-pipeline.md) 第 5 节登记）。
2. **新干员不会自动进伤害计算器**。`ACTIVE_CHARS` 白名单与 charImpl 实现都是人工，这是有意的设计（[干员实现 Cookbook](../app/modules/Tool/DamageCalculator/docs/04-char-impl-cookbook.md)）。自动同步只会让新干员出现在无藏侧（`character-basic` 无白名单）。
3. **岁时/年代/灵感等硬编码数值不走管线**。上游平衡性调整跑再多遍也不会变，仍需人工对照解包数据修改（[数据管线](data-pipeline.md) 第 6 节）。
4. **上游关卡数值变更依然无法触达老用户**。受一年强缓存影响，与本设计无关。

## 8. 实施 checklist

- [ ] 写 `arkrog_backend/util-scripts/gamedata-sync.sh`（含 `--force` / `--dry-run`）
- [ ] 部署到 `/arkrog/bin/`，初始化状态文件为当前 `HEAD`
- [ ] 装 `arkrog` 用户 crontab 与 logrotate
- [ ] 实测四条分支：NOOP（连跑两次）、OK（回退状态文件后重跑）、GATE（伪造一个 `ro7` 目录验证阻断且工作树未动）、FAIL（临时断开 Mongo）
- [ ] 把运维口径并入[数据管线](data-pipeline.md) 第 3 节，本文改标"已实施"并只保留设计取舍
- [ ] 在 [CONTRIBUTING](../CONTRIBUTING.md) 映射表登记"改同步脚本 → 同步本文"
