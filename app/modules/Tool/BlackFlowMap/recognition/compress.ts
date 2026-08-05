/**
 * 截图压缩。
 *
 * 实测（82 张真实样张）：长边缩到 1600px + JPEG q85，节点检出与原图完全持平，
 * 而上传体积从最大 8.78MB 降到 ~165KB。这一步同时管住了上行带宽、后端内存
 * 和云 OCR 的 10MB 入参限制。
 */

/** 长边上限，实测 1280 会偶发丢节点，1600 起持平 */
export const MAX_EDGE = 1600;
export const JPEG_QUALITY = 0.85;

export interface CompressedScreenshot {
  /** 上传给后端代理的 JPEG */
  blob: Blob;
  /**
   * 压缩后的画布，供空白过路点检测复用 —— 必须与送去 OCR 的是同一张图，
   * 否则 OCR 返回的坐标跟画布对不上。
   */
  canvas: HTMLCanvasElement;
}

export async function compressScreenshot(
  file: File,
  maxEdge: number = MAX_EDGE,
  quality: number = JPEG_QUALITY,
): Promise<CompressedScreenshot> {
  // createImageBitmap 会按 EXIF 方向解码，省得手动处理手机截图的旋转
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("无法创建画布上下文");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) throw new Error("图片编码失败");

    return { blob, canvas };
  } finally {
    bitmap.close();
  }
}
