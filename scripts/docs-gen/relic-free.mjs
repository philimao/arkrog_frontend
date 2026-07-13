/**
 * relic-free.mjs — 无藏收录清单文档生成器
 *
 * 从源码提取三份清单，写入 app/modules/RelicFree/docs/generated/：
 *   1. api-endpoints.md      — 无藏域 _get/_post/_delete 端点-调用点对照表
 *   2. stage-filter-rules.md — navOfZone 关卡筛选规则表（含 numOfMinorBoss/excludeIds 快照）
 *   3. hardcode-snapshot.md  — 版本敏感字面量快照（topicMaxLevels/StageLevels/EnemyAvatar preset/rogueKey 推导点）
 *
 * 运行：yarn docs:gen（全量）或 yarn docs:gen:relic-free（仅本模块）。
 * 提取规则见 scripts/docs-gen/lib.mjs 头注释。
 */

import path from "node:path";
import { statSync } from "node:fs";
import {
  ROOT,
  cmp,
  docHeader,
  extractBalancedBlock,
  findBalancedEnd,
  mdTable,
  parseArrayEntries,
  parseObjectEntriesExt,
  read,
  splitCodeAndComment,
  walkFiles,
  writeDoc,
} from "./lib.mjs";

// ---------------------------------------------------------------------------
// 路径
// ---------------------------------------------------------------------------

const MODULE_DIR = "app/modules/RelicFree";
const OUT_DIR = path.join(ROOT, MODULE_DIR, "docs", "generated");

const SRC = {
  stageSelector: "app/utils/stageSelector.ts",
  constant: "app/types/constant.ts",
  gameData: "app/types/gameData.ts",
  enemyAvatar: "app/components/Character/Enemy/EnemyAvatar.tsx",
  appDir: "app",
};

// ---------------------------------------------------------------------------
// 通用小工具
// ---------------------------------------------------------------------------

/** rel 可为文件或目录；返回其中全部 .ts/.tsx 文件的仓库相对路径（正斜杠，确定性排序） */
function listSourceFiles(rel) {
  const abs = path.join(ROOT, rel);
  if (statSync(abs).isFile()) return [rel];
  return walkFiles(abs, [".ts", ".tsx"]).map((f) => `${rel}/${f}`);
}

/** 去掉行首 // 注释行后拼回全文（多行调用的提取仍需整文正则，故不能逐行匹配） */
function stripLineComments(src) {
  return src
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");
}

/** 折叠空白，用于把多行源码摘录压成单行表格单元 */
function collapseWs(code) {
  return code.replace(/\s+/g, " ").trim();
}

/** 行内代码单元：摘录本身含反引号（模板字面量）时改用双反引号包裹，避免破坏 Markdown */
function mdCode(text) {
  return text.includes("`") ? `\`\` ${text} \`\`` : `\`${text}\``;
}

// ---------------------------------------------------------------------------
// ① api-endpoints.md
// ---------------------------------------------------------------------------

/** 扫描范围与"所属页面"标注（Home/Favorite 属个人中心，经裁决纳入本表并标注归属） */
const API_SCAN_TARGETS = [
  { rel: "app/modules/RelicFree", page: "无藏收录关卡页（RelicFree）" },
  { rel: "app/modules/RecordDisplay", page: "记录展示/举报弹窗（RecordDisplay，被关卡页/首页/收藏页复用）" },
  { rel: "app/modules/IndexPage/IndexRelicFree", page: "首页无藏收录区块（IndexRelicFree）" },
  { rel: "app/components/RecordCard", page: "记录卡片组件（RecordCard，被关卡页/首页/收藏页复用）" },
  { rel: "app/stores/relicFreeStore.ts", page: "无藏数据 store（relicFreeStore，全局）" },
  { rel: "app/stores/appDataStore.ts", page: "应用数据 store（appDataStore，全局）" },
  { rel: "app/modules/Home/Favorite", page: "个人中心·收藏页（Home/Favorite，跨模块消费方）" },
];

/** 提取调用：方法 + 可选泛型（支持一层嵌套尖括号）+ 端点字符串字面量；\s 含换行，可跨行 */
const CALL_RE = /(?<![\w$.])_(get|post|delete)\s*(?:<((?:[^<>]|<[^<>]*>)*)>)?\s*\(\s*"([^"]+)"/g;
/** 只锚定"像调用"的形态（方法名后跟泛型/左括号），用于与提取数比对、发现动态端点漏提 */
const ANCHOR_RE = /(?<![\w$.])_(get|post|delete)\s*(?:<(?:[^<>]|<[^<>]*>)*>)?\s*\(/g;

function genApiEndpoints() {
  const rows = [];
  let callTotal = 0;
  for (const target of API_SCAN_TARGETS) {
    for (const file of listSourceFiles(target.rel)) {
      const src = stripLineComments(read(file));
      const calls = [...src.matchAll(CALL_RE)];
      // ANCHOR_RE 天然排除 import 语句（标识符后随逗号/右花括号，不匹配 \(），此处仅比对数量
      const anchors = [...src.matchAll(ANCHOR_RE)];
      if (anchors.length > calls.length) {
        console.warn(
          `[docs-gen] 警告：${file} 中有 ${anchors.length - calls.length} 处 _get/_post/_delete 调用未能提取端点字符串字面量（动态拼接或异形写法），未收录进 api-endpoints.md`,
        );
      }
      for (const m of calls) {
        callTotal++;
        rows.push({
          endpoint: m[3],
          method: m[1].toUpperCase(),
          type: m[2] ? collapseWs(m[2]) : "",
          file,
          page: target.page,
        });
      }
    }
  }
  if (callTotal === 0) throw new Error("提取失败：扫描范围内未找到任何 _get/_post/_delete 端点调用");

  rows.sort((a, b) => cmp(a.endpoint, b.endpoint) || cmp(a.file, b.file) || cmp(a.method, b.method));
  const uniqueEndpoints = [...new Set(rows.map((r) => r.endpoint))];

  const parts = [docHeader(API_SCAN_TARGETS.map((t) => (t.rel.endsWith(".ts") ? t.rel : `${t.rel}/`)))];
  parts.push("# 无藏域 API 端点对照表");
  parts.push("");
  parts.push(
    "本清单由 `scripts/docs-gen.mjs` 从下列扫描范围内 `_get/_post/_delete`（app/utils/tools.ts 导出）的**静态字符串字面量**调用提取，按端点排序；行首被 `//` 注释掉的调用不计入，动态拼接的端点无法提取（提取遗漏会在生成时告警）。端点路径相对 `VITE_API_BASE_URL`。各端点的后端实现、缓存行为与数据链路见 [06-data-pipeline.md](../06-data-pipeline.md)，记录读写契约见 [02-record-lifecycle-and-schema.md](../02-record-lifecycle-and-schema.md)。",
  );
  parts.push("");
  parts.push(
    mdTable(
      ["端点", "方法", "响应类型", "调用文件", "所属页面"],
      rows.map((r) => [`\`${r.endpoint}\``, r.method, r.type ? `\`${r.type}\`` : "（未指定泛型）", r.file, r.page]),
    ),
  );
  parts.push("");
  parts.push(`**共 ${callTotal} 处调用、${uniqueEndpoints.length} 个去重端点。**`);
  return { file: writeDoc(OUT_DIR, "api-endpoints.md", parts.join("\n")), callTotal, endpointCount: uniqueEndpoints.length };
}

// ---------------------------------------------------------------------------
// ② stage-filter-rules.md
// ---------------------------------------------------------------------------

/** 各筛选器"语义一句话"。新增筛选器时在此补一行，否则产物中语义为占位并触发警告。 */
const NAV_PURPOSES = {
  boss: "大 Boss 关：仅收作战段为 b 且编号大于该主题 numOfMinorBoss（前三层小 Boss 关计数）的关卡，剔除 excludeIds，并借调用方传入的数组按 stage.name 去重（同名只收一次）",
  6: "普通作战（作战段 n）第六层；源码注释注明洞天福地是 7 层，其第 7 层归入本组",
  5: "普通作战（作战段 n）第五层",
  4: "普通作战（作战段 n）第四层",
  zone_sky_1: "是非境：作战段为 sv 且 id 末段不是 dlc1",
  zone_sky_2: "今昔境：作战段为 sv 且 id 末段是 dlc1（DLC1 新增分境）",
  others: "特殊关卡：作战段为 ev/t（不期而遇）、duel（狭路）、dv（分明）",
};

/** 把 navOfZone 数组块拆成顶层对象条目的原始源码片段 */
function splitTopLevelObjects(block) {
  const chunks = [];
  let i = 0;
  while (i < block.length) {
    const open = block.indexOf("{", i);
    if (open === -1) break;
    const close = findBalancedEnd(block, open, "{", "}");
    if (close === -1) throw new Error("提取失败：navOfZone 条目花括号不配对");
    chunks.push(block.slice(open, close + 1));
    i = close + 1;
  }
  return chunks;
}

/** 从条目源码中提取 filter 属性的箭头函数原样源码（参数括号 + => + 函数体括号配对） */
function extractFilterSource(entrySrc) {
  const anchor = entrySrc.match(/filter\s*:/);
  if (!anchor) throw new Error("提取失败：navOfZone 条目缺少 filter 属性");
  const parenStart = entrySrc.indexOf("(", anchor.index + anchor[0].length);
  if (parenStart === -1) throw new Error("提取失败：filter 缺少参数括号");
  const parenEnd = findBalancedEnd(entrySrc, parenStart, "(", ")");
  const braceStart = entrySrc.indexOf("{", parenEnd);
  if (braceStart === -1) throw new Error("提取失败：filter 缺少函数体（非块体箭头函数需扩展脚本）");
  const braceEnd = findBalancedEnd(entrySrc, braceStart, "{", "}");
  if (parenEnd === -1 || braceEnd === -1) throw new Error("提取失败：filter 括号不配对");
  return entrySrc.slice(parenStart, braceEnd + 1);
}

/** 摘录再缩进：去掉源码原有的公共缩进，保持代码块整洁 */
function dedent(code) {
  const lines = code.split("\n");
  const indents = lines.slice(1).filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return [lines[0], ...lines.slice(1).map((l) => l.slice(Math.min(min, l.match(/^\s*/)[0].length)))].join("\n");
}

function parseNavOfZone(src) {
  const block = extractBalancedBlock(src, /export const navOfZone[^=]*=/, "[", "]", "navOfZone");
  const entries = splitTopLevelObjects(block).map((chunk) => {
    const id = chunk.match(/id\s*:\s*"([^"]+)"/);
    const name = chunk.match(/name\s*:\s*"([^"]+)"/);
    if (!id || !name) throw new Error("提取失败：navOfZone 条目缺少 id 或 name");
    return { id: id[1], name: name[1], filterSrc: dedent(extractFilterSource(chunk)) };
  });
  if (entries.length === 0) throw new Error("提取失败：navOfZone 为空");
  return entries;
}

function parseNumOfMinorBoss(src) {
  const entries = parseObjectEntriesExt(
    extractBalancedBlock(src, /export const numOfMinorBoss[^=]*=/, "{", "}", "numOfMinorBoss"),
  ).filter((e) => e.numeric);
  if (entries.length === 0) throw new Error("提取失败：numOfMinorBoss 为空（数值解析失败？）");
  return entries;
}

function parseExcludeIds(src) {
  // excludeIds 在 boss filter 函数体内，是 const 局部量
  const { entries } = parseArrayEntries(extractBalancedBlock(src, /const excludeIds[^=]*=/, "[", "]", "excludeIds"));
  return entries;
}

function genStageFilterRules() {
  const src = read(SRC.stageSelector);
  const navEntries = parseNavOfZone(src);
  const numOfMinorBoss = parseNumOfMinorBoss(src);
  const excludeIds = parseExcludeIds(src);

  const purposeOf = (id) => {
    const p = NAV_PURPOSES[id];
    if (!p)
      console.warn(`[docs-gen] 警告：navOfZone 筛选器 ${id} 未在 NAV_PURPOSES 中登记语义，请在 scripts/docs-gen/relic-free.mjs 中补充`);
    return p || "（脚本未登记语义，请在 scripts/docs-gen/relic-free.mjs 的 NAV_PURPOSES 中补充）";
  };

  const parts = [docHeader([SRC.stageSelector])];
  parts.push("# 无藏关卡筛选规则表（navOfZone）");
  parts.push("");
  parts.push(
    "本清单由 `scripts/docs-gen.mjs` 从 `app/utils/stageSelector.ts` 的 `navOfZone` 数组提取，按源码出现顺序排列（即页面导航顺序）。filter 判定的输入是 stage id 按 `_` 分段后的各段，id 语法与分段语义见 [03-stage-taxonomy-and-selector.md](../03-stage-taxonomy-and-selector.md)。",
  );
  parts.push("");
  parts.push(
    "> ⚠️ `boss` 组的 filter 是**双参签名** `(stage, array)`，并对传入数组执行 `array.push(stage.name)` **副作用**做按名去重——调用方必须在一次遍历中对该组复用同一数组；其余组均为单参纯函数。给 boss 组每次调用传新数组会使去重失效。",
  );
  parts.push("");
  parts.push("## 总览");
  parts.push("");
  parts.push(mdTable(["id", "名称", "语义"], navEntries.map((e) => [`\`${e.id}\``, e.name, purposeOf(e.id)])));
  parts.push("");
  parts.push("## 各筛选器源码摘录");
  parts.push("");
  for (const e of navEntries) {
    parts.push(`### ${e.name}（\`${e.id}\`）`);
    parts.push("");
    parts.push(purposeOf(e.id) + "。");
    parts.push("");
    parts.push("```ts");
    parts.push(e.filterSrc);
    parts.push("```");
    parts.push("");
  }
  parts.push("## numOfMinorBoss 快照");
  parts.push("");
  parts.push(
    "各主题前三层小 Boss 关计数（源码注释：三层boss关数量，异格记为同一个）。`boss` 组只收编号**大于**该值的关卡。**版本敏感**：新主题上线必须补行，且与后端同值表保持一致，见 [version-sensitive-hardcode.md](../version-sensitive-hardcode.md) 与 [new-topic-checklist.md](../new-topic-checklist.md)。",
  );
  parts.push("");
  parts.push(mdTable(["主题", "小 Boss 编号上限", "源码行内注释"], numOfMinorBoss.map((e) => [`\`${e.key}\``, e.value, e.comment])));
  parts.push("");
  parts.push(`共 ${numOfMinorBoss.length} 个主题。缺项时 filter 以 99 兜底（新主题大 Boss 关全部不显示，静默失败）。`);
  parts.push("");
  parts.push("## excludeIds 快照");
  parts.push("");
  parts.push("`boss` 组显式剔除的关卡 id（硬编码于 filter 函数体内）。");
  parts.push("");
  parts.push(mdTable(["关卡 id", "源码行内注释"], excludeIds.map((e) => [`\`${e.value}\``, e.comment])));
  parts.push("");
  parts.push(`共 ${excludeIds.length} 项。`);
  return {
    file: writeDoc(OUT_DIR, "stage-filter-rules.md", parts.join("\n")),
    navCount: navEntries.length,
    minorBossCount: numOfMinorBoss.length,
    excludeCount: excludeIds.length,
  };
}

// ---------------------------------------------------------------------------
// ③ hardcode-snapshot.md
// ---------------------------------------------------------------------------

/** 解析 RogueTopic 枚举（const enum RogueTopic { ROGUE_1 = "rogue_1", … }）为成员名→字符串值映射 */
function parseRogueTopicEnum(src) {
  const block = extractBalancedBlock(src, /export const enum RogueTopic\b/, "{", "}", "RogueTopic 枚举");
  const map = {};
  for (const m of block.matchAll(/([A-Za-z_$][\w$]*)\s*=\s*"([^"]+)"/g)) map[m[1]] = m[2];
  if (Object.keys(map).length === 0) throw new Error("提取失败：RogueTopic 枚举为空");
  return map;
}

/** 解析 topicMaxLevels（[RogueTopic.ROGUE_1]: "N18" 计算键），键经 RogueTopic 枚举解析为 rogue_N */
function parseTopicMaxLevels(constantSrc, rogueTopicMap) {
  const entries = parseObjectEntriesExt(
    extractBalancedBlock(constantSrc, /export const topicMaxLevels[^=]*=/, "{", "}", "topicMaxLevels"),
  );
  if (entries.length === 0) throw new Error("提取失败：topicMaxLevels 为空");
  return entries.map((e) => {
    if (e.computedKey) {
      const member = e.computedKey.replace(/^RogueTopic\./, "");
      const resolved = rogueTopicMap[member];
      if (!resolved) console.warn(`[docs-gen] 警告：topicMaxLevels 计算键 ${e.computedKey} 无法在 RogueTopic 枚举中解析`);
      return { key: resolved || e.computedKey, source: e.computedKey, value: e.value, comment: e.comment };
    }
    return { key: e.key, source: e.key, value: e.value, comment: e.comment };
  });
}

/** 提取 EnemyAvatar 的 preset 分组：敌人名数组 + 对应 reduce 内的 URL 拼接规则源码 */
function parseEnemyAvatarPresets(src) {
  const groups = [];
  const anchors = [];
  const first = src.match(/const preset\s*=/);
  if (!first) throw new Error("提取失败：EnemyAvatar.tsx 中未找到 const preset");
  anchors.push(first.index + first[0].length);
  for (const m of src.matchAll(/Object\.assign\(\s*preset\s*,/g)) anchors.push(m.index + m[0].length);
  for (const from of anchors) {
    const open = src.indexOf("[", from);
    if (open === -1) throw new Error("提取失败：preset 分组缺少名单数组");
    const close = findBalancedEnd(src, open, "[", "]");
    if (close === -1) throw new Error("提取失败：preset 名单数组括号不配对");
    const { entries } = parseArrayEntries(src.slice(open + 1, close));
    // reduce 回调体内的 acc[name] 赋值即 URL 规则
    const tail = src.slice(close, close + 600);
    const rule = tail.match(/acc\[name\]\s*=\s*([^;]+);/);
    groups.push({ names: entries.map((e) => e.value), rule: rule ? collapseWs(rule[1]) : "（未识别到 acc[name] 赋值）" });
    if (!rule) console.warn("[docs-gen] 警告：EnemyAvatar preset 某分组未识别到 acc[name] 赋值，URL 规则缺失");
  }
  if (groups.length === 0 || groups.every((g) => g.names.length === 0)) throw new Error("提取失败：EnemyAvatar preset 为空");
  return groups;
}

/** 解析 enemyNameTransform（中文标识符键: "字符串值"） */
function parseEnemyNameTransform(src) {
  const entries = parseObjectEntriesExt(
    extractBalancedBlock(src, /const enemyNameTransform[^=]*=/, "{", "}", "enemyNameTransform"),
  ).filter((e) => !e.numeric);
  if (entries.length === 0) throw new Error("提取失败：enemyNameTransform 为空");
  return entries;
}

/** 全 app/ 枚举 rogueKey 推导点：两种写法逐行正则（跳过行首注释行，取行内代码部分） */
const ROGUE_KEY_PATTERNS = [
  { label: '`"rogue_" + ….slice(-1)`（ro10 击穿，见上方警示）', re: /"rogue_"\s*\+\s*[^;\n]*?\.slice\(\s*-\s*1\s*\)/ },
  { label: '`.replace("ro", "rogue_")`（对 ro10 安全）', re: /\.replace\(\s*["']ro["']\s*,\s*["']rogue_["']\s*\)/ },
];

function scanRogueKeyDerivations() {
  const hits = [];
  for (const file of listSourceFiles(SRC.appDir)) {
    const lines = read(file).split("\n");
    for (const rawLine of lines) {
      if (rawLine.trim().startsWith("//")) continue;
      const [code] = splitCodeAndComment(rawLine);
      ROGUE_KEY_PATTERNS.forEach((p, patternIdx) => {
        if (p.re.test(code)) hits.push({ patternIdx, file, snippet: collapseWs(code) });
      });
    }
  }
  if (hits.length === 0) throw new Error("提取失败：app/ 下未找到任何 rogueKey 推导点（正则可能已失配）");
  // listSourceFiles 已按文件名确定性排序、行序即源码顺序；这里只按写法分组稳定排序
  hits.sort((a, b) => a.patternIdx - b.patternIdx || cmp(a.file, b.file));
  return hits;
}

function genHardcodeSnapshot() {
  const constantSrc = read(SRC.constant);
  const gameDataSrc = read(SRC.gameData);
  const selectorSrc = read(SRC.stageSelector);
  const avatarSrc = read(SRC.enemyAvatar);

  const rogueTopicMap = parseRogueTopicEnum(gameDataSrc);
  const topicMaxLevels = parseTopicMaxLevels(constantSrc, rogueTopicMap);
  const { entries: stageLevels } = parseArrayEntries(
    extractBalancedBlock(constantSrc, /export const StageLevels[^=]*=/, "[", "]", "StageLevels"),
  );
  if (stageLevels.length === 0) throw new Error("提取失败：StageLevels 为空");
  const numOfMinorBoss = parseNumOfMinorBoss(selectorSrc);
  const excludeIds = parseExcludeIds(selectorSrc);
  const presetGroups = parseEnemyAvatarPresets(avatarSrc);
  const nameTransform = parseEnemyNameTransform(avatarSrc);
  const rogueKeyHits = scanRogueKeyDerivations();

  const parts = [
    docHeader([SRC.constant, SRC.gameData, SRC.stageSelector, SRC.enemyAvatar, `${SRC.appDir}/（rogueKey 推导点全量扫描）`]),
  ];
  parts.push("# 无藏版本敏感字面量快照");
  parts.push("");
  parts.push(
    "本清单由 `scripts/docs-gen.mjs` 从上列源码提取，是新主题上线/上游数据变更时的**对账基准**——每项为何敏感、漏改后果与更新流程见 [version-sensitive-hardcode.md](../version-sensitive-hardcode.md)，散点改动清单见 [new-topic-checklist.md](../new-topic-checklist.md)。",
  );
  parts.push("");

  parts.push("## topicMaxLevels（app/types/constant.ts）");
  parts.push("");
  parts.push("各肉鸽主题最高难度等级。键为 `[RogueTopic.…]` 计算键，已按 `app/types/gameData.ts` 的 `RogueTopic` 枚举解析。");
  parts.push("");
  parts.push(
    mdTable(
      ["主题 key", "源码键", "最高难度", "源码行内注释"],
      topicMaxLevels.map((e) => [`\`${e.key}\``, `\`[${e.source}]\``, e.value, e.comment]),
    ),
  );
  parts.push("");
  parts.push(`共 ${topicMaxLevels.length} 个主题。`);
  parts.push("");

  parts.push("## StageLevels（app/types/constant.ts）");
  parts.push("");
  parts.push("可用的关卡难度等级。");
  parts.push("");
  parts.push(mdTable(["难度", "源码行内注释"], stageLevels.map((e) => [`\`${e.value}\``, e.comment])));
  parts.push("");
  parts.push(`共 ${stageLevels.length} 项。`);
  parts.push("");

  parts.push("## numOfMinorBoss（app/utils/stageSelector.ts）");
  parts.push("");
  parts.push(
    "各主题小 Boss 编号上限，与 [stage-filter-rules.md](stage-filter-rules.md) 的快照同源；后端存在同值表，改动必须跨仓库同步。",
  );
  parts.push("");
  parts.push(mdTable(["主题", "小 Boss 编号上限", "源码行内注释"], numOfMinorBoss.map((e) => [`\`${e.key}\``, e.value, e.comment])));
  parts.push("");

  parts.push("## excludeIds（app/utils/stageSelector.ts，boss filter 内）");
  parts.push("");
  parts.push(mdTable(["关卡 id", "源码行内注释"], excludeIds.map((e) => [`\`${e.value}\``, e.comment])));
  parts.push("");

  parts.push("## EnemyAvatar preset 名单（app/components/Character/Enemy/EnemyAvatar.tsx）");
  parts.push("");
  parts.push(
    "头像不走默认 prts.wiki 命名规则、需要专门素材的敌人名单。命中名单走对应 URL 规则，未命中回落默认规则；加载失败回落占位图（外链依赖）。",
  );
  parts.push("");
  parts.push(
    mdTable(
      ["分组", "敌人名", "URL 规则（源码摘录）"],
      presetGroups.map((g, i) => [`组 ${i + 1}`, g.names.map((n) => `\`${n}\``).join("，"), mdCode(g.rule)]),
    ),
  );
  parts.push("");
  parts.push(`共 ${presetGroups.length} 组、${presetGroups.reduce((n, g) => n + g.names.length, 0)} 个敌人。`);
  parts.push("");

  parts.push("## enemyNameTransform（EnemyAvatar.tsx）");
  parts.push("");
  parts.push("查询名 → 实际素材名的改写表（上游素材命名与游戏内敌人名不一致时在此登记）。");
  parts.push("");
  parts.push(mdTable(["查询名", "实际素材名", "源码行内注释"], nameTransform.map((e) => [e.key, e.value, e.comment])));
  parts.push("");
  parts.push(`共 ${nameTransform.length} 项。`);
  parts.push("");

  parts.push("## rogueKey 推导点全量枚举（全 app/ 正则扫描）");
  parts.push("");
  parts.push("从 stage id 首段（`ro{n}`）推导 `rogue_{n}` 主题 key 的散点，现存两种写法并存。**处数以本表为准**，手写正文不登记具体数字。");
  parts.push("");
  parts.push(
    "> ⚠️ `\"rogue_\" + ….slice(-1)` 只取最后一个字符：主题编号到两位数（ro10）时会产出 `rogue_0`，静默错键；`.replace(\"ro\", \"rogue_\")` 写法不受影响。收敛建议见 [version-sensitive-hardcode.md](../version-sensitive-hardcode.md)。",
  );
  parts.push("");
  parts.push(
    mdTable(
      ["写法", "文件", "源码摘录"],
      rogueKeyHits.map((h) => [ROGUE_KEY_PATTERNS[h.patternIdx].label, h.file, mdCode(h.snippet)]),
    ),
  );
  parts.push("");
  const byPattern = ROGUE_KEY_PATTERNS.map((p, i) => `${rogueKeyHits.filter((h) => h.patternIdx === i).length} 处`);
  parts.push(`**共 ${rogueKeyHits.length} 处（slice(-1) 写法 ${byPattern[0]}，replace 写法 ${byPattern[1]}）。**`);

  return {
    file: writeDoc(OUT_DIR, "hardcode-snapshot.md", parts.join("\n")),
    topicMaxLevels: topicMaxLevels.length,
    stageLevels: stageLevels.length,
    minorBoss: numOfMinorBoss.length,
    excludeIds: excludeIds.length,
    presetNames: presetGroups.reduce((n, g) => n + g.names.length, 0),
    nameTransform: nameTransform.length,
    rogueKeyHits: rogueKeyHits.length,
  };
}

// ---------------------------------------------------------------------------
// 模块入口
// ---------------------------------------------------------------------------

export function runRelicFree() {
  const r1 = genApiEndpoints();
  const r2 = genStageFilterRules();
  const r3 = genHardcodeSnapshot();
  console.log("[docs-gen] 生成完成：");
  console.log(`  ${path.relative(ROOT, r1.file)}  （端点调用 ${r1.callTotal} 处，去重端点 ${r1.endpointCount} 个）`);
  console.log(`  ${path.relative(ROOT, r2.file)}  （筛选器 ${r2.navCount} 组，numOfMinorBoss ${r2.minorBossCount} 项，excludeIds ${r2.excludeCount} 项）`);
  console.log(
    `  ${path.relative(ROOT, r3.file)}  （topicMaxLevels ${r3.topicMaxLevels} 项，StageLevels ${r3.stageLevels} 项，preset 敌人 ${r3.presetNames} 个，nameTransform ${r3.nameTransform} 项，rogueKey 推导点 ${r3.rogueKeyHits} 处）`,
  );
}
