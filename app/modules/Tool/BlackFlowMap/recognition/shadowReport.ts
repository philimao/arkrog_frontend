/**
 * 灰度对照上报。
 *
 * 云端与本地 OCR 的差别，光看文本框看不出来 —— 真正要比的是跑完整条识别管线
 * 之后的**结论**（层数、基底、可信度档位）。所以对照在前端算，只把结论差异报给
 * 后端聚合。不上传图片，也不带用户标识。
 *
 * 灰度结束后后端不再下发 `shadow`，这条上报自然就不会发生。
 */

export interface ShadowReport {
  zone: { cloud: string; local: string };
  mapId: { cloud: string; local: string };
  tone: { cloud: string; local: string };
  /** 云端选中的基底，是否出现在本地的 Top-2 候选里 */
  cloudInLocalTop2: boolean;
  localInCloudTop2: boolean;
  /** 纯推理耗时（ms），两边同口径，均不含网络 */
  ms: { cloud: number; local: number };
  /** OCR 检出的文本段数 */
  items: { cloud: number; local: number };
}

export async function postShadowReport(report: ShadowReport): Promise<void> {
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string)?.trim() || "";
  try {
    await fetch(`${apiBase}/map-recognition/shadow-report`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      // 上报失败无所谓，别让它拖住页面
      keepalive: true,
    });
  } catch {
    // 静默：这是观测数据，丢了就丢了
  }
}
