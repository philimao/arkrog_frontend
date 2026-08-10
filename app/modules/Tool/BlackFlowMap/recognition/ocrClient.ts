/**
 * 调后端 OCR 代理。
 *
 * 后端只做签名转发，不接收 zone —— 层数由前端从识别结果里的层名自行判定。
 * 后端内部会在「多账号 × 多接口」的策略链上自动降级，前端对用了哪条策略无感，
 * 只在 DEV 面板里展示一下便于排查。
 */
import type { OcrItem } from "./types";

export class OcrRequestError extends Error {
  constructor(
    message: string,
    /** HTTP 状态码，429 = 限流或额度耗尽，502 = 上游异常 */
    public readonly status: number,
    /**
     * 后端所有免费额度均已用尽（本月）。跟普通限流的区别是：等一分钟没用，
     * 得等到下个月，所以 UI 上要说清楚，别让用户反复重试。
     */
    public readonly exhausted = false,
  ) {
    super(message);
    this.name = "OcrRequestError";
  }
}

/** 本次识别实际使用的策略，仅用于诊断展示 */
export interface OcrStrategyInfo {
  account: string;
  action: string;
}

export interface OcrResult {
  items: OcrItem[];
  strategy?: OcrStrategyInfo;
}

interface OcrResponseBody {
  code: number;
  message?: string;
  exhausted?: boolean;
  data?: { items?: OcrItem[]; strategy?: OcrStrategyInfo };
}

export async function requestOcr(blob: Blob): Promise<OcrResult> {
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string)?.trim() || "";

  let response: Response;
  try {
    response = await fetch(`${apiBase}/map-recognition/ocr`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/octet-stream" },
      body: blob,
    });
  } catch {
    throw new OcrRequestError("网络异常，请检查网络后重试", 0);
  }

  let json: OcrResponseBody | null = null;
  try {
    json = (await response.json()) as OcrResponseBody;
  } catch {
    // 保持 json 为 null，走下面的兜底文案
  }

  if (!response.ok || !json || json.code !== 0) {
    throw new OcrRequestError(
      json?.message || `识别失败（${response.status}）`,
      response.status,
      json?.exhausted === true,
    );
  }
  return { items: json.data?.items ?? [], strategy: json.data?.strategy };
}
