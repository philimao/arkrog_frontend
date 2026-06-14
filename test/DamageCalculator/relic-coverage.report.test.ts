/**
 * 藏品/通宝 计算覆盖分析（非回归测试，模块 10 自动验证流程的雏形）：
 * 跑真实 applyAnyRelics，输出每个藏品/通宝在各乘区的实际 buff 量，判定哪些「契合当前计算器」
 * （能算出非零乘区值）哪些不能。结果写入 reports/coverage-<topic>.json（已 gitignore，数据版本相关）。
 *
 * 依赖上游解包仓库：从环境变量 DATA_PATH 读取 ArknightsGameData 根目录（与后端 update-data 同一约定）。
 * 仅在显式 opt-in（RELIC_COVERAGE=1）且数据存在时运行——常规 `yarn test` 始终跳过，不污染回归套件。
 *   RELIC_COVERAGE=1 DATA_PATH=D:/repo/ArknightsGameData npx vitest run test/DamageCalculator/relic-coverage.report.test.ts --pool=threads
 * 注意：必须用 --pool=threads（默认 forks 池会因 debugRelic 日志/IPC 崩溃）。
 */
import fs from "node:fs";
import path from "node:path";
import { test, expect } from "vitest";
import { applyAnyRelics } from "~/modules/Tool/DamageCalculator/calculator/debug/print-relics-info";
import type { ExpressionGroupNode } from "~/modules/Tool/DamageCalculator/calculator/ast";

const DATA_PATH = process.env.DATA_PATH || "D:/repo/ArknightsGameData";
const TABLE = path.join(DATA_PATH, "zh_CN/gamedata/excel/roguelike_topic_table.json");
const RUN = process.env.RELIC_COVERAGE === "1" && fs.existsSync(TABLE);

// 技力相关键（用户要求本轮排除）
const SP_KEYS = new Set(["sp", "sp_recovery_per_sec"]);
const SP_VALUESTR = /modify_sp|hit_to_add_sp|sp_recover|chargeSP|sp_recovery_up/i;
function isSpOnly(relic: any): boolean {
  const buffs = relic.buffs || [];
  let sawSp = false;
  for (const b of buffs) {
    for (const x of b.blackboard || []) {
      if (SP_KEYS.has(x.key) || (x.valueStr && SP_VALUESTR.test(x.valueStr))) sawSp = true;
    }
  }
  // 仅当含 sp 且不含其它战斗数值键时算“纯技力”
  const COMBAT = new Set(["atk", "max_hp", "def", "attack_speed", "magic_resistance", "atk_scale", "damage_scale", "damage_resistance", "evade_physical", "evade_magical", "multiplier@atk", "multiplier@def", "multiplier@max_hp", "enemy_atk", "enemy_def", "enemy_max_hp"]);
  const hasOtherCombat = buffs.some((b: any) => (b.blackboard || []).some((x: any) => COMBAT.has(x.key)));
  return sawSp && !hasOtherCombat;
}

/** 收集某藏品在 context 各乘区里以 tooltip=relic.name 留下的非零贡献 */
function contributionsOf(context: any, name: string): Array<{ zone: string; key: string; value: number }> {
  const out: Array<{ zone: string; key: string; value: number }> = [];
  for (const [zone, zoneVal] of Object.entries(context)) {
    if (Array.isArray(zoneVal)) continue; // invalidRelics
    if (!zoneVal || typeof zoneVal !== "object") continue;
    for (const [key, node] of Object.entries(zoneVal as Record<string, ExpressionGroupNode>)) {
      if (!node || typeof (node as any).children === "undefined") continue;
      for (const child of (node as any).children) {
        if (child.tooltip === name) {
          const v = child.calculate();
          if (v) out.push({ zone, key, value: v });
        }
      }
    }
  }
  return out;
}

test.skipIf(!RUN)("relic & copper coverage scan", () => {
  // 压制 debugRelic 的海量 console 输出（否则冲爆 vitest IPC 通道）
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.warn = noop;
  console.group = noop;
  console.groupCollapsed = noop;
  console.groupEnd = noop;
  console.table = noop;

  const table = JSON.parse(fs.readFileSync(TABLE, "utf8"));
  const reportDir = path.resolve("test/DamageCalculator/reports");
  fs.mkdirSync(reportDir, { recursive: true });
  const summary: any[] = [];

  for (const tp of Object.keys(table.details)) {
    const relics = table.details[tp].relics || {};
    const items = table.details[tp].items || {};
    const list: any[] = [];
    for (const [id, it] of Object.entries<any>(items)) {
      if (it.type === "RELIC" && relics[id]) list.push({ ...it, ...relics[id], _kind: "relic", layer: 1 });
    }
    for (const r of Object.values<any>(relics)) {
      if (r.id.includes("copper")) list.push({ ...(items[r.id] || {}), ...r, _kind: "copper", layer: 1 });
    }

    const fits: any[] = [];
    const noFit: any[] = [];
    const seen = new Set<string>();
    for (const r of list) {
      if (seen.has(r.name)) continue;
      seen.add(r.name);
      let contribs: Array<{ zone: string; key: string; value: number }> = [];
      try {
        const ctx = applyAnyRelics([r] as any);
        contribs = contributionsOf(ctx, r.name);
      } catch {
        /* 个别藏品 apply 抛错（缺字段），按不契合处理 */
      }
      const rec = {
        id: r.id, name: r.name, kind: r._kind,
        usage: (r.usage || "").replace(/\\n/g, " ").slice(0, 80),
        contributions: contribs,
        spOnly: isSpOnly(r),
      };
      (contribs.length ? fits : noFit).push(rec);
    }
    // 候选 = 不契合 且 非纯技力 且 有 buffs
    const candidates = noFit.filter((r) => !r.spOnly);
    summary.push({ topic: tp, total: seen.size, fits: fits.length, noFit: noFit.length, candidatesNonSp: candidates.length });
    fs.writeFileSync(path.join(reportDir, `coverage-${tp}.json`), JSON.stringify({ fits, noFit, candidates }, null, 2), "utf8");
  }

  fs.writeFileSync(path.join(reportDir, "coverage-summary.json"), JSON.stringify(summary, null, 2), "utf8");
  // 打印摘要
  // eslint-disable-next-line no-console
  console.log("COVERAGE_SUMMARY", JSON.stringify(summary));
  expect(summary.length).toBeGreaterThan(0);
});
