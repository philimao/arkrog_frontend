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
- **不自动上架新肉鸽主题**——新主题的数据不入库，但**同批上游更新里的其余内容（新干员、既有主题的新藏品与关卡改动）照常入库**（第 4.3 节）。

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

arkrec 没有、而 arkrog 必须解决的三件事，构成本设计的主要内容：新主题的**选择性排除**（4.3）、prod/dev 两遍执行（4.4）、重建失败留下的不一致窗口（4.2）。

## 4. 设计

### 4.1 总览

```
cron（arkrog 用户，每日一次）
 └─ gamedata-sync.sh
     ├─ flock 独占（-n，不排队直接跳过）
     ├─ git fetch --depth=1 → FETCH_HEAD          ← 不动工作树
     ├─ 与「上次成功应用的 commit」比较 → 相同则 NOOP 退出
     ├─ reset --hard FETCH_HEAD                    ← 落地工作树
     ├─ prod: yarn update-data:prod --yes          ← 全量七步
     │        └─ buildGameData 按白名单跳过未支持主题，其余照常入库
     ├─ dev : yarn update-data:prod --yes --skip-preview   ← 只刷 arkrog-dev 前缀缓存
     ├─ 输出里出现「跳过未支持主题」→ 补记一条 NEWTOPIC 日志（不影响成败）
     └─ 成功后写入状态文件（水位前进）
```

**脚本不做任何阻断**：上游更新一律照常应用，新主题的排除发生在更深一层的 `buildGameData` 里（第 4.3 节）。

### 4.2 水位记「上次成功应用的 commit」，不是工作树 HEAD

若用 `HEAD == FETCH_HEAD` 判断"是否需要重建"，则一旦 `reset` 成功而随后的重建失败，下一轮就会认定"无更新"而**永不重试**，故障静默固化。所以状态文件记的是**上次成功跑完重建的 commit**，与 `FETCH_HEAD` 比较；重建失败时水位不前进，下一轮自动重试（`reset` 幂等，重复执行无害）。

**重建失败会留下一个真实的不一致窗口，必须正视**：工作树在重建之前就已 `reset` 到新版本，而重建的第 2 步又会主动清掉 `dumpdata:`/`leveldata:` 缓存。若重建在第 3 步及以后失败，主服务会按需从**新**解包文件重新填充这两类缓存，而 Mongo 的 `GameData` 仍是旧的或半写状态——形成「Mongo 旧关卡表 + 新单关敌人数据」，且没有任何报错。缓解两条：失败后**立即原地重试一次**（最常见诱因是 Mongo/Redis 瞬时抖动，可重试）；仍失败则记 `FAIL`，靠次日重试与人工兜底（第 4.5 节）。

**仍然 fetch 与 apply 分离**（而非直接 `git pull`）：水位比较与 `--dry-run` 都需要"先知道远端是什么、再决定动不动工作树"，`NOOP` 轮次（绝大多数）因此完全不碰工作树。

这与 arkrec 的 `Data.gamedata-refresh-state` 里 `maxMtimeMs` 水位是同一个思路，只是把"文件 mtime"换成了"commit sha"，把"存 Mongo"换成了"存文件"（脚本不该为了记一个 sha 去连 Mongo）。

**浅克隆注意**：该仓库是 `--depth=1` 浅克隆。用 `git fetch --depth=1` 保持体积（`levels/` 目录已 509MB），代价是嫁接点断开、`git merge --ff-only` 必定报 `refusing to merge unrelated histories`，只能用 `reset --hard FETCH_HEAD` 落地。它是纯上游镜像、无本地提交，该语义安全。成功落地后跑一次 `git gc --prune=now` 回收不可达对象。

### 4.3 新主题：只排除主题本身，不阻断整批更新

**约束**：上游一次更新往往同时包含新肉鸽主题、新干员、既有主题的新藏品与关卡调整（2026-08-11 那次就同时带来 4 名新干员）。因此**不能因为出现新主题就阻断整批更新**——那会把本可安全入库的新干员等内容一起卡住，并随每次上游更新不断累积。

**但新主题本身不能自动入库**：无藏侧主题选择器取 `topics` 的最后一项作默认主题，新主题一进库，首页默认就跳到一个前端毫无适配的主题上（层数表、boss 数量表、类型码分组、面包屑分支全缺），首页残缺。新主题需要两仓十余处散点改动，清单见[无藏 new-topic-checklist](../app/modules/RelicFree/docs/new-topic-checklist.md) 与[计算器 new-topic-checklist](../app/modules/Tool/DamageCalculator/docs/new-topic-checklist.md)。

**做法：在 `buildGameData` 里按主题白名单裁剪**，而不是在同步脚本里拦截。`arkrog_backend/utils/gamedata/buildGameData.js` 的 `buildGameData` 把 `topics`/`zones`/`stages`/`traps`/`relics`/`items` 六份文档全部产自同一个遍历 `roguelike_topic_table` 的 `topics` 的循环，循环结束后整体 `$set` 写入。因此只要在循环顶部对不在白名单内的主题 `continue` 并打一条告警，就能得到下表的行为：

| 数据 | 上游出现新主题时 |
|---|---|
| `topics`/`zones`/`stages`/`traps`/`relics`/`items` | 新主题的键**不出现**（整体 `$set`，不是"旧值残留"），前端根本看不到它 |
| `character-basic` | **不受影响，新干员照常入库**——它在该循环之外，与主题无关 |
| `Data.stage-enemies` / `Data.stage-preview` | 自动跟随：这两步遍历的是刚写好的 `stages`，新主题不在其中 |
| 既有主题的新藏品 / 关卡改动 / 敌人数值 | 照常入库 |

**白名单放版本控制，不放 `.env`**：建议作为常量放后端 `utils/gamedata/shared.js`（命名如 `SUPPORTED_ROGUE_TOPICS`）。`ACTIVE_CHARS` 放 env 是因为干员上架只依赖后端裁剪；而新主题上架依赖**前端**十余处散点改动，把开关放进版本控制，才能让"翻开关"与"适配代码"落在同一次提交里。

> ⚠️ **该常量是 load-bearing 的**：六份文档整体 `$set` 写入，从白名单里删掉一个已上线主题 = 下次跑管线时该主题**直接从生产库消失**。只增不减。

**上线顺序**：前端适配先部署，再翻后端常量并跑管线。反过来会短暂出现"数据已到、前端未适配"的窗口，正是本节要避免的状态。

**可见性**：`buildGameData` 跳过主题时打印告警，同步脚本 grep 到该行就在日志补记一条 `NEWTOPIC <主题>`，不影响退出码。这样白名单只有一处，脚本无需自己判定主题集合，人工适配完成后也不需要回头改脚本。

### 4.4 两遍执行：prod 与 dev 的 Redis 前缀

prod 与 dev 共用同一个 Mongo `arkrog` 库（机制见[部署与环境矩阵](deployment-env-matrix.md) 第 4 节），只靠 `REDIS_PREFIX` 隔离缓存。因此数据只需写一遍 Mongo，但**缓存要刷两个前缀**：

- prod（`/arkrog/prod/backend`）：`yarn update-data:prod --yes`，走完七步；
- dev（`/arkrog/dev/backend`）：`yarn update-data:prod --yes --skip-preview`，Mongo 已被上一遍写好，这遍只为清并预热 `arkrog-dev:*`；跳过 stage-preview 全量重算省一半时间。

> ⚠️ **两遍都必须用 `update-data:prod`（即 `NODE_ENV=production`）**。`REDIS_PREFIX=arkrog-dev` 只写在 dev 后端的 `.env.production` 里；用 `yarn update-data`（`NODE_ENV=development`）不会加载该文件，前缀回落成默认 `arkrog`，**清掉并预热的是生产缓存**。这条脚枪必须焊死在脚本里，不留人工选择余地。

### 4.5 并发与失败

- **`flock -n` 独占，不排队**：重建 2 分钟，排队只会在故障时堆积。已有实例在跑时直接记 `SKIP` 退出。
- **失败先原地重试一次**，仍失败才记 `FAIL`（理由与残留窗口见第 4.2 节）。
- **失败不回滚工作树**：Mongo 可能已被部分写入，回滚工作树并不能修复它，反而制造新的不一致。`FAIL` 时水位不前进，下一轮自动重试。
- **失败模式的兜底**：重启后端会清空除 `sess:` 外的全部 Redis 键并 `warmUpCache` 重建（见[部署与环境矩阵](deployment-env-matrix.md) 第 2.1 节），这是数据不一致时的最后手段。

### 4.6 可观测性：只落日志

本期不接任何通知渠道。日志行首统一为 `<ISO 时间> <状态>`，状态取 `OK` / `NOOP` / `SKIP` / `FAIL` 四者之一，便于 `grep`；另有一条附加行 `NEWTOPIC <主题>`，跟在 `OK` 之后（更新本身成功，只是有一个主题被排除、等人适配）。日志写 `/arkrog/shared/logs/gamedata-sync.log`，配 logrotate（按周、留 8 份）。

退出码：`0` = OK/NOOP/SKIP（含带 `NEWTOPIC` 的成功），`1` = FAIL。将来接告警时两类都要通知，但语义不同：`FAIL` 是"坏了"，`NEWTOPIC` 是"需要人来做事"。

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

- [ ] **先做**：给 `buildGameData` 加 `SUPPORTED_ROGUE_TOPICS` 白名单裁剪与跳过告警（第 4.3 节），补单测；这一步独立于 cron，落地后手动跑管线也立即受益
- [ ] 写 `arkrog_backend/util-scripts/gamedata-sync.sh`（含 `--force` / `--dry-run`）
- [ ] 部署到 `/arkrog/bin/`，初始化状态文件为当前 `HEAD`
- [ ] 装 `arkrog` 用户 crontab 与 logrotate
- [ ] 实测四条分支：NOOP（连跑两次）、OK（回退状态文件后重跑）、NEWTOPIC（临时从白名单里摘掉 `rogue_6` 验证：六份文档不含 ro6、`character-basic` 人数不变、日志有 NEWTOPIC；**验完立即恢复并重跑**）、FAIL（临时断开 Mongo，验证重试一次后记 FAIL 且水位未前进）
- [ ] 把运维口径并入[数据管线](data-pipeline.md) 第 3 节，并改写其第 6 节「新增肉鸽主题」一行（届时后端动作不再是"自动入库 topics"，而是"翻白名单常量"），本文改标"已实施"并只保留设计取舍
- [ ] 在 [CONTRIBUTING](../CONTRIBUTING.md) 映射表登记"改同步脚本 → 同步本文"
