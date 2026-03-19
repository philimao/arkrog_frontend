import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const TARGET_WIDTH = 720;

interface OperatorRecognitionResult {
  rawIconBoxes: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    matchScore: number;
    finalScore: number;
  }>;
  adjustedIconBoxes: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    matchScore: number;
    finalScore: number;
  }>;
  roiResults: Array<{
    roi: { x: number; y: number; w: number; h: number };
    banBox: { x: number; y: number; w: number; h: number };
    operators: Array<{ charId: string; name: string; score: number }>;
    best: { charId: string; name: string; score: number } | null;
  }>;
  stageTiming: { totalMs: number; [k: string]: number | undefined };
}

export interface RecognitionEntry {
  id: string;
  originalUri: string;
  annotatedUri: string;
  result: OperatorRecognitionResult;
}

function shouldIgnorePasteTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  return target.isContentEditable;
}

async function extractImageFromClipboard(
  event: ClipboardEvent,
): Promise<{ blob: Blob; width: number; height: number } | null> {
  const items = Array.from(event.clipboardData?.items || []);
  const imageItem = items.find((item) => item.type.startsWith("image/"));
  if (!imageItem) return null;
  const file = imageItem.getAsFile();
  if (!file) return null;

  const blob = new Blob([await file.arrayBuffer()], {
    type: file.type || "image/png",
  });
  const bitmap = await createImageBitmap(blob);
  const width = bitmap.width;
  const height = bitmap.height;
  bitmap.close();

  return { blob, width, height };
}

async function resizeTo720(
  blob: Blob,
  origWidth: number,
  origHeight: number,
): Promise<string> {
  const scale = TARGET_WIDTH / origWidth;
  const h = Math.round(origHeight * scale);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = TARGET_WIDTH;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法创建 Canvas 上下文"));
        return;
      }
      ctx.drawImage(img, 0, 0, TARGET_WIDTH, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("图片解码失败"));
    img.src = URL.createObjectURL(blob);
  });
}

function drawAnnotatedImage(
  imageDataUrl: string,
  result: OperatorRecognitionResult,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法创建 Canvas 上下文"));
        return;
      }
      ctx.drawImage(img, 0, 0);

      ctx.lineWidth = 2;

      for (const item of result.roiResults) {
        const { roi, best } = item;
        if (!best) continue;

        const highConfidence = best.score >= 0.4;
        ctx.strokeStyle = highConfidence ? "rgb(255, 215, 0)" : "rgb(220, 38, 38)";
        ctx.strokeRect(roi.x, roi.y, roi.w, roi.h);

        if (highConfidence) {
          ctx.font = '10px "PingFang SC", "Microsoft YaHei", sans-serif';
          const line1 = best.score.toFixed(2);
          const line2 = best.name;
          ctx.fillStyle = "rgba(0,0,0,0.7)";
          const m1 = ctx.measureText(line1);
          const m2 = ctx.measureText(line2);
          const pad = 3;
          const boxW = Math.max(m1.width, m2.width) + pad * 2;
          const lineH = 11;
          const boxH = lineH * 2 + pad;
          ctx.fillRect(roi.x, roi.y - boxH, boxW, boxH);
          ctx.fillStyle = "white";
          ctx.fillText(line1, roi.x + pad, roi.y - boxH + lineH - 2);
          ctx.fillText(line2, roi.x + pad, roi.y - 2);
        }
      }

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = imageDataUrl;
  });
}

interface UseOperatorRecognitionOptions {
  enabled: boolean;
  onResult: (entry: RecognitionEntry) => void;
}

export function useOperatorRecognition({
  enabled,
  onResult,
}: UseOperatorRecognitionOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState({
    step: "idle",
    message: "等待粘贴图片",
    current: 0,
    total: 0,
  });
  const uriMapRef = useRef<
    Map<string, { originalUri: string; annotatedUri: string }>
  >(new Map());

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      if (!enabled) return;
      if (isProcessing) return;
      if (shouldIgnorePasteTarget(event.target)) return;

      const extracted = await extractImageFromClipboard(event);
      if (!extracted) return;

      event.preventDefault();
      setIsModalOpen(true);
      setIsProcessing(true);
      setProgress({
        step: "upload",
        message: "准备上传…",
        current: 0,
        total: 1,
      });

      try {
        let dataUrl: string;
        if (extracted.width > TARGET_WIDTH) {
          setProgress({
            step: "upload",
            message: "正在压缩图片…",
            current: 0,
            total: 1,
          });
          dataUrl = await resizeTo720(
            extracted.blob,
            extracted.width,
            extracted.height,
          );
        } else if (extracted.width < TARGET_WIDTH) {
          const msg = `分辨率过低（当前 ${extracted.width}px），请使用宽度为 ${TARGET_WIDTH}px 的截图`;
          setProgress({ step: "失败", message: msg, current: 0, total: 0 });
          setIsProcessing(false);
          return;
        } else if (extracted.width !== TARGET_WIDTH) {
          const msg = `图片宽度须为 ${TARGET_WIDTH}px，当前 ${extracted.width}px`;
          setProgress({ step: "失败", message: msg, current: 0, total: 0 });
          setIsProcessing(false);
          return;
        } else {
          const blobUrl = URL.createObjectURL(extracted.blob);
          dataUrl = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const c = document.createElement("canvas");
              c.width = img.naturalWidth;
              c.height = img.naturalHeight;
              const ctx = c.getContext("2d");
              if (!ctx) {
                reject(new Error("无法创建 Canvas"));
                return;
              }
              ctx.drawImage(img, 0, 0);
              resolve(c.toDataURL("image/png"));
              URL.revokeObjectURL(blobUrl);
            };
            img.onerror = () => {
              URL.revokeObjectURL(blobUrl);
              reject(new Error("图片解码失败"));
            };
            img.src = blobUrl;
          });
        }

        setProgress({
          step: "upload",
          message: "正在识别…",
          current: 0,
          total: 1,
        });

        const apiBase =
          (import.meta.env.VITE_API_BASE_URL as string)?.trim() || "";
        const res = await fetch(`${apiBase}/misc/autochess/recognize`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });

        const json = await res.json();
        if (json.code !== 0) {
          throw new Error(json.message || "识别失败");
        }

        const result = json.data as OperatorRecognitionResult;
        setProgress({
          step: "done",
          message: "识别完成",
          current: 1,
          total: 1,
        });

        const annotatedUri = await drawAnnotatedImage(dataUrl, result);
        const id = crypto.randomUUID();

        uriMapRef.current.set(id, { originalUri: dataUrl, annotatedUri });
        onResult({
          id,
          originalUri: dataUrl,
          annotatedUri,
          result,
        });

        setIsProcessing(false);
        setIsModalOpen(false);
        toast.success(`识别完成，共 ${result.roiResults.length} 个干员`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setProgress({ step: "失败", message: msg, current: 0, total: 0 });
        setIsProcessing(false);
      }
    },
    [enabled, isProcessing, onResult],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    return () => {
      for (const { originalUri, annotatedUri } of uriMapRef.current.values()) {
        if (originalUri.startsWith("blob:")) URL.revokeObjectURL(originalUri);
        if (annotatedUri.startsWith("blob:")) URL.revokeObjectURL(annotatedUri);
      }
      uriMapRef.current.clear();
    };
  }, []);

  const revokeUri = useCallback((id: string) => {
    const entry = uriMapRef.current.get(id);
    if (entry) {
      if (entry.originalUri.startsWith("blob:"))
        URL.revokeObjectURL(entry.originalUri);
      if (entry.annotatedUri.startsWith("blob:"))
        URL.revokeObjectURL(entry.annotatedUri);
      uriMapRef.current.delete(id);
    }
  }, []);

  return {
    isProcessing,
    isModalOpen,
    progress,
    closeModal: () => setIsModalOpen(false),
    revokeUri,
  };
}
