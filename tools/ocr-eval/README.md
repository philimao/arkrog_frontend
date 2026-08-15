# OCR 引擎评测脚手架

换 OCR 引擎时用来回答一个问题：**端到端的基底识别准确率会变成多少。**

不是单测，是基准测量：需要一批带 ground truth 的真实截图，**数据不在仓库里**（82 张
截图约 119MB）。数据缺席时两个 `.test.ts` 自动 skip，所以它们留在默认测试集里也不会
把 `pnpm test` 弄红。

## 为什么必须走产品代码

准确率差异出在**跑完整条识别管线之后**，不是 OCR 文本本身。所以评测直接调
`recognition/recognize.ts` 的 `inferFromItems`（纯函数：items + 画布 → 结论），
与线上同一条代码路径。复制一份推理逻辑来对照，测出来的就不是线上的行为了。

`rgba/*.bin` 是压缩后那张 JPEG 解码出的原始像素，等价于浏览器 canvas 的
`getImageData` —— 空白过路点检测要靠它，且**必须与送去 OCR 的是同一张图**。

## 跑法

样张文件名自带答案（`zone4_c_2.png` → `zone_4` / 基底 `4c`）。

```bash
# 1. 压缩到与生产同参（长边 1600 + q85）→ 跑本地 OCR → 产出 items 与像素
#    默认读 D:\repo\arkrog\tmp\samples，可用 OCR_EVAL_SAMPLES 覆盖
uv run --with rapidocr --with onnxruntime --with pillow tools/ocr-eval/prep_and_ocr.py

# 2. 端到端准确率（层数 / 基底 Top-1 / Top-2 / 分档）
pnpm vitest run tools/ocr-eval/local-ocr.test.ts

# 3. 灰度对照的接线验证（不需要网络）
pnpm vitest run tools/ocr-eval/shadow-wiring.test.ts
```

产物默认落在 `tmp/ocr-eval-data/`，可用 `OCR_EVAL_DIR` 覆盖。

## 基线

| 引擎                             | 层数  | 基底 Top-1 | Top-2 |
| -------------------------------- | ----- | ---------- | ----- |
| 腾讯云 GeneralBasicOCR           | 100%  | 96.3%      | 100%  |
| 本地 RapidOCR / PP-OCRv6_small   | 100%  | **97.6%**  | 100%  |

两者判错的样张都落在「低」可信度档且正确答案排第 2 —— 换引擎不破坏
「不会自信地给出错误答案」这条性质。详见
[ADR-0003](../../app/modules/Tool/BlackFlowMap/docs/adr/0003-self-hosted-local-ocr.md)。
