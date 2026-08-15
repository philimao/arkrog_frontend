/**
 * 灰度对照的接线验证（临时脚手架）。
 *
 * 只 mock 掉两个浏览器依赖（压缩、调后端）与上报的出口，走真实的 recognizeMap，
 * 确认：① 后端下发 shadow 时确实用同一张画布推了第二遍并上报；② 上报内容正确；
 * ③ 影子那侧炸了也不会影响主结果。
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, expect, it, vi } from "vitest";

const DATA_DIR =
  process.env.OCR_EVAL_DIR ?? path.join(process.cwd(), "tmp/ocr-eval-data");
const hasData = existsSync(path.join(DATA_DIR, "ocr-local.json"));

const samples = hasData
  ? (JSON.parse(
      readFileSync(path.join(DATA_DIR, "ocr-local.json"), "utf-8"),
    ) as Record<string, { w: number; h: number; items: unknown[] }>)
  : {};
const zones = hasData
  ? JSON.parse(readFileSync(path.join(DATA_DIR, "zones.json"), "utf-8"))
  : [];

function canvasOf(name: string) {
  const s = samples[name];
  const rgba = readFileSync(path.join(DATA_DIR, "rgba", `${name}.bin`));
  return {
    width: s.w,
    height: s.h,
    getContext: () => ({
      getImageData: (x: number, y: number, rw: number, rh: number) => {
        const data = new Uint8ClampedArray(rw * rh * 4);
        for (let row = 0; row < rh; row++) {
          const src = ((y + row) * s.w + x) * 4;
          data.set(rgba.subarray(src, src + rw * 4), row * rw * 4);
        }
        return { data, width: rw, height: rh };
      },
    }),
  } as unknown as HTMLCanvasElement;
}

let ocrResponse: Record<string, unknown> = {};
let canvas: HTMLCanvasElement;

vi.mock("../../app/modules/Tool/BlackFlowMap/recognition/compress", () => ({
  MAX_EDGE: 1600,
  JPEG_QUALITY: 0.85,
  compressScreenshot: async () => ({ blob: null, canvas }),
}));
vi.mock("../../app/modules/Tool/BlackFlowMap/recognition/ocrClient", () => ({
  requestOcr: async () => ocrResponse,
  OcrRequestError: class extends Error {},
}));
vi.mock("../../app/modules/Tool/BlackFlowMap/recognition/shadowReport", () => ({
  postShadowReport: vi.fn(async () => {}),
}));

const { recognizeMap } = await import(
  "../../app/modules/Tool/BlackFlowMap/recognition/recognize"
);
const { postShadowReport } = await import(
  "../../app/modules/Tool/BlackFlowMap/recognition/shadowReport"
);
const reported = vi.mocked(postShadowReport);

beforeEach(() => reported.mockClear());

it.skipIf(!hasData)("两边 items 相同 → 上报结论全一致", async () => {
  canvas = canvasOf("zone3_a");
  ocrResponse = {
    items: samples["zone3_a"].items,
    strategy: { account: "1", action: "GeneralFastOCR" },
    ms: 900,
    shadow: { items: samples["zone3_a"].items, ms: 1700, action: "PP-OCRv6_small" },
  };

  const r = await recognizeMap({} as File, zones);
  expect(reported).toHaveBeenCalledOnce();
  const p = reported.mock.calls[0][0];
  console.log("  上报内容:", JSON.stringify(p));

  expect(p.zone.cloud).toBe(p.zone.local);
  expect(p.mapId.cloud).toBe(p.mapId.local);
  expect(p.tone.cloud).toBe(p.tone.local);
  expect(p.cloudInLocalTop2).toBe(true);
  expect(p.ms).toEqual({ cloud: 900, local: 1700 });
  // 主结果不受影子影响
  expect(r.mapId).toBe(p.mapId.cloud);
  expect(r.strategy?.action).toBe("GeneralFastOCR");
});

it.skipIf(!hasData)("影子 items 来自另一张图 → 如实报出不一致，主结果不受影响", async () => {
  canvas = canvasOf("zone3_a");
  ocrResponse = {
    items: samples["zone3_a"].items,
    strategy: { account: "1", action: "GeneralFastOCR" },
    ms: 900,
    shadow: { items: samples["zone5_c"].items, ms: 1700, action: "PP-OCRv6_small" },
  };

  const r = await recognizeMap({} as File, zones);
  const p = reported.mock.calls[0][0];
  console.log("  上报内容:", JSON.stringify(p));
  expect(p.zone.cloud).not.toBe(p.zone.local);
  expect(r.zone).toBe(p.zone.cloud);
});

it.skipIf(!hasData)("影子推理抛错 → 记为 ERR，主结果照常返回", async () => {
  canvas = canvasOf("zone3_a");
  ocrResponse = {
    items: samples["zone3_a"].items,
    strategy: { account: "1", action: "GeneralFastOCR" },
    ms: 900,
    // 全是无法匹配词表的噪声 → inferFromItems 会抛 NoNodeDetected/ZoneUndetected
    shadow: { items: [{ t: "zzz", x: 1, y: 1, w: 10, h: 10 }], ms: 5, action: "x" },
  };

  const r = await recognizeMap({} as File, zones);
  const p = reported.mock.calls[0][0];
  console.log("  上报内容:", JSON.stringify(p));
  expect(p.mapId.local).toMatch(/^ERR:/);
  expect(r.mapId).toBeTruthy();
});

it.skipIf(!hasData)("后端没下发 shadow（灰度关闭）→ 完全不上报", async () => {
  canvas = canvasOf("zone3_a");
  ocrResponse = {
    items: samples["zone3_a"].items,
    strategy: { account: "1", action: "GeneralFastOCR" },
    ms: 900,
  };
  await recognizeMap({} as File, zones);
  expect(reported).not.toHaveBeenCalled();
});
