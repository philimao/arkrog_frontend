/**
 * 调后端 OCR 代理。
 *
 * 后端只做签名转发，不接收 zone —— 层数由前端从识别结果里的层名自行判定。
 */
import type { OcrItem } from "./types";

export class OcrRequestError extends Error {
  constructor(
    message: string,
    /** HTTP 状态码，429 = 限流，502 = 上游异常 */
    public readonly status: number,
  ) {
    super(message);
    this.name = "OcrRequestError";
  }
}

interface OcrResponseBody {
  code: number;
  message?: string;
  data?: { items?: OcrItem[] };
}

export async function requestOcr(blob: Blob): Promise<OcrItem[]> {
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
    );
  }
  return json.data?.items ?? [];
}
