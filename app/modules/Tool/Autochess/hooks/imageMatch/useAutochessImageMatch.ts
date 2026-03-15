import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { buildTemplateUrls } from "./templateList";
import type {
  MatchAlgorithm,
  MatchProgress,
  MatchResultPayload,
  TemplateDebugItem,
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

const DEFAULT_ALGORITHMS: MatchAlgorithm[] = ["ncc", "edge-ncc", "chamfer"];
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
      const decoded = await new Promise<SceneImageDataPayload>((resolve, reject) => {
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
          const imageData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
          resolve({
            width: imageData.width,
            height: imageData.height,
            data: imageData.data,
          });
        };
        img.onerror = () => {
          reject(
            new Error("主线程 createImageBitmap 和 HTMLImageElement 均解码失败"),
          );
        };
        img.src = objectUrl;
      });
      return decoded;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

function logMatchScores(payload: MatchResultPayload) {
  const grouped: Record<string, Record<string, number>> = {};
  for (const item of payload.scores) {
    if (!grouped[item.templateName]) {
      grouped[item.templateName] = {};
    }
    grouped[item.templateName][item.algorithm] = item.score;
  }
  const tableRows = Object.entries(grouped).map(([templateName, scores]) => ({
    templateName,
    ncc: scores["ncc"] ?? null,
    edgeNcc: scores["edge-ncc"] ?? null,
    chamfer: scores.chamfer ?? null,
  }));

  const marginByAlgorithm = ["ncc", "edge-ncc", "chamfer"].map((algorithm) => {
    const ranking = tableRows
      .map((row) => ({
        templateName: row.templateName,
        score: (row as Record<string, number | string | null>)[algorithm] as
          | number
          | null,
      }))
      .filter((item): item is { templateName: string; score: number } =>
        typeof item.score === "number",
      )
      .sort((a, b) => b.score - a.score);

    const top1 = ranking[0];
    const top2 = ranking[1];
    return {
      algorithm,
      top1: top1?.templateName ?? null,
      top1Score: top1?.score ?? null,
      top2: top2?.templateName ?? null,
      top2Score: top2?.score ?? null,
      margin:
        typeof top1?.score === "number" && typeof top2?.score === "number"
          ? Number((top1.score - top2.score).toFixed(4))
          : null,
    };
  });

  console.group("[Autochess] Image match scores");
  console.table(tableRows);
  console.table(marginByAlgorithm);
  console.groupEnd();
}

export function useAutochessImageMatch() {
  const isDev = import.meta.env.DEV;
  const workerRef = useRef<Worker | null>(null);
  const objectUrlRefs = useRef<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState<MatchProgress>(INITIAL_PROGRESS);
  const [lastResult, setLastResult] = useState<MatchResultPayload | null>(null);
  const [pastedImagePreviewUrl, setPastedImagePreviewUrl] = useState<string | null>(
    null,
  );
  const [templateDebugItems, setTemplateDebugItems] = useState<TemplateDebugItem[]>(
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
    setTemplateDebugItems([]);
    setPastedImagePreviewUrl(null);
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
        setLastResult(message.payload);
        setProgress({
          step: "done",
          message: "匹配完成，结果已输出到控制台",
          current: message.payload.scores.length,
          total: message.payload.scores.length,
        });
        logMatchScores(message.payload);
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

  const loadTemplateAssets = useCallback(
    async (urls: string[]) => {
      const assets: TemplateAssetPayload[] = [];
      const debugItems: TemplateDebugItem[] = [];
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
        try {
          const response = await fetch(templateUrl, { cache: "no-store" });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const blob = await response.blob();
          const templateBuffer = await blob.arrayBuffer();
          const previewUrl = URL.createObjectURL(blob);
          objectUrlRefs.current.push(previewUrl);
          let width = 0;
          let height = 0;
          try {
            const bitmap = await createImageBitmap(blob);
            width = bitmap.width;
            height = bitmap.height;
            bitmap.close();
          } catch {
            // keep width/height as 0 when decode probe fails
          }
          assets.push({
            templateName,
            templateUrl,
            templateBuffer,
            templateMimeType: blob.type || "image/png",
          });
          debugItems.push({
            templateName,
            templateUrl,
            previewUrl,
            status: "success",
            width: width || undefined,
            height: height || undefined,
            size: blob.size,
          });
        } catch (error) {
          debugItems.push({
            templateName,
            templateUrl,
            status: "failed",
            error: (error as Error).message ?? "下载失败",
          });
        }
      }
      setTemplateDebugItems(debugItems);
      return assets;
    },
    [],
  );

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
    pastedImagePreviewUrl,
    templateDebugItems,
    closeModal: () => setIsModalOpen(false),
    resetToIdle,
  };
}
