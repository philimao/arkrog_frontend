/**
 * 检测「空白过路点」（白圈黑点、没有文字标签的节点）。
 *
 * OCR 再准也识别不出不存在的文字，这类点必须真正在像素上找到。特征：直径明显
 * 小于普通节点图标，饱和度极低（纯灰白，不像其他节点带颜色）。
 */

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface BlankNodeBlob {
  cx: number;
  cy: number;
  w: number;
  h: number;
  area: number;
}

const BRIGHTNESS_THRESHOLD = 110;
const SATURATION_THRESHOLD = 30;

/**
 * @param canvas 压缩后的画布（必须与送去 OCR 的是同一张，否则坐标系对不上）
 * @param bounds 检测范围，一般取「已识别文字节点包围盒 + 余量」，天然排除顶部
 *   状态栏和底部工具栏的 UI 图标
 * @param medianCharWidth 这张图文字的中位数字宽，作为尺度单位 —— 不同截图分辨率
 *   差异很大，空白点的像素直径必须按本图自己的文字大小换算，不能用固定像素值
 */
export function detectBlankNodes(
  canvas: HTMLCanvasElement,
  bounds: Bounds,
  medianCharWidth: number,
): BlankNodeBlob[] {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  const width = canvas.width;
  const height = canvas.height;
  const x0 = Math.max(0, Math.floor(bounds.minX));
  const x1 = Math.min(width, Math.ceil(bounds.maxX));
  const y0 = Math.max(0, Math.floor(bounds.minY));
  const y1 = Math.min(height, Math.ceil(bounds.maxY));
  if (x1 <= x0 || y1 <= y0) return [];

  // 只取检测范围内的像素，避免整图 getImageData 的拷贝开销
  const roiW = x1 - x0;
  const roiH = y1 - y0;
  const { data } = ctx.getImageData(x0, y0, roiW, roiH);

  const minDiameter = medianCharWidth * 1.0;
  const maxDiameter = medianCharWidth * 3.2;

  const mask = new Uint8Array(roiW * roiH);
  for (let i = 0; i < roiW * roiH; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    mask[i] =
      luminance > BRIGHTNESS_THRESHOLD && saturation < SATURATION_THRESHOLD
        ? 1
        : 0;
  }

  const visited = new Uint8Array(roiW * roiH);
  const blobs: BlankNodeBlob[] = [];
  const stack: number[] = [];

  for (let start = 0; start < roiW * roiH; start++) {
    if (mask[start] !== 1 || visited[start]) continue;
    stack.length = 0;
    stack.push(start);
    visited[start] = 1;
    let minX = roiW;
    let maxX = 0;
    let minY = roiH;
    let maxY = 0;
    let count = 0;
    let sumX = 0;
    let sumY = 0;

    while (stack.length) {
      const idx = stack.pop()!;
      const cx = idx % roiW;
      const cy = (idx / roiW) | 0;
      count++;
      sumX += cx;
      sumY += cy;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;

      for (const n of [idx - 1, idx + 1, idx - roiW, idx + roiW]) {
        if (n < 0 || n >= roiW * roiH) continue;
        // 左右邻居要防止跨行绕回
        if (Math.abs((n % roiW) - cx) > 1) continue;
        if (mask[n] === 1 && !visited[n]) {
          visited[n] = 1;
          stack.push(n);
        }
      }
    }

    blobs.push({
      cx: x0 + sumX / count,
      cy: y0 + sumY / count,
      w: maxX - minX + 1,
      h: maxY - minY + 1,
      area: count,
    });
  }

  return blobs.filter((b) => {
    const diameter = Math.max(b.w, b.h);
    const aspect = b.w / b.h;
    const fillRatio = b.area / (b.w * b.h);
    return (
      diameter >= minDiameter &&
      diameter <= maxDiameter &&
      aspect > 0.6 &&
      aspect < 1.6 &&
      fillRatio > 0.25
    );
  });
}
