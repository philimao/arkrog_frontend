import type {
  MatchAlgorithm,
  MatchResultPayload,
  MatchStep,
  ScaleScoreEntry,
  TemplateScore,
} from "./types";
import jsfeat from "jsfeat";

interface StartMessage {
  type: "start";
  imageBuffer: ArrayBuffer;
  imageMimeType: string;
  sceneImageData?: {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  } | null;
  templateAssets: Array<{
    templateName: string;
    templateUrl: string;
    templateBuffer: ArrayBuffer;
    templateMimeType: string;
  }>;
  algorithms: MatchAlgorithm[];
}

interface ProgressMessage {
  type: "progress";
  step: MatchStep;
  message: string;
  current: number;
  total: number;
}

interface DoneMessage {
  type: "done";
  payload: MatchResultPayload;
}

interface ErrorMessage {
  type: "error";
  message: string;
}

const MAX_SCENE_WIDTH = 720;
const SCALE_FIXED_MIN = 0.35;
const SCALE_FIXED_MAX = 0.65;
const COARSE_SCALE_MIN = 0.3;
const COARSE_SCALE_MAX = 0.7;
const SCALE_COARSE_STEP = 0.1;
const SCALE_REFINE_STEP = 0.02;
const SCALE_REFINE_RADIUS = 0.1;
const SCALE_REFERENCE_SCENE_HEIGHT = 720;
const SCALE_OPTIMAL_SCORE_THRESHOLD = 0.9;
const SCALE_TURNING_EPSILON = 1e-6;
const CHAMFER_EDGE_THRESHOLD = 42;
const CHAMFER_POINT_LIMIT = 260;
const INF_DISTANCE = 1e9;
const ALPHA_MASK_THRESHOLD = 24;
const GAUSSIAN_PASSES = 1;
const ROI_Y_MIN_RATIO = 0.05;
const ROI_Y_MAX_RATIO = 0.85;
const NMS_IOU_THRESHOLD = 0.45;

const ALGORITHM_DATA_SELECTORS: Record<
  Extract<MatchAlgorithm, "ncc" | "edge-ncc">,
  (
    scene: { gray: Float32Array; edge: Float32Array },
    template: { gray: Float32Array; edge: Float32Array },
  ) => {
    sceneData: Float32Array;
    templateData: Float32Array;
  }
> = {
  ncc: (scene, template) => ({
    sceneData: scene.gray,
    templateData: template.gray,
  }),
  "edge-ncc": (scene, template) => ({
    sceneData: scene.edge,
    templateData: template.edge,
  }),
};

const JSFEAT_U8C1 = jsfeat.U8_t | jsfeat.C1_t;

function postProgress(
  step: MatchStep,
  message: string,
  current: number,
  total: number,
) {
  const payload: ProgressMessage = {
    type: "progress",
    step,
    message,
    current,
    total,
  };
  self.postMessage(payload);
}

async function loadBitmapFromBuffer(buffer: ArrayBuffer, mimeType: string) {
  const blob = new Blob([buffer], { type: mimeType || "image/png" });
  return createImageBitmap(blob);
}

function bitmapToGray(bitmap: ImageBitmap) {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("无法创建离屏 Canvas 上下文");
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const gray = new Float32Array(bitmap.width * bitmap.height);
  const alpha = new Uint8Array(bitmap.width * bitmap.height);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    alpha[p] = data[i + 3];
  }
  return { gray, alpha, width: bitmap.width, height: bitmap.height };
}

function imageDataToGray(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const gray = new Float32Array(width * height);
  const alpha = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < imageData.length; i += 4, p += 1) {
    gray[p] =
      imageData[i] * 0.299 +
      imageData[i + 1] * 0.587 +
      imageData[i + 2] * 0.114;
    alpha[p] = imageData[i + 3];
  }
  return { gray, alpha, width, height };
}

function resizeGray(
  source: Float32Array,
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
) {
  const dst = new Float32Array(dstWidth * dstHeight);
  const xRatio = srcWidth / dstWidth;
  const yRatio = srcHeight / dstHeight;
  for (let y = 0; y < dstHeight; y += 1) {
    const srcY = Math.min(srcHeight - 1, Math.floor((y + 0.5) * yRatio));
    for (let x = 0; x < dstWidth; x += 1) {
      const srcX = Math.min(srcWidth - 1, Math.floor((x + 0.5) * xRatio));
      dst[y * dstWidth + x] = source[srcY * srcWidth + srcX];
    }
  }
  return dst;
}

function resizeMask(
  source: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
) {
  const dst = new Uint8Array(dstWidth * dstHeight);
  const xRatio = srcWidth / dstWidth;
  const yRatio = srcHeight / dstHeight;
  for (let y = 0; y < dstHeight; y += 1) {
    const srcY = Math.min(srcHeight - 1, Math.floor((y + 0.5) * yRatio));
    for (let x = 0; x < dstWidth; x += 1) {
      const srcX = Math.min(srcWidth - 1, Math.floor((x + 0.5) * xRatio));
      dst[y * dstWidth + x] = source[srcY * srcWidth + srcX];
    }
  }
  return dst;
}

function alphaToMask(alpha: Uint8Array, threshold = ALPHA_MASK_THRESHOLD) {
  const mask = new Uint8Array(alpha.length);
  for (let i = 0; i < alpha.length; i += 1) {
    mask[i] = alpha[i] >= threshold ? 1 : 0;
  }
  return mask;
}

function gaussianBlurPass(source: Float32Array, width: number, height: number) {
  const tmp = new Float32Array(source.length);
  const dst = new Float32Array(source.length);

  const kernel = [1, 4, 6, 4, 1];
  const norm = 16;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let acc = 0;
      for (let k = -2; k <= 2; k += 1) {
        const sx = Math.min(width - 1, Math.max(0, x + k));
        acc += source[y * width + sx] * kernel[k + 2];
      }
      tmp[y * width + x] = acc / norm;
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let acc = 0;
      for (let k = -2; k <= 2; k += 1) {
        const sy = Math.min(height - 1, Math.max(0, y + k));
        acc += tmp[sy * width + x] * kernel[k + 2];
      }
      dst[y * width + x] = acc / norm;
    }
  }
  return dst;
}

function gaussianBlur(
  source: Float32Array,
  width: number,
  height: number,
  passes = GAUSSIAN_PASSES,
) {
  let current = source;
  for (let i = 0; i < passes; i += 1) {
    current = gaussianBlurPass(current, width, height);
  }
  return current;
}

function resizeSceneIfNeeded(
  gray: Float32Array,
  width: number,
  height: number,
) {
  if (width <= MAX_SCENE_WIDTH) {
    return { gray, width, height };
  }
  const ratio = MAX_SCENE_WIDTH / width;
  const dstWidth = MAX_SCENE_WIDTH;
  const dstHeight = Math.max(1, Math.round(height * ratio));
  return {
    gray: resizeGray(gray, width, height, dstWidth, dstHeight),
    width: dstWidth,
    height: dstHeight,
  };
}

function floatGrayToU8(gray: Float32Array) {
  const output = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i += 1) {
    const value = Math.round(gray[i]);
    output[i] = Math.max(0, Math.min(255, value));
  }
  return output;
}

function jsfeatMatrixToFloatGray(matrix: { data: Uint8Array }) {
  const output = new Float32Array(matrix.data.length);
  for (let i = 0; i < matrix.data.length; i += 1) {
    output[i] = matrix.data[i];
  }
  return output;
}

function buildEdgeMap(gray: Float32Array, width: number, height: number) {
  const edge = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const p00 = gray[i - width - 1];
      const p01 = gray[i - width];
      const p02 = gray[i - width + 1];
      const p10 = gray[i - 1];
      const p12 = gray[i + 1];
      const p20 = gray[i + width - 1];
      const p21 = gray[i + width];
      const p22 = gray[i + width + 1];
      const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
      const gy = p00 + 2 * p01 + p02 - p20 - 2 * p21 - p22;
      edge[i] = Math.min(255, Math.hypot(gx, gy));
    }
  }
  return edge;
}

function buildBinaryEdge(
  edge: Float32Array,
  threshold = CHAMFER_EDGE_THRESHOLD,
  mask?: Uint8Array,
) {
  const binary = new Uint8Array(edge.length);
  for (let i = 0; i < edge.length; i += 1) {
    const allowed = mask ? mask[i] > 0 : true;
    binary[i] = allowed && edge[i] >= threshold ? 1 : 0;
  }
  return binary;
}

function distanceTransform(
  binaryEdge: Uint8Array,
  width: number,
  height: number,
) {
  const dist = new Float32Array(width * height);
  for (let i = 0; i < dist.length; i += 1) {
    dist[i] = binaryEdge[i] ? 0 : INF_DISTANCE;
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      let best = dist[idx];
      if (x > 0) best = Math.min(best, dist[idx - 1] + 1);
      if (y > 0) best = Math.min(best, dist[idx - width] + 1);
      if (x > 0 && y > 0) best = Math.min(best, dist[idx - width - 1] + 1.4142);
      if (x + 1 < width && y > 0)
        best = Math.min(best, dist[idx - width + 1] + 1.4142);
      dist[idx] = best;
    }
  }

  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const idx = y * width + x;
      let best = dist[idx];
      if (x + 1 < width) best = Math.min(best, dist[idx + 1] + 1);
      if (y + 1 < height) best = Math.min(best, dist[idx + width] + 1);
      if (x + 1 < width && y + 1 < height) {
        best = Math.min(best, dist[idx + width + 1] + 1.4142);
      }
      if (x > 0 && y + 1 < height) {
        best = Math.min(best, dist[idx + width - 1] + 1.4142);
      }
      dist[idx] = best;
    }
  }

  return dist;
}

function collectEdgePoints(
  binaryEdge: Uint8Array,
  width: number,
  height: number,
  maxPoints = CHAMFER_POINT_LIMIT,
) {
  const points: Array<{ x: number; y: number }> = [];
  const stride = Math.max(1, Math.floor(Math.min(width, height) / 26));
  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      if (binaryEdge[y * width + x]) {
        points.push({ x, y });
      }
    }
  }
  if (points.length <= maxPoints) return points;
  const reduced: Array<{ x: number; y: number }> = [];
  const keepStride = points.length / maxPoints;
  for (let i = 0; i < maxPoints; i += 1) {
    reduced.push(points[Math.floor(i * keepStride)]);
  }
  return reduced;
}

function chamferSimilarityAt(
  sceneDist: Float32Array,
  sceneWidth: number,
  x: number,
  y: number,
  edgePoints: Array<{ x: number; y: number }>,
  normDistance: number,
) {
  if (!edgePoints.length) return 0;
  let sum = 0;
  for (let i = 0; i < edgePoints.length; i += 1) {
    const p = edgePoints[i];
    sum += sceneDist[(y + p.y) * sceneWidth + (x + p.x)];
  }
  const avgDistance = sum / edgePoints.length;
  const score = 1 - avgDistance / normDistance;
  return Math.max(0, Math.min(1, score));
}

function computeBestChamferScore(
  sceneDist: Float32Array,
  sceneWidth: number,
  sceneHeight: number,
  templateEdge: Float32Array,
  templateWidth: number,
  templateHeight: number,
  templateMask?: Uint8Array,
) {
  if (templateWidth > sceneWidth || templateHeight > sceneHeight) return 0;
  const binaryTemplate = buildBinaryEdge(
    templateEdge,
    CHAMFER_EDGE_THRESHOLD,
    templateMask,
  );
  const edgePoints = collectEdgePoints(
    binaryTemplate,
    templateWidth,
    templateHeight,
  );
  if (!edgePoints.length) return 0;

  const stepX = Math.max(2, Math.floor(templateWidth / 9));
  const stepY = Math.max(2, Math.floor(templateHeight / 9));
  const normDistance = Math.max(
    4,
    Math.sqrt(templateWidth ** 2 + templateHeight ** 2) * 0.22,
  );
  let best = 0;
  for (let y = 0; y <= sceneHeight - templateHeight; y += stepY) {
    for (let x = 0; x <= sceneWidth - templateWidth; x += stepX) {
      const score = chamferSimilarityAt(
        sceneDist,
        sceneWidth,
        x,
        y,
        edgePoints,
        normDistance,
      );
      if (score > best) best = score;
    }
  }
  return best;
}

interface MatchCandidate {
  templateName: string;
  score: number;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

function iou(a: MatchCandidate, b: MatchCandidate) {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  const ix1 = Math.max(a.x, b.x);
  const iy1 = Math.max(a.y, b.y);
  const ix2 = Math.min(ax2, bx2);
  const iy2 = Math.min(ay2, by2);
  const iw = Math.max(0, ix2 - ix1);
  const ih = Math.max(0, iy2 - iy1);
  const inter = iw * ih;
  if (!inter) return 0;
  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
}

function znccAt(
  scene: Float32Array,
  sceneWidth: number,
  x: number,
  y: number,
  template: Float32Array,
  templateWidth: number,
  templateHeight: number,
  templateMask?: Uint8Array,
) {
  let sumScene = 0;
  let sumTemplate = 0;
  let count = 0;
  const sampleStride = Math.max(
    1,
    Math.floor(Math.min(templateWidth, templateHeight) / 24),
  );
  for (let ty = 0; ty < templateHeight; ty += sampleStride) {
    for (let tx = 0; tx < templateWidth; tx += sampleStride) {
      if (templateMask && !templateMask[ty * templateWidth + tx]) {
        continue;
      }
      sumScene += scene[(y + ty) * sceneWidth + (x + tx)];
      sumTemplate += template[ty * templateWidth + tx];
      count += 1;
    }
  }
  if (count < 8) return 0;
  const sceneMean = sumScene / count;
  const templateMean = sumTemplate / count;

  let numerator = 0;
  let denomScene = 0;
  let denomTemplate = 0;
  for (let ty = 0; ty < templateHeight; ty += sampleStride) {
    for (let tx = 0; tx < templateWidth; tx += sampleStride) {
      if (templateMask && !templateMask[ty * templateWidth + tx]) {
        continue;
      }
      const s = scene[(y + ty) * sceneWidth + (x + tx)] - sceneMean;
      const t = template[ty * templateWidth + tx] - templateMean;
      numerator += s * t;
      denomScene += s * s;
      denomTemplate += t * t;
    }
  }
  const denom = Math.sqrt(denomScene * denomTemplate);
  if (denom < 1e-6) return 0;
  const corr = numerator / denom;
  return Math.max(0, Math.min(1, (corr + 1) / 2));
}

function updateTopCandidates(
  candidates: MatchCandidate[],
  next: MatchCandidate,
  maxCount: number,
) {
  for (let i = 0; i < candidates.length; i += 1) {
    const existing = candidates[i];
    if (iou(existing, next) >= NMS_IOU_THRESHOLD) {
      if (next.score > existing.score) {
        candidates[i] = next;
      }
      candidates.sort((a, b) => b.score - a.score);
      if (candidates.length > maxCount) {
        candidates.length = maxCount;
      }
      return;
    }
  }
  candidates.push(next);
  candidates.sort((a, b) => b.score - a.score);
  if (candidates.length > maxCount) {
    candidates.length = maxCount;
  }
}

function computeBestScore(
  scene: Float32Array,
  sceneWidth: number,
  sceneHeight: number,
  template: Float32Array,
  templateWidth: number,
  templateHeight: number,
  templateMask?: Uint8Array,
  collectTopK = 0,
  templateName = "",
  currentScale = 1,
) {
  if (templateWidth > sceneWidth || templateHeight > sceneHeight) {
    return { best: 0, topCandidates: [] as MatchCandidate[] };
  }
  const stepX = Math.max(2, Math.floor(templateWidth / 10));
  const stepY = Math.max(2, Math.floor(templateHeight / 10));
  const roiXMin = 0;
  const roiXMax = Math.max(roiXMin, sceneWidth - templateWidth);
  const roiYMin = Math.max(0, Math.floor(sceneHeight * ROI_Y_MIN_RATIO));
  const roiYMax = Math.max(
    roiYMin,
    Math.min(
      sceneHeight - templateHeight,
      Math.floor(sceneHeight * ROI_Y_MAX_RATIO) - templateHeight,
    ),
  );
  let best = 0;
  const topCandidates: MatchCandidate[] = [];
  for (let y = roiYMin; y <= roiYMax; y += stepY) {
    for (let x = roiXMin; x <= roiXMax; x += stepX) {
      const score = znccAt(
        scene,
        sceneWidth,
        x,
        y,
        template,
        templateWidth,
        templateHeight,
        templateMask,
      );
      if (score > best) best = score;
      if (collectTopK > 0) {
        updateTopCandidates(
          topCandidates,
          {
            templateName,
            score,
            x,
            y,
            width: templateWidth,
            height: templateHeight,
            scale: currentScale,
          },
          collectTopK,
        );
      }
    }
  }
  return { best, topCandidates };
}

function buildScales(start: number, end: number, step: number) {
  const scales: number[] = [];
  let current = start;
  while (current <= end + 1e-9) {
    scales.push(Number(current.toFixed(4)));
    current += step;
  }
  if (!scales.length) {
    scales.push(Number(start.toFixed(4)));
  }
  const last = scales[scales.length - 1];
  if (last != null && last < end - 1e-9) {
    scales.push(Number(end.toFixed(4)));
  }
  return scales;
}

function buildScalesBySceneHeight() {
  const scales = buildScales(
    SCALE_FIXED_MIN,
    SCALE_FIXED_MAX,
    SCALE_REFINE_STEP,
  );
  const coarseScales = buildScales(
    COARSE_SCALE_MIN,
    COARSE_SCALE_MAX,
    SCALE_COARSE_STEP,
  );
  return {
    scales,
    coarseScales,
    minScale: Number(SCALE_FIXED_MIN.toFixed(4)),
    maxScale: Number(SCALE_FIXED_MAX.toFixed(4)),
  };
}

function shouldStopByTurningPoint(
  previousTopScore: number | null,
  currentTopScore: number,
  sawIncrease: boolean,
) {
  if (previousTopScore === null) {
    return { nextSawIncrease: sawIncrease, shouldStop: false };
  }
  if (currentTopScore > previousTopScore + SCALE_TURNING_EPSILON) {
    return { nextSawIncrease: true, shouldStop: false };
  }
  const hasEffectivePeak = previousTopScore >= SCALE_OPTIMAL_SCORE_THRESHOLD;
  if (
    sawIncrease &&
    hasEffectivePeak &&
    currentTopScore < previousTopScore - SCALE_TURNING_EPSILON
  ) {
    return { nextSawIncrease: sawIncrease, shouldStop: true };
  }
  return { nextSawIncrease: sawIncrease, shouldStop: false };
}

async function handleStart(data: StartMessage) {
  // Step 1: decode screenshot and normalize size for stable runtime.
  let sceneGrayRaw: {
    gray: Float32Array;
    alpha: Uint8Array;
    width: number;
    height: number;
  };
  if (data.sceneImageData?.data?.length) {
    sceneGrayRaw = imageDataToGray(
      data.sceneImageData.data,
      data.sceneImageData.width,
      data.sceneImageData.height,
    );
  } else {
    const screenshotBlob = new Blob([data.imageBuffer], {
      type: data.imageMimeType || "image/png",
    });
    const screenshotBitmap = await createImageBitmap(screenshotBlob);
    sceneGrayRaw = bitmapToGray(screenshotBitmap);
    screenshotBitmap.close();
  }

  const sceneGray = resizeSceneIfNeeded(
    sceneGrayRaw.gray,
    sceneGrayRaw.width,
    sceneGrayRaw.height,
  );
  // Step 2: Gaussian blur reduces stripe/noise artifacts from screenshots.
  const sceneBlur = gaussianBlur(
    sceneGray.gray,
    sceneGray.width,
    sceneGray.height,
  );
  const sceneJsfeatBase = new jsfeat.matrix_t(
    sceneGray.width,
    sceneGray.height,
    JSFEAT_U8C1,
  );
  sceneJsfeatBase.data.set(floatGrayToU8(sceneBlur));
  const sceneJsfeatFloat = jsfeatMatrixToFloatGray(sceneJsfeatBase);
  const sceneEdge = buildEdgeMap(sceneBlur, sceneGray.width, sceneGray.height);
  const sceneBinaryEdge = buildBinaryEdge(sceneEdge);
  const sceneDistanceField = distanceTransform(
    sceneBinaryEdge,
    sceneGray.width,
    sceneGray.height,
  );

  postProgress(
    "downloading",
    "已接收模板图片数据",
    data.templateAssets.length,
    data.templateAssets.length,
  );
  const templateBitmaps = await Promise.all(
    data.templateAssets.map(async (asset, index) => {
      const bitmap = await loadBitmapFromBuffer(
        asset.templateBuffer,
        asset.templateMimeType,
      );
      postProgress(
        "downloading",
        `已解析模板 ${index + 1}/${data.templateAssets.length}`,
        index + 1,
        data.templateAssets.length,
      );
      return { asset, bitmap };
    }),
  );

  postProgress(
    "preprocessing",
    "正在预处理模板特征",
    0,
    templateBitmaps.length,
  );
  const templates = templateBitmaps.map(({ asset, bitmap }, index) => {
    const gray = bitmapToGray(bitmap);
    bitmap.close();
    // Step 3: blur template and keep alpha mask to focus on icon body.
    const templateBlur = gaussianBlur(gray.gray, gray.width, gray.height);
    postProgress(
      "preprocessing",
      `已完成模板预处理 ${index + 1}/${templateBitmaps.length}`,
      index + 1,
      templateBitmaps.length,
    );
    return {
      url: asset.templateUrl,
      name: asset.templateName,
      gray: templateBlur,
      mask: alphaToMask(gray.alpha),
      width: gray.width,
      height: gray.height,
      edge: buildEdgeMap(templateBlur, gray.width, gray.height),
      jsfeatGray: (() => {
        const matrix = new jsfeat.matrix_t(
          gray.width,
          gray.height,
          JSFEAT_U8C1,
        );
        matrix.data.set(floatGrayToU8(templateBlur));
        return matrix;
      })(),
    };
  });

  const scores: TemplateScore[] = [];
  const scaleScores: ScaleScoreEntry[] = [];
  const bestByAlgorithmTemplate = new Map<
    string,
    { score: number; bestScale: number | null }
  >();
  const dynamicScale = buildScalesBySceneHeight();
  const coarseScales = dynamicScale.coarseScales;
  const maxRefineScaleCount =
    Math.floor((SCALE_REFINE_RADIUS * 2) / SCALE_REFINE_STEP) + 1;
  const totalTasks =
    templates.length *
    data.algorithms.length *
    (coarseScales.length + maxRefineScaleCount);
  let doneTasks = 0;
  const evaluatedScales = new Set<number>();
  const topScoreByScale = new Map<number, number>();

  const computeTemplateAtScale = (
    scale: number,
    algorithm: MatchAlgorithm,
    template: (typeof templates)[number],
  ) => {
    const scaledWidth = Math.max(8, Math.round(template.width * scale));
    const scaledHeight = Math.max(8, Math.round(template.height * scale));
    const scoreKey = `${algorithm}::${template.name}`;
    const currentBest = bestByAlgorithmTemplate.get(scoreKey) ?? {
      score: 0,
      bestScale: null,
    };
    let currentScore = 0;
    let currentTopCandidate: MatchCandidate | null = null;
    if (scaledWidth > sceneGray.width || scaledHeight > sceneGray.height) {
      return {
        algorithm,
        scale,
        templateName: template.name,
        score: 0,
        x: null,
        y: null,
        width: null,
        height: null,
      } satisfies ScaleScoreEntry;
    }
    if (algorithm === "chamfer") {
      const scaledTemplateEdge = resizeGray(
        template.edge,
        template.width,
        template.height,
        scaledWidth,
        scaledHeight,
      );
      const scaledMask = resizeMask(
        template.mask,
        template.width,
        template.height,
        scaledWidth,
        scaledHeight,
      );
      const chamferScore = computeBestChamferScore(
        sceneDistanceField,
        sceneGray.width,
        sceneGray.height,
        scaledTemplateEdge,
        scaledWidth,
        scaledHeight,
        scaledMask,
      );
      currentScore = chamferScore;
    } else if (algorithm === "jsfeat-ncc") {
      const scaledTemplateJsfeat = new jsfeat.matrix_t(
        scaledWidth,
        scaledHeight,
        JSFEAT_U8C1,
      );
      jsfeat.imgproc.resample(
        template.jsfeatGray,
        scaledTemplateJsfeat,
        scaledWidth,
        scaledHeight,
      );
      const scaledMask = resizeMask(
        template.mask,
        template.width,
        template.height,
        scaledWidth,
        scaledHeight,
      );
      const result = computeBestScore(
        sceneJsfeatFloat,
        sceneGray.width,
        sceneGray.height,
        jsfeatMatrixToFloatGray(scaledTemplateJsfeat),
        scaledWidth,
        scaledHeight,
        scaledMask,
        1,
        template.name,
        scale,
      );
      currentScore = result.best;
      currentTopCandidate = result.topCandidates[0] ?? null;
    } else {
      const selector = ALGORITHM_DATA_SELECTORS[algorithm];
      const { sceneData, templateData } = selector(
        { gray: sceneBlur, edge: sceneEdge },
        { gray: template.gray, edge: template.edge },
      );
      const scaledTemplate = resizeGray(
        templateData,
        template.width,
        template.height,
        scaledWidth,
        scaledHeight,
      );
      const scaledMask = resizeMask(
        template.mask,
        template.width,
        template.height,
        scaledWidth,
        scaledHeight,
      );
      const result = computeBestScore(
        sceneData,
        sceneGray.width,
        sceneGray.height,
        scaledTemplate,
        scaledWidth,
        scaledHeight,
        scaledMask,
        1,
        template.name,
        scale,
      );
      currentScore = result.best;
      currentTopCandidate = result.topCandidates[0] ?? null;
    }

    if (currentScore > currentBest.score) {
      bestByAlgorithmTemplate.set(scoreKey, {
        score: currentScore,
        bestScale: scale,
      });
    } else if (!bestByAlgorithmTemplate.has(scoreKey)) {
      bestByAlgorithmTemplate.set(scoreKey, currentBest);
    }

    return {
      algorithm,
      scale,
      templateName: template.name,
      score: Number(currentScore.toFixed(4)),
      x: currentTopCandidate?.x ?? null,
      y: currentTopCandidate?.y ?? null,
      width: currentTopCandidate?.width ?? null,
      height: currentTopCandidate?.height ?? null,
    } satisfies ScaleScoreEntry;
  };

  const evaluateScale = async (scale: number, useParallelInRefine: boolean) => {
    if (evaluatedScales.has(scale)) {
      return topScoreByScale.get(scale) ?? 0;
    }
    evaluatedScales.add(scale);
    let scaleTopScore = 0;

    for (const algorithm of data.algorithms) {
      if (useParallelInRefine) {
        const rows = await Promise.all(
          templates.map(async (template) => {
            const row = computeTemplateAtScale(scale, algorithm, template);
            doneTasks += 1;
            postProgress(
              "matching",
              `[${algorithm}] scale=${scale} 匹配 ${template.name}`,
              doneTasks,
              totalTasks,
            );
            return row;
          }),
        );
        for (const row of rows) {
          scaleScores.push(row);
          if (row.score > scaleTopScore) {
            scaleTopScore = row.score;
          }
        }
      } else {
        for (const template of templates) {
          const row = computeTemplateAtScale(scale, algorithm, template);
          scaleScores.push(row);
          if (row.score > scaleTopScore) {
            scaleTopScore = row.score;
          }
          doneTasks += 1;
          postProgress(
            "matching",
            `[${algorithm}] scale=${scale} 匹配 ${template.name}`,
            doneTasks,
            totalTasks,
          );
        }
      }
    }
    topScoreByScale.set(scale, scaleTopScore);
    return scaleTopScore;
  };

  // Step 4-1: coarse scan with turning-point early stop.
  let coarseBestScale = coarseScales[0];
  let coarseBestTopScore = 0;
  let previousCoarseTopScore: number | null = null;
  let previousCoarseScale = coarseScales[0];
  let coarseSawIncrease = false;
  let coarseTurningStopped = false;
  for (const scale of coarseScales) {
    const topScore = await evaluateScale(scale, false);
    if (topScore > coarseBestTopScore) {
      coarseBestTopScore = topScore;
      coarseBestScale = scale;
    }
    const turning = shouldStopByTurningPoint(
      previousCoarseTopScore,
      topScore,
      coarseSawIncrease,
    );
    coarseSawIncrease = turning.nextSawIncrease;
    if (turning.shouldStop) {
      coarseBestScale = previousCoarseScale;
      coarseBestTopScore = previousCoarseTopScore ?? coarseBestTopScore;
      coarseTurningStopped = true;
      break;
    }
    previousCoarseTopScore = topScore;
    previousCoarseScale = scale;
  }

  // Step 4-2: refine around coarse peak, only this stage uses parallel strategy.
  const refineMin = Math.max(
    SCALE_FIXED_MIN,
    coarseBestScale - SCALE_REFINE_RADIUS,
  );
  const refineMax = Math.min(
    SCALE_FIXED_MAX,
    coarseBestScale + SCALE_REFINE_RADIUS,
  );
  const refineScales = buildScales(refineMin, refineMax, SCALE_REFINE_STEP);
  let refinedBestScale = coarseBestScale;
  let refinedBestTopScore = coarseBestTopScore;
  let previousRefineTopScore: number | null = null;
  let previousRefineScale = refineScales[0] ?? coarseBestScale;
  let refineSawIncrease = false;
  let refineTurningStopped = false;
  for (const scale of refineScales) {
    const topScore = await evaluateScale(scale, true);
    if (topScore > refinedBestTopScore) {
      refinedBestTopScore = topScore;
      refinedBestScale = scale;
    }
    const turning = shouldStopByTurningPoint(
      previousRefineTopScore,
      topScore,
      refineSawIncrease,
    );
    refineSawIncrease = turning.nextSawIncrease;
    if (turning.shouldStop) {
      refinedBestScale = previousRefineScale;
      refinedBestTopScore = previousRefineTopScore ?? refinedBestTopScore;
      refineTurningStopped = true;
      break;
    }
    previousRefineTopScore = topScore;
    previousRefineScale = scale;
  }

  // Ensure chosen best scale is included in debug ordering.
  void refinedBestScale;
  const evaluatedScaleList = Array.from(evaluatedScales).sort((a, b) => a - b);

  for (const algorithm of data.algorithms) {
    for (const template of templates) {
      const key = `${algorithm}::${template.name}`;
      const best = bestByAlgorithmTemplate.get(key) ?? {
        score: 0,
        bestScale: null,
      };
      scores.push({
        templateName: template.name,
        templateUrl: template.url,
        algorithm,
        score: Number(best.score.toFixed(4)),
        bestScale:
          typeof best.bestScale === "number"
            ? Number(best.bestScale.toFixed(4))
            : null,
      });
    }
  }

  const doneMessage: DoneMessage = {
    type: "done",
    payload: {
      scores,
      scaleScores,
      scaleDebug: {
        baseline: "height",
        referenceSceneHeight: SCALE_REFERENCE_SCENE_HEIGHT,
        sceneHeight: sceneGray.height,
        minScale: dynamicScale.minScale,
        maxScale: dynamicScale.maxScale,
        stepFactor: SCALE_REFINE_STEP,
        scaleCount: evaluatedScaleList.length,
        previewScales: evaluatedScaleList.slice(0, 8),
        coarseStep: SCALE_COARSE_STEP,
        refineStep: SCALE_REFINE_STEP,
        coarseScaleCount: coarseScales.length,
        refineScaleCount: refineScales.length,
        coarsePeakScale: Number(coarseBestScale.toFixed(4)),
        coarsePeakTopScore: Number(coarseBestTopScore.toFixed(4)),
        refinePeakScale: Number(refinedBestScale.toFixed(4)),
        refinePeakTopScore: Number(refinedBestTopScore.toFixed(4)),
        coarseTurningStopped,
        refineTurningStopped,
        turningScoreThreshold: SCALE_OPTIMAL_SCORE_THRESHOLD,
        refineRangeMin: Number(refineMin.toFixed(4)),
        refineRangeMax: Number(refineMax.toFixed(4)),
      },
    },
  };
  self.postMessage(doneMessage);
}

self.onmessage = async (event: MessageEvent<StartMessage>) => {
  try {
    if (event.data.type !== "start") return;
    await handleStart(event.data);
  } catch (error) {
    const err = error as Error;
    const payload: ErrorMessage = {
      type: "error",
      message: err?.stack
        ? `${err.message}\n${err.stack.split("\n").slice(0, 4).join("\n")}`
        : (err?.message ?? "匹配失败"),
    };
    self.postMessage(payload);
  }
};
