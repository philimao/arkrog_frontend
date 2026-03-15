import type {
  MatchAlgorithm,
  MatchResultPayload,
  MatchStep,
  TemplateScore,
} from "./types";

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
const SCALE_MIN = 0.55;
const SCALE_MAX = 1.65;
const SCALE_FACTOR = 1.1;
const CHAMFER_EDGE_THRESHOLD = 42;
const CHAMFER_POINT_LIMIT = 260;
const INF_DISTANCE = 1e9;

const ALGORITHM_DATA_SELECTORS: Record<
  Extract<MatchAlgorithm, "ncc" | "edge-ncc">,
  (scene: { gray: Float32Array; edge: Float32Array }, template: { gray: Float32Array; edge: Float32Array }) => {
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
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  return { gray, width: bitmap.width, height: bitmap.height };
}

function imageDataToGray(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < imageData.length; i += 4, p += 1) {
    gray[p] = imageData[i] * 0.299 + imageData[i + 1] * 0.587 + imageData[i + 2] * 0.114;
  }
  return { gray, width, height };
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

function buildBinaryEdge(edge: Float32Array, threshold = CHAMFER_EDGE_THRESHOLD) {
  const binary = new Uint8Array(edge.length);
  for (let i = 0; i < edge.length; i += 1) {
    binary[i] = edge[i] >= threshold ? 1 : 0;
  }
  return binary;
}

function distanceTransform(binaryEdge: Uint8Array, width: number, height: number) {
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
      if (x + 1 < width && y > 0) best = Math.min(best, dist[idx - width + 1] + 1.4142);
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
) {
  if (templateWidth > sceneWidth || templateHeight > sceneHeight) return 0;
  const binaryTemplate = buildBinaryEdge(templateEdge);
  const edgePoints = collectEdgePoints(binaryTemplate, templateWidth, templateHeight);
  if (!edgePoints.length) return 0;

  const stepX = Math.max(2, Math.floor(templateWidth / 9));
  const stepY = Math.max(2, Math.floor(templateHeight / 9));
  const normDistance = Math.max(4, Math.sqrt(templateWidth ** 2 + templateHeight ** 2) * 0.22);
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

function similarityAt(
  scene: Float32Array,
  sceneWidth: number,
  x: number,
  y: number,
  template: Float32Array,
  templateWidth: number,
  templateHeight: number,
) {
  let sumDiff = 0;
  let count = 0;
  const sampleStride = Math.max(1, Math.floor(Math.min(templateWidth, templateHeight) / 24));
  for (let ty = 0; ty < templateHeight; ty += sampleStride) {
    for (let tx = 0; tx < templateWidth; tx += sampleStride) {
      const sceneValue = scene[(y + ty) * sceneWidth + (x + tx)];
      const tmplValue = template[ty * templateWidth + tx];
      sumDiff += Math.abs(sceneValue - tmplValue);
      count += 1;
    }
  }
  if (!count) return 0;
  const normalized = 1 - sumDiff / (count * 255);
  return Math.max(0, Math.min(1, normalized));
}

function computeBestScore(
  scene: Float32Array,
  sceneWidth: number,
  sceneHeight: number,
  template: Float32Array,
  templateWidth: number,
  templateHeight: number,
) {
  if (templateWidth > sceneWidth || templateHeight > sceneHeight) {
    return 0;
  }
  const stepX = Math.max(2, Math.floor(templateWidth / 10));
  const stepY = Math.max(2, Math.floor(templateHeight / 10));
  let best = 0;
  for (let y = 0; y <= sceneHeight - templateHeight; y += stepY) {
    for (let x = 0; x <= sceneWidth - templateWidth; x += stepX) {
      const score = similarityAt(
        scene,
        sceneWidth,
        x,
        y,
        template,
        templateWidth,
        templateHeight,
      );
      if (score > best) best = score;
    }
  }
  return best;
}

function buildScales() {
  const scales: number[] = [];
  let current = SCALE_MIN;
  while (current <= SCALE_MAX) {
    scales.push(Number(current.toFixed(4)));
    current *= SCALE_FACTOR;
  }
  return scales;
}

async function handleStart(data: StartMessage) {
  let sceneGrayRaw: { gray: Float32Array; width: number; height: number };
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
  const sceneEdge = buildEdgeMap(sceneGray.gray, sceneGray.width, sceneGray.height);
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

  postProgress("preprocessing", "正在预处理模板特征", 0, templateBitmaps.length);
  const templates = templateBitmaps.map(({ asset, bitmap }, index) => {
    const gray = bitmapToGray(bitmap);
    bitmap.close();
    postProgress(
      "preprocessing",
      `已完成模板预处理 ${index + 1}/${templateBitmaps.length}`,
      index + 1,
      templateBitmaps.length,
    );
    return {
      url: asset.templateUrl,
      name: asset.templateName,
      gray: gray.gray,
      width: gray.width,
      height: gray.height,
      edge: buildEdgeMap(gray.gray, gray.width, gray.height),
    };
  });

  const scores: TemplateScore[] = [];
  const scales = buildScales();
  const totalTasks = templates.length * data.algorithms.length;
  let doneTasks = 0;

  for (const algorithm of data.algorithms) {
    for (const template of templates) {
      let best = 0;
      for (const scale of scales) {
        const scaledWidth = Math.max(8, Math.round(template.width * scale));
        const scaledHeight = Math.max(8, Math.round(template.height * scale));
        if (scaledWidth > sceneGray.width || scaledHeight > sceneGray.height) {
          continue;
        }
        if (algorithm === "chamfer") {
          const scaledTemplateEdge = resizeGray(
            template.edge,
            template.width,
            template.height,
            scaledWidth,
            scaledHeight,
          );
          best = Math.max(
            best,
            computeBestChamferScore(
              sceneDistanceField,
              sceneGray.width,
              sceneGray.height,
              scaledTemplateEdge,
              scaledWidth,
              scaledHeight,
            ),
          );
        } else {
          const selector = ALGORITHM_DATA_SELECTORS[algorithm];
          const { sceneData, templateData } = selector(
            { gray: sceneGray.gray, edge: sceneEdge },
            { gray: template.gray, edge: template.edge },
          );
          const scaledTemplate = resizeGray(
            templateData,
            template.width,
            template.height,
            scaledWidth,
            scaledHeight,
          );
          best = Math.max(
            best,
            computeBestScore(
              sceneData,
              sceneGray.width,
              sceneGray.height,
              scaledTemplate,
              scaledWidth,
              scaledHeight,
            ),
          );
        }
      }

      doneTasks += 1;
      postProgress(
        "matching",
        `[${algorithm}] 匹配 ${template.name}`,
        doneTasks,
        totalTasks,
      );
      scores.push({
        templateName: template.name,
        templateUrl: template.url,
        algorithm,
        score: Number(best.toFixed(4)),
      });
    }
  }

  const doneMessage: DoneMessage = {
    type: "done",
    payload: { scores },
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
        : err?.message ?? "匹配失败",
    };
    self.postMessage(payload);
  }
};
