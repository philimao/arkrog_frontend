/**
 * 本地 OCR 引擎的端到端评测（临时脚手架，不属于产品代码）。
 *
 * 直接调产品代码里的 `inferFromItems`（纯函数：items + 画布 → 结论），走的是
 * 与线上完全相同的 detectZone / vocab / fitAxis / blankNodes / matchCandidates，
 * 因此准确率与线上同口径，可直接对比文档里的云端基线：
 * 层数 82/82、基底 79/82(96.3%)、Top-2 82/82。
 *
 * 数据来自 scratchpad/localocr：
 *   ocr-local.json  本地 OCR 产出的 {t,x,y,w,h}
 *   rgba/<name>.bin 与之对应的那张 JPEG 解码后的像素（等价于浏览器 canvas）
 *
 * 数据缺席时自动 skip，所以它待在默认测试集里也不会把 `pnpm test` 弄红。
 * 跑法见同目录 README.md
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";


const DATA_DIR =
  process.env.OCR_EVAL_DIR ?? path.join(process.cwd(), "tmp/ocr-eval-data");
const hasData = existsSync(path.join(DATA_DIR, "ocr-local.json"));

interface OcrItem {
  t: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Sample {
  w: number;
  h: number;
  ms: number;
  items: OcrItem[];
}

import { inferFromItems } from "../../app/modules/Tool/BlackFlowMap/recognition/recognize";

/** 最小 canvas 替身：detectBlankNodes 只用到 width/height/getImageData */
function makeCanvas(w: number, h: number, rgba: Buffer) {
  return {
    width: w,
    height: h,
    getContext: () => ({
      getImageData: (x: number, y: number, rw: number, rh: number) => {
        const data = new Uint8ClampedArray(rw * rh * 4);
        for (let row = 0; row < rh; row++) {
          const src = ((y + row) * w + x) * 4;
          data.set(rgba.subarray(src, src + rw * 4), row * rw * 4);
        }
        return { data, width: rw, height: rh };
      },
    }),
  } as unknown as HTMLCanvasElement;
}

/** zone4_c_2 → { zone: "zone_4", mapId: "4c" } */
function groundTruth(name: string): { zone: string; mapId: string } | null {
  const m = name.match(/^zone(\d)_([a-z])(?:_\d+)?$/);
  return m ? { zone: `zone_${m[1]}`, mapId: `${m[1]}${m[2]}` } : null;
}

const pct = (n: number, d: number) => `${((n / d) * 100).toFixed(1)}%`;

it.skipIf(!hasData)("本地 OCR 端到端评测", async () => {
  const samples: Record<string, Sample> = JSON.parse(
    readFileSync(path.join(DATA_DIR, "ocr-local.json"), "utf-8"),
  );
  const zones = JSON.parse(
    readFileSync(path.join(DATA_DIR, "zones.json"), "utf-8"),
  );

  const rows: {
    name: string;
    truth: { zone: string; mapId: string };
    zoneOk: boolean;
    top1Ok: boolean;
    top2Ok: boolean;
    tone: string;
    got: string;
    top2: string[];
    labels: number;
    blanks: number;
    error?: string;
  }[] = [];

  for (const [name, sample] of Object.entries(samples)) {
    const truth = groundTruth(name);
    if (!truth) continue;

    const canvas = makeCanvas(
      sample.w,
      sample.h,
      readFileSync(path.join(DATA_DIR, "rgba", `${name}.bin`)),
    );

    try {
      const r = inferFromItems(sample.items, canvas, zones);
      const top2 = r.topCandidates.map((c) => c.mapId);
      rows.push({
        name,
        truth,
        zoneOk: r.zone === truth.zone,
        top1Ok: r.mapId === truth.mapId,
        top2Ok: top2.includes(truth.mapId),
        tone: r.confidence.tone,
        got: r.mapId,
        top2,
        labels: r.stats.labels,
        blanks: r.stats.blanks,
      });
    } catch (err) {
      rows.push({
        name,
        truth,
        zoneOk: false,
        top1Ok: false,
        top2Ok: false,
        tone: "error",
        got: "-",
        top2: [],
        labels: 0,
        blanks: 0,
        error: (err as Error).name,
      });
    }
  }

  const n = rows.length;
  const zoneOk = rows.filter((r) => r.zoneOk).length;
  const top1 = rows.filter((r) => r.top1Ok).length;
  const top2 = rows.filter((r) => r.top2Ok).length;

  const lines: string[] = [];
  lines.push("");
  lines.push("══════════ 本地 OCR（RapidOCR / PP-OCR mobile ONNX）端到端 ══════════");
  lines.push(`样张数        ${n}`);
  lines.push(`层数识别      ${zoneOk}/${n}  ${pct(zoneOk, n)}    云端基线 82/82 100%`);
  lines.push(`基底 Top-1    ${top1}/${n}  ${pct(top1, n)}    云端基线 79/82 96.3%`);
  lines.push(`基底 Top-2    ${top2}/${n}  ${pct(top2, n)}    云端基线 82/82 100%`);
  lines.push(
    `平均检出      ${(rows.reduce((s, r) => s + r.labels, 0) / n).toFixed(1)} 文字节点 + ` +
      `${(rows.reduce((s, r) => s + r.blanks, 0) / n).toFixed(1)} 空白点`,
  );
  lines.push("");
  lines.push("分档（档位 → 张数 / Top-1 正确率）：");
  for (const tone of ["high", "medium", "low", "none", "error"]) {
    const g = rows.filter((r) => r.tone === tone);
    if (!g.length) continue;
    const ok = g.filter((r) => r.top1Ok).length;
    lines.push(
      `  ${tone.padEnd(7)} ${String(g.length).padStart(3)} 张   ${ok}/${g.length}  ${pct(ok, g.length)}`,
    );
  }

  const misses = rows.filter((r) => !r.top1Ok || !r.zoneOk);
  if (misses.length) {
    lines.push("");
    lines.push("判错明细：");
    for (const m of misses) {
      lines.push(
        `  ${m.name.padEnd(14)} 真值 ${m.truth.zone}/${m.truth.mapId}` +
          `  →  ${m.error ? `❌ ${m.error}` : `${m.got}`}` +
          `  [${m.tone}]  Top2=${m.top2.join(",") || "-"}` +
          `  ${m.zoneOk ? "" : "⚠层数也错"}`,
      );
    }
  }
  lines.push("═".repeat(68));
  console.log(lines.join("\n"));

  expect(n).toBeGreaterThan(0);
});
