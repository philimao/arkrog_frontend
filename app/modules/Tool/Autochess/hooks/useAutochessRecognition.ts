/**
 * Autochess 统一识别 Hook：全局粘贴 + SSE 流式进度
 *
 * - 全局监听 paste，无需点击按钮
 * - 使用 recognize-stream 接口，解析 upload/queue/processing/result/error
 * - Modal 展示进度、用户图片、dev 下格式化结果且不自动关闭
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const TARGET_WIDTH = 720;
const isDev = import.meta.env.DEV;

/** 识别结果（当前仅 operator，后续扩展 enemy） */
export interface AutochessRecognitionResult {
  type?: "operator" | "enemy";
  rawIconBoxes?: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    matchScore: number;
    finalScore: number;
  }>;
  adjustedIconBoxes?: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    matchScore: number;
    finalScore: number;
  }>;
  roiResults?: Array<{
    roi: { x: number; y: number; w: number; h: number };
    banBox: { x: number; y: number; w: number; h: number };
    operators: Array<{ charId: string; name: string; score: number }>;
    best: { charId: string; name: string; score: number } | null;
  }>;
  enemyRoi?: { x: number; y: number; w: number; h: number } | null;
  enemyMatches?: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    templateName: string;
    pinyinInitials?: string;
    score: number;
  }>;
  stageTiming?: { totalMs: number; [k: string]: number | undefined };
}

export interface RecognitionEntry {
  id: string;
  originalUri: string;
  annotatedUri: string;
  result: AutochessRecognitionResult;
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
  result: AutochessRecognitionResult,
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
      ctx.font = '10px "PingFang SC", "Microsoft YaHei", sans-serif';

      if (result.roiResults && result.roiResults.length > 0) {
        for (const item of result.roiResults) {
          const { roi, best } = item;
          if (!best) continue;
          const highConfidence = best.score >= 0.4;
          ctx.strokeStyle = highConfidence
            ? "rgb(255, 215, 0)"
            : "rgb(220, 38, 38)";
          ctx.strokeRect(roi.x, roi.y, roi.w, roi.h);
          if (highConfidence) {
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
      } else if (result.enemyMatches && result.enemyMatches.length > 0) {
        ctx.strokeStyle = "rgb(24, 209, 255)";
        for (const m of result.enemyMatches) {
          ctx.strokeRect(m.x, m.y, m.w, m.h);
          const label = `${m.templateName} ${m.score.toFixed(2)}`;
          ctx.fillStyle = "rgba(0,0,0,0.75)";
          const m1 = ctx.measureText(label);
          const pad = 3;
          const boxW = m1.width + pad * 2;
          const lineH = 12;
          const boxH = lineH + pad;
          ctx.fillRect(m.x, m.y - boxH, boxW, boxH);
          ctx.fillStyle = "white";
          ctx.fillText(label, m.x + pad, m.y - 2);
        }
      }

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = imageDataUrl;
  });
}

interface UseAutochessRecognitionOptions {
  onResult: (entry: RecognitionEntry) => void;
}

export function useAutochessRecognition({
  onResult,
}: UseAutochessRecognitionOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState({
    step: "idle",
    message: "等待粘贴图片",
    current: 0,
    total: 0,
  });
  const [pastedImagePreviewUrl, setPastedImagePreviewUrl] = useState<
    string | null
  >(null);
  const [lastResult, setLastResult] = useState<AutochessRecognitionResult | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const uriMapRef = useRef<
    Map<string, { originalUri: string; annotatedUri: string }>
  >(new Map());

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      if (isProcessing) return;
      if (shouldIgnorePasteTarget(event.target)) return;

      const extracted = await extractImageFromClipboard(event);
      if (!extracted) return;

      event.preventDefault();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setIsModalOpen(true);
      setIsProcessing(true);
      setLastResult(null);
      setProgress({ step: "upload", message: "准备上传…", current: 0, total: 1 });

      let dataUrl: string;
      try {
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setProgress({ step: "失败", message: msg, current: 0, total: 0 });
        setIsProcessing(false);
        return;
      }

      const previewUrl = URL.createObjectURL(extracted.blob);
      previewUrlRef.current = previewUrl;
      setPastedImagePreviewUrl(previewUrl);

      abortControllerRef.current = new AbortController();
      const apiBase =
        (import.meta.env.VITE_API_BASE_URL as string)?.trim() || "";

      setProgress({
        step: "upload",
        message: "已上传，等待服务器响应…",
        current: 0,
        total: 1,
      });

      try {
        const response = await fetch(
          `${apiBase}/misc/autochess/recognize-stream`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
            },
            body: JSON.stringify({ image: dataUrl }),
            signal: abortControllerRef.current.signal,
          },
        );

        if (!response.ok || !response.body) {
          throw new Error("请求失败");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let result: AutochessRecognitionResult | null = null;
        let errorMessage: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const block of lines) {
            if (!block.trim()) continue;
            let eventType = "message";
            let dataStr = "";
            for (const line of block.split("\n")) {
              if (line.startsWith("event:")) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataStr = line.slice(5).trim();
              }
            }
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (eventType === "upload") {
                setProgress({
                  step: "upload",
                  message: data.message || "已接收",
                  current: 0,
                  total: 1,
                });
              } else if (eventType === "queue") {
                const pos = data.position;
                const msg =
                  typeof pos === "number" && pos > 0
                    ? `正在排队（第 ${pos} 位）`
                    : data.message || "正在排队";
                setProgress({
                  step: "queue",
                  message: msg,
                  current: 0,
                  total: 1,
                });
              } else if (eventType === "processing") {
                setProgress({
                  step: "processing",
                  message: data.message || "正在识别…",
                  current: 1,
                  total: 1,
                });
              } else if (eventType === "result") {
                result = data as AutochessRecognitionResult;
              } else if (eventType === "error") {
                errorMessage = data.message || "识别失败";
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        if (errorMessage) {
          setProgress({
            step: "失败",
            message: errorMessage,
            current: 0,
            total: 0,
          });
          setIsProcessing(false);
          toast.error(errorMessage);
          return;
        }

        if (!result) {
          setProgress({
            step: "失败",
            message: "未收到识别结果",
            current: 0,
            total: 0,
          });
          setIsProcessing(false);
          return;
        }

        setLastResult(result);
        setProgress({
          step: "done",
          message: "识别完成",
          current: 1,
          total: 1,
        });

        const annotatedUri = await drawAnnotatedImage(dataUrl, result);
        const id = crypto.randomUUID();
        uriMapRef.current.set(id, { originalUri: dataUrl, annotatedUri });
        onResult({ id, originalUri: dataUrl, annotatedUri, result });

        const TH = 0.4;
        const count =
          (result.roiResults?.filter((r) => (r.best?.score ?? 0) >= TH).length ??
            0) ||
          (result.enemyMatches?.filter((m) => m.score >= TH).length ?? 0);
        toast.success(`识别完成，共 ${count} 个结果`);

        setIsProcessing(false);
        if (!isDev) {
          setTimeout(() => setIsModalOpen(false), 1000);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setProgress({
            step: "idle",
            message: "已取消",
            current: 0,
            total: 0,
          });
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          setProgress({ step: "失败", message: msg, current: 0, total: 0 });
          toast.error(msg);
        }
        setIsProcessing(false);
      } finally {
        if (!isDev) {
          URL.revokeObjectURL(previewUrl);
          setPastedImagePreviewUrl(null);
        }
        abortControllerRef.current = null;
      }
    },
    [isProcessing, onResult],
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    return () => {
      for (const { originalUri, annotatedUri } of uriMapRef.current.values()) {
        if (originalUri.startsWith("blob:"))
          URL.revokeObjectURL(originalUri);
        if (annotatedUri.startsWith("blob:"))
          URL.revokeObjectURL(annotatedUri);
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

  const closeModal = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPastedImagePreviewUrl(null);
    setIsModalOpen(false);
  }, []);

  return {
    isProcessing,
    isModalOpen,
    progress,
    pastedImagePreviewUrl,
    lastResult,
    isDev,
    closeModal,
    revokeUri,
    cancel,
  };
}
