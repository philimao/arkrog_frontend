import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Modal, ModalBody, ModalContent } from "@heroui/react";
import { ImageUploadIcon } from "~/components/Icons";
import {
  FloatingPreview,
  type FloatingPreviewPos,
  type FloatingPreviewSize,
} from "./FloatingPreview";
import {
  recognizeMap,
  toMarkableNodes,
  ZoneUndetectedError,
  NoNodeDetectedError,
  type MarkableNode,
} from "./recognition/recognize";
import { OcrRequestError } from "./recognition/ocrClient";
import type { ConfidenceTone, RecognizeResult } from "./recognition/types";
import type { ZoneData } from "~/types/gameData";
import { intToRoman } from "~/utils/tools";

// 截图浮窗只在大屏幕上出现
function useIsLgScreen() {
  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsLg(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsLg(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isLg;
}

/** 焦点在输入框/可编辑元素里时不要抢它的粘贴，用户可能是在粘贴文字 */
function shouldIgnorePasteTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  return target.isContentEditable;
}

const toneClass: Record<ConfidenceTone, string> = {
  high: "text-[#26CA1D]",
  medium: "text-[#ee981f]",
  low: "text-ak-red",
  none: "text-light-mid-gray",
};

/** 候选自身匹配度（百分比）的高中低分档，用于给数值上色 —— 与整体可信度档位无关 */
export function percentTone(percent: number): ConfidenceTone {
  if (percent >= 85) return "high";
  if (percent >= 70) return "medium";
  return "low";
}

/** 供外层（基底缩略图网格）标记识别候选用的精简信息 */
export interface RecognitionCandidateInfo {
  mapId: string;
  matchPercent: number;
}

interface ScreenshotRecognizerProps {
  /** 该肉鸽主题的层列表，顺序即层序；层名用于从截图判定层数 */
  zones: ZoneData[];
  /** 层数识别失败时的兜底：用户当前手选的层 */
  currentZoneId: string;
  onMatched: (zone: string, mapId: string, nodes: MarkableNode[]) => void;
  /**
   * 用户选了"没有正确地图，取消"：之前自动填过的节点都要清掉。onNodesDetected
   * 给每个候选各自都预填过一份，不只是当前展示的那个，所以把这次识别涉及到的
   * 全部候选 mapId 都带出去，外层才能对着每一个都清干净
   */
  onCancel: (candidateMapIds: string[]) => void;
  /**
   * 本次识别结果（区域 + 候选列表，按分数降序）变化时通知外层，供"区域选择"和
   * 基底缩略图网格画标记；null 表示当前没有识别结果
   */
  onCandidatesChange: (
    result: { zone: string; candidates: RecognitionCandidateInfo[] } | null,
  ) => void;
  /**
   * 每个候选各自识别出的节点，在结果一出来时就为所有候选（不只是当前展示的
   * 那个）各自预填一份——这样有歧义、用户还没点候选列表时，只要手动切到某个
   * 候选对应的基底，也能直接看到识别结果，不用非得先点这边的候选按钮
   */
  onNodesDetected: (mapId: string, nodes: MarkableNode[]) => void;
}

/** 供外层在决定好"清除图片"到底要不要清（可能中间弹窗问用户）之后，回头真正清掉这边的预览状态 */
export interface ScreenshotRecognizerHandle {
  resetPreview: () => void;
}

/**
 * 截图识别：上传游戏内地图截图，**一次云 OCR 调用同时判出层数与基底**。
 *
 * 可信度为「高」时直接切过去并自动填入节点（实测该档基底正确率 100%）；
 * 中/低档则展示 Top-2 候选让用户二选一（实测判错时正确答案 100% 排在前二），
 * 选中后不立即收起，允许改选，由用户点确认才关闭。
 *
 * 全部推理在前端完成，后端只做 OCR 签名转发。本组件默认不渲染，由外层通过
 * localStorage 开关控制。
 */
export const ScreenshotRecognizer = forwardRef<
  ScreenshotRecognizerHandle,
  ScreenshotRecognizerProps
>(function ScreenshotRecognizer(
  {
    zones,
    currentZoneId,
    onMatched,
    onCancel,
    onCandidatesChange,
    onNodesDetected,
  },
  ref,
) {
  const isLgScreen = useIsLgScreen();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSample, setShowSample] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecognizeResult | null>(null);
  /** 用户已确认选择，收起候选区 */
  const [confirmed, setConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  // 主预览区是不是整个滚出了可视范围——是的话才浮一个小窗出来，主预览只要有
  // 一部分重新可见，浮窗就该消失（但"最小化"状态不消失，见下面 previewMinimized）
  const [previewOutOfView, setPreviewOutOfView] = useState(false);
  // 浮窗的最小化/位置/尺寸都跟随截图，不跟随挂载/卸载走——单纯滚动导致浮窗
  // 反复出现/消失不该把它们带回默认状态。pos/size 为 null 表示这张截图还没被
  // 摆放过，交给 FloatingPreview 在图片首次加载完时按长宽比自动定一次
  const [previewMinimized, setPreviewMinimized] = useState(false);
  const [previewPos, setPreviewPos] = useState<FloatingPreviewPos | null>(
    null,
  );
  const [previewSize, setPreviewSize] = useState<FloatingPreviewSize | null>(
    null,
  );

  useEffect(() => {
    setPreviewMinimized(false);
    setPreviewPos(null);
    setPreviewSize(null);
    if (!previewUrl) {
      setPreviewOutOfView(false);
      return;
    }
    const el = previewContainerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPreviewOutOfView(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewUrl]);

  // 候选列表变了就通知外层，让基底缩略图网格画标记；result 置空（新一轮识别开始/取消）时一并清空。
  // 只有 showCandidates 判定为"有歧义"时才把全部候选传出去（网格才会画 1/2 序号）——
  // 高可信度/已确认时哪怕 topCandidates 底层仍留着 2 条，UI 上也只认第一名，网格也只该标那一个
  useEffect(() => {
    if (!result) {
      onCandidatesChange(null);
      return;
    }
    const ambiguous =
      result.confidence.tone !== "high" &&
      result.topCandidates.length > 1 &&
      !confirmed;
    const candidates = ambiguous
      ? result.topCandidates
      : result.topCandidates.slice(0, 1);
    onCandidatesChange({
      zone: result.zone,
      candidates: candidates.map((c) => ({
        mapId: c.mapId,
        matchPercent: c.matchPercent,
      })),
    });
  }, [result, confirmed, onCandidatesChange]);

  const runRecognition = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setConfirmed(false);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return objectUrl;
      });

      try {
        const data = await recognizeMap(file, zones, {
          fallbackZone: currentZoneId,
        });
        setResult(data);

        // 有歧义时，非第一名的候选先各自预填一份，用户不管是从下面的候选列表
        // 点，还是直接去"基底"缩略图网格里手动切换，看到的都已经是识别结果。
        // 第一名不在这里填——马上就要 onMatched 切过去，那边会先检查这个基底
        // 是不是已经有用户自己填的节点，需要的话弹窗问"覆盖"还是"合并"，这里
        // 抢先填了那个判断就没意义了
        for (const candidate of data.topCandidates) {
          if (candidate.mapId === data.mapId) continue;
          onNodesDetected(
            candidate.mapId,
            toMarkableNodes(candidate.correctedNodes),
          );
        }
        // 切到第一名方便对照；节点交给 onMatched 决定怎么落
        onMatched(data.zone, data.mapId, toMarkableNodes(data.correctedNodes));
      } catch (err) {
        if (
          err instanceof OcrRequestError ||
          err instanceof ZoneUndetectedError ||
          err instanceof NoNodeDetectedError
        ) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [zones, currentZoneId, onMatched, onNodesDetected],
  );

  const pickCandidate = useCallback(
    (index: number) => {
      if (!result) return;
      const candidate = result.topCandidates[index];
      if (!candidate) return;
      onMatched(
        result.zone,
        candidate.mapId,
        toMarkableNodes(candidate.correctedNodes),
      );
    },
    [result, onMatched],
  );

  // "清除图片"按下去：地图那边可能有冲突要弹窗问用户，所以这里不能立刻清自己
  // 的预览状态——只是把候选 mapId 报给外层。外层决定"确实要清"了（可能没有
  // 冲突直接清，可能是用户在弹窗里选完了）才会通过 ref 调 resetPreview 真正清掉；
  // 用户如果在弹窗里选了"关闭"，这边的截图预览原样保留
  const requestClear = useCallback(() => {
    onCancel(result?.topCandidates.map((c) => c.mapId) ?? []);
  }, [onCancel, result]);

  // 真正回到最开始没上传过的状态，供外层通过 ref 调用
  const resetPreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResult(null);
    setError(null);
    setConfirmed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useImperativeHandle(ref, () => ({ resetPreview }), [resetPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void runRecognition(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void runRecognition(file);
  };

  // 剪贴板里粘贴一张图就直接开始识别，不用先存文件再手动选。全局监听而不是绑在
  // 上传框上——用户复制截图后未必会先点一下那个框，全局粘贴对用户来说更顺手
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (isLoading) return;
      if (shouldIgnorePasteTarget(event.target)) return;
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;
      const file = imageItem.getAsFile();
      if (!file) return;
      event.preventDefault();
      void runRecognition(file);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isLoading, runRecognition]);

  const best = result?.best;
  const zoneIndex = result ? zones.findIndex((z) => z.id === result.zone) : -1;
  const zoneLabel =
    zoneIndex >= 0
      ? `${intToRoman(zoneIndex + 1)} ${zones[zoneIndex].name}`
      : result?.zone;
  const showCandidates =
    !!result &&
    result.confidence.tone !== "high" &&
    result.topCandidates.length > 1 &&
    !confirmed;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* 上传截图 */}
      <div
        className="w-full lg:w-2/3 flex-shrink-0"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {previewUrl ? (
          <div
            ref={previewContainerRef}
            className="w-full flex justify-center bg-black-gray-70"
          >
            <img
              src={previewUrl}
              alt="预览"
              className="max-h-[calc(100vh*2/3)] object-contain"
            />
          </div>
        ) : (
          <div className="bg-black-gray w-full p-8 flex flex-col items-center gap-4">
            <ImageUploadIcon width={48} height={48} />
            <div className="text-md text-light-mid-gray">
              点击上传或者拖动/粘贴图片至此区域
            </div>
            <button
              className="bg-ak-blue font-bold text-xl text-black px-12 py-2"
              onClick={() => fileInputRef.current?.click()}
            >
              上传图片
            </button>
          </div>
        )}
      </div>

      {/* 截图结果 */}
      <div className="flex flex-col justify-between grow gap-3">
        <div className="flex flex-col gap-2">
          {!previewUrl && (
            <p className="text-md">
              请使用<span className="text-ak-red">地图界面完整截图</span>
              进行识别
              <span
                className="text-ak-blue underline cursor-pointer"
                onClick={() => setShowSample(true)}
              >
                （示例）
              </span>
              ，图片的尺寸、清晰度与遮挡情况会极大地影响识别结果。推荐在进入区域时截图以增加识图准确性。
            </p>
          )}

          {isLoading && <p className="font-bold text-2xl">识别中……</p>}

          {error && (
            <>
              <p className="font-bold text-2xl">未识别</p>
              <p className="text-md text-ak-red">{error}</p>
              <p className="text-light-mid-gray">
                请手动选择基底或重新上传截图
              </p>
            </>
          )}

          {result && best && !isLoading && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3">
                {(showCandidates
                  ? result.topCandidates
                  : result.topCandidates.slice(0, 1)
                ).map((candidate, index) => (
                  <button
                    key={candidate.mapId}
                    type="button"
                    onClick={() => pickCandidate(index)}
                    className="flex items-center justify-between gap-3 rounded text-left"
                  >
                    <div className="flex items-center gap-3">
                      {showCandidates && (
                        <span className="text-ak-blue">{index + 1} </span>
                      )}
                      <span className="font-bold text-2xl">
                        {zoneLabel} · {candidate.mapId}
                      </span>
                    </div>
                    <span
                      className={toneClass[percentTone(candidate.matchPercent)]}
                    >
                      {candidate.matchPercent}%
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-light-gray">
                {showCandidates ? (
                  <>
                    检测到{" "}
                    <span className="text-ak-blue">
                      {result.topCandidates.length}
                    </span>{" "}
                    个可能结果，请人工对照选择。
                  </>
                ) : (
                  "已自动切换并填入节点，可直接跟截图对照。"
                )}
              </p>
            </div>
          )}
        </div>

        {(previewUrl || error || result) && (
          <div className="flex gap-4">
            <button
              className="bg-ak-blue font-bold text-black px-8 py-2"
              onClick={() => fileInputRef.current?.click()}
            >
              重新上传
            </button>
            <button
              className="bg-light-mid-gray font-bold text-black px-8 py-2"
              onClick={requestClear}
            >
              清除图片
            </button>
          </div>
        )}
      </div>

      <Modal
        size="3xl"
        isOpen={showSample}
        onClose={() => setShowSample(false)}
      >
        <ModalContent>
          <ModalBody className="p-0">
            <img
              src="/images/map/map-sample.webp"
              alt="截图示例"
              className="w-full max-h-[70vh] object-contain rounded border border-default-200"
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {isLgScreen && previewUrl && previewOutOfView && (
        <FloatingPreview
          previewUrl={previewUrl}
          minimized={previewMinimized}
          onMinimizedChange={setPreviewMinimized}
          pos={previewPos}
          onPosChange={setPreviewPos}
          size={previewSize}
          onSizeChange={setPreviewSize}
        />
      )}
    </div>
  );
});
