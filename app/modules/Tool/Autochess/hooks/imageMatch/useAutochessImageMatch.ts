import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { buildTemplateUrls } from "./templateList";
import type {
  AlgorithmTopMatches,
  MatchAlgorithm,
  MatchProgress,
  MatchResultPayload,
  ScaleDebugInfo,
} from "./types";

type WorkerMessage =
  | {
      type: "progress";
      step: MatchProgress["step"];
      message: string;
      current: number;
      total: number;
    }
  | { type: "done"; payload: MatchResultPayload }
  | { type: "error"; message: string };

interface ClipboardImageData {
  imageBuffer: ArrayBuffer;
  imageMimeType: string;
}

interface SceneImageDataPayload {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

interface TemplateAssetPayload {
  templateName: string;
  templateUrl: string;
  templateBuffer: ArrayBuffer;
  templateMimeType: string;
}

interface BestScaleGroupDecision {
  algorithm: MatchAlgorithm;
  scale: number;
  topScore: number;
  matchedTemplateNames: string[];
}

function detectMimeTypeFromBuffer(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 16));
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "image/bmp";
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }
  return null;
}

const DEFAULT_ALGORITHMS: MatchAlgorithm[] = ["ncc"];
const CARTESIAN_SCORE_THRESHOLD = 0.9;
const SCALE_TURNING_EPSILON = 1e-6;
const INITIAL_PROGRESS: MatchProgress = {
  step: "idle",
  message: "等待粘贴图片",
  current: 0,
  total: 0,
};

function shouldIgnorePasteTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  return target.isContentEditable;
}

async function extractImageBufferFromClipboard(
  event: ClipboardEvent,
): Promise<ClipboardImageData | null> {
  const items = Array.from(event.clipboardData?.items || []);
  const imageItem = items.find((item) => item.type.startsWith("image/"));
  if (!imageItem) return null;
  const file = imageItem.getAsFile();
  if (!file) return null;
  const imageBuffer = await file.arrayBuffer();
  const detectedMimeType = detectMimeTypeFromBuffer(imageBuffer);
  return {
    imageBuffer,
    imageMimeType: file.type || detectedMimeType || "image/png",
  };
}

async function decodeImageData(
  imageBuffer: ArrayBuffer,
  imageMimeType: string,
): Promise<SceneImageDataPayload> {
  const blob = new Blob([imageBuffer], { type: imageMimeType || "image/png" });
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      bitmap.close();
      throw new Error("无法创建主线程 Canvas 上下文");
    }
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    bitmap.close();
    return {
      width: imageData.width,
      height: imageData.height,
      data: imageData.data,
    };
  } catch {
    const objectUrl = URL.createObjectURL(blob);
    try {
      const decoded = await new Promise<SceneImageDataPayload>(
        (resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) {
              reject(new Error("无法创建主线程 Canvas 上下文"));
              return;
            }
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(
              0,
              0,
              img.naturalWidth,
              img.naturalHeight,
            );
            resolve({
              width: imageData.width,
              height: imageData.height,
              data: imageData.data,
            });
          };
          img.onerror = () => {
            reject(
              new Error(
                "主线程 createImageBitmap 和 HTMLImageElement 均解码失败",
              ),
            );
          };
          img.src = objectUrl;
        },
      );
      return decoded;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

function toTemplateShortName(templateName: string) {
  const matched = templateName.match(/^特训敌人_(.+)\.[^.]+$/);
  return matched?.[1] ?? templateName;
}

function pickBestScaleGroupDecision(payload: MatchResultPayload) {
  const scoreRowsByScale = (payload.scaleScores ?? []).map((item) => ({
    algorithm: item.algorithm,
    scale: item.scale,
    templateName: item.templateName,
    score: item.score,
  }));
  if (!scoreRowsByScale.length) return null;

  const grouped = new Map<
    string,
    {
      algorithm: MatchAlgorithm;
      scale: number;
      topScore: number;
      matchedTemplateNames: string[];
    }
  >();
  for (const row of scoreRowsByScale) {
    const key = `${row.algorithm}@${row.scale}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        algorithm: row.algorithm,
        scale: row.scale,
        topScore: row.score,
        matchedTemplateNames:
          row.score > CARTESIAN_SCORE_THRESHOLD
            ? [toTemplateShortName(row.templateName)]
            : [],
      });
      continue;
    }
    existing.topScore = Math.max(existing.topScore, row.score);
    if (row.score > CARTESIAN_SCORE_THRESHOLD) {
      const shortName = toTemplateShortName(row.templateName);
      if (!existing.matchedTemplateNames.includes(shortName)) {
        existing.matchedTemplateNames.push(shortName);
      }
    }
  }

  const groups = Array.from(grouped.values());
  if (!groups.length) return null;

  const groupsByAlgorithm = new Map<MatchAlgorithm, typeof groups>();
  for (const group of groups) {
    const list = groupsByAlgorithm.get(group.algorithm) ?? [];
    list.push(group);
    groupsByAlgorithm.set(group.algorithm, list);
  }

  const candidates: typeof groups = [];
  for (const [, algorithmGroups] of groupsByAlgorithm.entries()) {
    const orderedAll = [...algorithmGroups].sort((a, b) => a.scale - b.scale);
    const ordered =
      orderedAll.filter((item) => item.matchedTemplateNames.length > 0).length > 0
        ? orderedAll.filter((item) => item.matchedTemplateNames.length > 0)
        : orderedAll;
    let best = ordered[0];
    let sawIncrease = false;
    if (ordered.length > 1) {
      for (let i = 1; i < ordered.length; i += 1) {
        const previous = ordered[i - 1];
        const current = ordered[i];
        if (current.topScore > previous.topScore + SCALE_TURNING_EPSILON) {
          sawIncrease = true;
          best = current;
          continue;
        }
        if (sawIncrease && current.topScore < previous.topScore - SCALE_TURNING_EPSILON) {
          // Turning point reached at k, select k-1.
          best = previous;
          break;
        }
      }
    }
    candidates.push(best);
  }

  candidates.sort((a, b) => {
    if (b.topScore !== a.topScore) return b.topScore - a.topScore;
    return b.matchedTemplateNames.length - a.matchedTemplateNames.length;
  });
  const best = candidates[0];
  return {
    algorithm: best.algorithm,
    scale: Number(best.scale.toFixed(4)),
    topScore: Number(best.topScore.toFixed(4)),
    matchedTemplateNames: best.matchedTemplateNames.sort(),
  } satisfies BestScaleGroupDecision;
}

function logMatchScores(payload: MatchResultPayload) {
  const grouped: Record<
    string,
    Partial<
      Record<MatchAlgorithm, { score: number; bestScale?: number | null }>
    >
  > = {};
  for (const item of payload.scores) {
    if (!grouped[item.templateName]) {
      grouped[item.templateName] = {};
    }
    grouped[item.templateName][item.algorithm] = {
      score: item.score,
      bestScale: item.bestScale ?? null,
    };
  }
  const tableRows = Object.entries(grouped).map(([templateName, scores]) => {
    return {
      templateName: toTemplateShortName(templateName),
      ncc: scores["ncc"]?.score ?? null,
      nccScale: scores["ncc"]?.bestScale ?? null,
    };
  });

  const topMatches = computeAlgorithmTopMatches(payload);

  const marginByAlgorithm = topMatches.map((item) => ({
    algorithm: item.algorithm,
    top1: item.topMatches[0]
      ? toTemplateShortName(item.topMatches[0].templateName)
      : null,
    top1Score: item.topMatches[0]?.score ?? null,
    top2: item.topMatches[1]
      ? toTemplateShortName(item.topMatches[1].templateName)
      : null,
    top2Score: item.topMatches[1]?.score ?? null,
    top3: item.topMatches[2]
      ? toTemplateShortName(item.topMatches[2].templateName)
      : null,
    top3Score: item.topMatches[2]?.score ?? null,
    margin: item.marginTop1Top2,
  }));

  const scoreRowsByScale = (payload.scaleScores ?? [])
    .map((item) => ({
      algorithm: item.algorithm,
      scale: item.scale,
      templateName: toTemplateShortName(item.templateName),
      score: item.score,
      x: item.x ?? null,
      y: item.y ?? null,
      width: item.width ?? null,
      height: item.height ?? null,
    }))
    .sort((a, b) => {
      if (a.algorithm !== b.algorithm) {
        return a.algorithm.localeCompare(b.algorithm);
      }
      if (a.scale !== b.scale) {
        return a.scale - b.scale;
      }
      return b.score - a.score;
    });

  const scoreSummaryByScale = Object.values(
    scoreRowsByScale.reduce<
      Record<
        string,
        {
          algorithm: MatchAlgorithm;
          scale: number;
          count: number;
          scoreSum: number;
          topTemplateName: string;
          topScore: number;
        }
      >
    >((acc, row) => {
      const key = `${row.algorithm}@${row.scale}`;
      const existing = acc[key];
      if (!existing) {
        acc[key] = {
          algorithm: row.algorithm,
          scale: row.scale,
          count: 1,
          scoreSum: row.score,
          topTemplateName: row.templateName,
          topScore: row.score,
        };
      } else {
        existing.count += 1;
        existing.scoreSum += row.score;
        if (row.score > existing.topScore) {
          existing.topScore = row.score;
          existing.topTemplateName = row.templateName;
        }
      }
      return acc;
    }, {}),
  )
    .map((item) => ({
      algorithm: item.algorithm,
      scale: item.scale,
      count: item.count,
      avgScore: Number((item.scoreSum / item.count).toFixed(4)),
      topTemplate: item.topTemplateName,
      topScore: Number(item.topScore.toFixed(4)),
    }))
    .sort((a, b) => {
      if (a.algorithm !== b.algorithm) {
        return a.algorithm.localeCompare(b.algorithm);
      }
      return a.scale - b.scale;
    });

  const groupedByScale = new Map<
    number,
    Array<{
      algorithm: MatchAlgorithm;
      scale: number;
      templateName: string;
      score: number;
      x: number | null;
      y: number | null;
      width: number | null;
      height: number | null;
    }>
  >();
  for (const row of scoreRowsByScale) {
    const list = groupedByScale.get(row.scale) ?? [];
    list.push(row);
    groupedByScale.set(row.scale, list);
  }

  const groupDecisionRows: Array<{
    algorithm: MatchAlgorithm;
    scale: number;
    topScore: number;
    matchedCount: number;
    matchedNames: string;
  }> = [];
  for (const [scale, rows] of groupedByScale.entries()) {
    const byAlgorithm = new Map<MatchAlgorithm, typeof rows>();
    for (const row of rows) {
      const list = byAlgorithm.get(row.algorithm) ?? [];
      list.push(row);
      byAlgorithm.set(row.algorithm, list);
    }
    for (const [algorithm, algorithmRows] of byAlgorithm.entries()) {
      const topScore = Math.max(...algorithmRows.map((item) => item.score));
      const matched = algorithmRows
        .filter((item) => item.score > CARTESIAN_SCORE_THRESHOLD)
        .map((item) => toTemplateShortName(item.templateName))
        .sort();
      groupDecisionRows.push({
        algorithm,
        scale,
        topScore: Number(topScore.toFixed(4)),
        matchedCount: matched.length,
        matchedNames: matched.join(" + "),
      });
    }
  }
  groupDecisionRows.sort((a, b) => {
    if (b.topScore !== a.topScore) return b.topScore - a.topScore;
    return b.matchedCount - a.matchedCount;
  });

  console.group("[Autochess] Image match scores");
  console.table(tableRows);
  if (scoreRowsByScale.length > 0) {
    const orderedScales = Array.from(groupedByScale.keys()).sort(
      (a, b) => a - b,
    );
    for (const scale of orderedScales) {
      const scaleRows = (groupedByScale.get(scale) ?? []).sort((a, b) => {
        if (a.algorithm !== b.algorithm) {
          return a.algorithm.localeCompare(b.algorithm);
        }
        return b.score - a.score;
      });
      console.groupCollapsed(`[Autochess] scale=${scale}`);
      console.table(scaleRows);
      const groupDecisionByScale = groupDecisionRows
        .filter((item) => item.scale === scale)
        .sort((a, b) => b.topScore - a.topScore);
      if (groupDecisionByScale.length > 0) {
        console.table(groupDecisionByScale);
      }
      console.groupEnd();
    }
    console.table(scoreSummaryByScale);
  }
  console.table(marginByAlgorithm);
  if (payload.scaleDebug) {
    console.log("[Autochess] NccScaleDebug", payload.scaleDebug);
  }
  console.groupEnd();

  return pickBestScaleGroupDecision(payload);
}

function computeAlgorithmTopMatches(
  payload: MatchResultPayload,
): AlgorithmTopMatches[] {
  const algorithms = Array.from(
    new Set(payload.scores.map((item) => item.algorithm)),
  ) as MatchAlgorithm[];
  algorithms.sort((left, right) => {
    if (left === "ncc") return -1;
    if (right === "ncc") return 1;
    if (left === "jsfeat-ncc") return -1;
    if (right === "jsfeat-ncc") return 1;
    return left.localeCompare(right);
  });
  return algorithms.map((algorithm) => {
    const ranked = payload.scores
      .filter((item) => item.algorithm === algorithm)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => ({
        templateName: item.templateName,
        score: item.score,
      }));
    const top1 = ranked[0]?.score;
    const top2 = ranked[1]?.score;
    return {
      algorithm,
      topMatches: ranked,
      marginTop1Top2:
        typeof top1 === "number" && typeof top2 === "number"
          ? Number((top1 - top2).toFixed(4))
          : null,
    };
  });
}


export function useAutochessImageMatch() {
  const isDev = import.meta.env.DEV;
  const workerRef = useRef<Worker | null>(null);
  const objectUrlRefs = useRef<string[]>([]);
  const templateAssetCacheRef = useRef<Map<string, TemplateAssetPayload>>(
    new Map(),
  );
  const taskIdRef = useRef(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState<MatchProgress>(INITIAL_PROGRESS);
  const [lastResult, setLastResult] = useState<MatchResultPayload | null>(null);
  const [pastedImagePreviewUrl, setPastedImagePreviewUrl] = useState<
    string | null
  >(null);
  const [algorithmTopMatches, setAlgorithmTopMatches] = useState<
    AlgorithmTopMatches[]
  >([]);
  const [scaleDebug, setScaleDebug] = useState<ScaleDebugInfo | null>(null);
  const [bestScaleGroup, setBestScaleGroup] =
    useState<BestScaleGroupDecision | null>(null);
  const [matchedTemplateNames, setMatchedTemplateNames] = useState<string[]>(
    [],
  );

  const templateUrls = useMemo(() => buildTemplateUrls(), []);

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(new URL("./matcher.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    return worker;
  }, []);

  const resetToIdle = useCallback(() => {
    setIsProcessing(false);
    setProgress(INITIAL_PROGRESS);
    setAlgorithmTopMatches([]);
    setPastedImagePreviewUrl(null);
    setScaleDebug(null);
    setBestScaleGroup(null);
    setMatchedTemplateNames([]);
    objectUrlRefs.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlRefs.current = [];
  }, []);

  const handleWorkerMessage = useCallback(
    (message: WorkerMessage) => {
      if (message.type === "progress") {
        setProgress({
          step: message.step,
          message: message.message,
          current: message.current,
          total: message.total,
        });
        return;
      }
      if (message.type === "done") {
        const basePayload = message.payload;
        setLastResult(basePayload);
        setScaleDebug(basePayload.scaleDebug ?? null);
        setAlgorithmTopMatches(computeAlgorithmTopMatches(basePayload));
        setProgress({
          step: "done",
          message: "匹配完成，结果已输出到控制台",
          current: basePayload.scores.length,
          total: basePayload.scores.length,
        });
        const decision = logMatchScores(basePayload);
        setBestScaleGroup(decision);
        setMatchedTemplateNames(decision?.matchedTemplateNames ?? []);
        setIsProcessing(false);
        if (!isDev) {
          setIsModalOpen(false);
        }
        toast.success("图片匹配完成，请查看控制台分数");
        return;
      }
      setProgress({
        step: "failed",
        message: message.message || "匹配失败",
        current: 0,
        total: 0,
      });
      setIsProcessing(false);
      toast.error(message.message || "匹配失败");
    },
    [isDev],
  );

  const loadTemplateAssets = useCallback(async (urls: string[]) => {
    const assets: TemplateAssetPayload[] = [];
    for (let i = 0; i < urls.length; i += 1) {
      const templateUrl = urls[i];
      const templateName = decodeURIComponent(
        templateUrl.split("/").pop() || templateUrl,
      );
      setProgress({
        step: "downloading",
        message: `正在下载模板 ${i + 1}/${urls.length}`,
        current: i + 1,
        total: urls.length,
      });
      const cached = templateAssetCacheRef.current.get(templateUrl);
      if (cached) {
        assets.push(cached);
        continue;
      }
      try {
        const response = await fetch(templateUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        const templateBuffer = await blob.arrayBuffer();
        const asset = {
          templateName,
          templateUrl,
          templateBuffer,
          templateMimeType: blob.type || "image/png",
        };
        assets.push(asset);
        templateAssetCacheRef.current.set(templateUrl, asset);
      } catch {
        // skip failed template; errors are reflected by missing assets
      }
    }
    return assets;
  }, []);

  const startMatch = useCallback(
    async (
      imageBuffer: ArrayBuffer,
      imageMimeType: string,
      sceneImageData: SceneImageDataPayload | null,
      algorithms: MatchAlgorithm[] = DEFAULT_ALGORITHMS,
    ) => {
      setIsModalOpen(true);
      setIsProcessing(true);
      setLastResult(null);
      setScaleDebug(null);
      setAlgorithmTopMatches([]);
      setProgress({
        step: "downloading",
        message: "准备匹配任务",
        current: 0,
        total: templateUrls.length,
      });
      const templateAssets = await loadTemplateAssets(templateUrls);
      if (!templateAssets.length) {
        throw new Error("模板图片全部下载失败，请检查后端静态资源路径");
      }
      taskIdRef.current += 1;

      const worker = ensureWorker();
      worker.onmessage = (event: MessageEvent<WorkerMessage>) =>
        handleWorkerMessage(event.data);
      worker.onerror = (event) => {
        setProgress({
          step: "failed",
          message: event.message || "匹配任务异常退出",
          current: 0,
          total: 0,
        });
        setIsProcessing(false);
        toast.error(event.message || "匹配任务异常退出");
      };
      worker.postMessage({
        type: "start",
        imageBuffer,
        imageMimeType,
        sceneImageData,
        templateAssets,
        algorithms,
      });
    },
    [ensureWorker, handleWorkerMessage, loadTemplateAssets, templateUrls],
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      if (isProcessing) return;
      if (shouldIgnorePasteTarget(event.target)) return;
      const imageData = await extractImageBufferFromClipboard(event);
      if (!imageData) return;
      event.preventDefault();
      objectUrlRefs.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlRefs.current = [];
      const pastedPreviewBlob = new Blob([imageData.imageBuffer], {
        type: imageData.imageMimeType || "image/png",
      });
      const pastedPreviewUrl = URL.createObjectURL(pastedPreviewBlob);
      objectUrlRefs.current.push(pastedPreviewUrl);
      setPastedImagePreviewUrl(pastedPreviewUrl);
      let sceneImageData: SceneImageDataPayload | null = null;
      try {
        sceneImageData = await decodeImageData(
          imageData.imageBuffer,
          imageData.imageMimeType,
        );
      } catch {
        sceneImageData = null;
      }
      await startMatch(
        imageData.imageBuffer,
        imageData.imageMimeType,
        sceneImageData,
      );
    },
    [isProcessing, startMatch],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      objectUrlRefs.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlRefs.current = [];
    };
  }, []);

  return {
    isDev,
    isProcessing,
    isModalOpen,
    progress,
    lastResult,
    scaleDebug,
    pastedImagePreviewUrl,
    algorithmTopMatches,
    bestScaleGroup,
    matchedTemplateNames,
    closeModal: () => setIsModalOpen(false),
    resetToIdle,
  };
}
