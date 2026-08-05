import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronIcon } from "~/components/Icons";
import { NodeMapCanvas } from "./mapCanvas";
import { initialMaps, toGridState, type MapShorthand } from "./mapData";
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

const toneClass: Record<ConfidenceTone, string> = {
  high: "text-green-400 border-green-400/40 bg-green-400/10",
  medium: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  low: "text-red-400 border-red-400/40 bg-red-400/10",
  none: "text-gray-400 border-gray-400/40 bg-gray-400/10",
};

// NodeMapCanvas 是按 cellSize（像素/格）算出固定宽度上限的 SVG，不是纯靠容器
// 撑开的响应式布局——同一个 cellSize 在大屏并排、小屏堆叠这两种场景下没法
// 都合适：并排时想让它长得跟截图差不多高，堆叠时又想让它别占太多纵向空间。
// 一个数值满足不了两头，所以这里跟着断点切换 cellSize 本身。
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

interface ScreenshotRecognizerProps {
  /** 该肉鸽主题的层列表，顺序即层序；层名用于从截图判定层数 */
  zones: ZoneData[];
  /** 层数识别失败时的兜底：用户当前手选的层 */
  currentZoneId: string;
  onMatched: (zone: string, mapId: string, nodes: MarkableNode[]) => void;
  /** 用户选了"没有正确地图，取消"：之前挑候选时自动填过的节点也要一并清掉 */
  onCancel: () => void;
}

function MapPreview({
  map,
  cellSize = 22,
}: {
  map: MapShorthand;
  cellSize?: number;
}) {
  return (
    <NodeMapCanvas
      state={toGridState(map)}
      onToggle={() => {}}
      start={map.start ? { row: map.start[0], col: map.start[1] } : null}
      ends={map.ends ? map.ends.map((e) => ({ row: e[0], col: e[1] })) : null}
      battleEnd={
        map.battleEnd ? { row: map.battleEnd[0], col: map.battleEnd[1] } : null
      }
      knownBattles={
        map.knownBattles
          ? map.knownBattles.map((b) => ({ row: b[0], col: b[1] }))
          : null
      }
      knownShops={
        map.knownShops
          ? map.knownShops.map((s) => ({ row: s[0], col: s[1] }))
          : null
      }
      cellSize={cellSize}
      zone={map.zone}
      readOnly
    />
  );
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
export function ScreenshotRecognizer({
  zones,
  currentZoneId,
  onMatched,
  onCancel,
}: ScreenshotRecognizerProps) {
  const isLgScreen = useIsLgScreen();
  const [expanded, setExpanded] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecognizeResult | null>(null);
  /** 用户从候选里挑中的下标；null 表示还没挑过（此时展示的是第一名） */
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  /** 用户已确认选择，收起候选区 */
  const [confirmed, setConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runRecognition = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setPickedIndex(null);
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

        if (data.confidence.tone === "high") {
          // 高可信度：直接切过去并把节点也填上
          onMatched(
            data.zone,
            data.mapId,
            toMarkableNodes(data.correctedNodes),
          );
        } else {
          // 中/低：先把地图切到第一名方便对照，但不替用户填节点 ——
          // 等他从候选里明确选一个，再填那个候选对应的那套
          onMatched(data.zone, data.mapId, []);
        }
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
    [zones, currentZoneId, onMatched],
  );

  const pickCandidate = useCallback(
    (index: number) => {
      if (!result) return;
      const candidate = result.topCandidates[index];
      if (!candidate) return;
      setPickedIndex(index);
      onMatched(
        result.zone,
        candidate.mapId,
        toMarkableNodes(candidate.correctedNodes),
      );
    },
    [result, onMatched],
  );

  // 候选里没有一个是对的：撤回这次识别的展示状态，让用户自己回去手动选基底。
  // 地图之前为了方便对照已经被切过去了，用户接下来手动选基底本来就会覆盖掉，
  // 无需额外撤销；但如果之前挑过某个候选，那个候选自动填的节点还留在地图上，
  // 得靠 onCancel 让外层把这些自动填入的节点也清掉
  const cancelRecognition = useCallback(() => {
    setResult(null);
    setError(null);
    setPickedIndex(null);
    setConfirmed(false);
    onCancel();
  }, [onCancel]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void runRecognition(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void runRecognition(file);
  };

  const best = result?.best;
  const appliedMapId =
    result && pickedIndex !== null
      ? result.topCandidates[pickedIndex]?.mapId
      : result?.mapId;
  const appliedMap = appliedMapId
    ? initialMaps.find((m) => m.id === appliedMapId)
    : undefined;
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
  // 识别中/出错/出结果都占同一个"结果区"的位置，布局不会在这几个状态之间跳动——
  // 识别中先占好位置，结果出来后原地替换成结果内容
  const showSideBySide =
    isLoading || !!error || (!!result && !!best && !isLoading);

  return (
    <div className="mb-4 border border-mid-gray rounded-md bg-black-gray-70">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-ak-blue"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div>
          截图识别地图（实验性）
          <span className="text-xs text-light-gray">
            此功能仍在开发中，结果仅供参考
          </span>
        </div>
        <div className="flex gap-1 items-center">
          {expanded ? "收起" : "展开"}
          <ChevronIcon direction={expanded ? "up" : "down"} />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          <div
            className={`flex flex-col gap-3 ${
              showSideBySide ? "lg:flex-row lg:items-start" : ""
            }`}
          >
            <div
              className={`border-2 border-dashed border-mid-gray rounded-md p-4 text-center cursor-pointer hover:border-ak-blue transition-colors ${
                showSideBySide ? "lg:w-[480px] lg:shrink-0" : "w-full"
              }`}
              onClick={() => fileInputRef.current?.click()}
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
                <img
                  src={previewUrl}
                  alt="预览"
                  className="max-h-52 lg:max-h-[480px] w-full rounded object-contain"
                />
              ) : (
                <div className="text-sm text-light-gray">
                  点击选择地图截图，或拖拽到此处
                </div>
              )}
            </div>

            {showSideBySide && (
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                {isLoading && (
                  <div className="text-center text-light-gray py-2">
                    识别中……
                  </div>
                )}

                {error && (
                  <div className="text-center text-sm text-red-400 py-2 border border-red-400/30 rounded bg-red-400/10">
                    {error}
                  </div>
                )}

                {result && best && !isLoading && (
                  <>
                    {result.lowDensity && (
                      <div className="text-sm text-yellow-400 py-2 px-3 border border-yellow-400/30 rounded bg-yellow-400/10">
                        截图信息不足，请截取完整地图后重试 —— 当前只识别到{" "}
                        {result.stats.labels}{" "}
                        个节点，覆盖率偏低，结果很可能不准。
                      </div>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      {/* <span className="bg-black-gray-70 px-1 text-sm text-white">{zoneLabel}</span> */}
                      <span className="text-lg font-bold text-ak-blue">
                        {zoneLabel} · {appliedMapId}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${toneClass[result.confidence.tone]}`}
                      >
                        可信度：{result.confidence.text}
                      </span>
                      <div className="text-sm text-light-gray">
                        {result.confidence.tone === "high"
                          ? "已自动切换并填入节点，可直接跟截图对照。"
                          : showCandidates
                            ? "检测到两个可能结果，请从下方选择确认。"
                            : "已切换并填入节点，可直接跟截图对照。若不正确请手动选择。"}
                      </div>
                    </div>

                    {showCandidates ? (
                      <div className="space-y-4 border border-mid-gray rounded p-2">
                        <div className="text-sm text-light-gray">
                          可以反复切换对照，确认无误再关闭。
                        </div>
                        <div className="grid grid-cols-[repeat(2,minmax(0,220px))] gap-3">
                          {result.topCandidates.map((candidate, index) => {
                            const map = initialMaps.find(
                              (m) => m.id === candidate.mapId,
                            );
                            if (!map) return null;
                            const active = pickedIndex === index;
                            return (
                              <div
                                key={candidate.mapId}
                                role="button"
                                onClick={() => pickCandidate(index)}
                                className={`relative min-w-0 p-2 bg-black-gray cursor-pointer border rounded ${
                                  active
                                    ? "border-ak-blue"
                                    : "border-transparent hover:border-mid-gray"
                                }`}
                              >
                                {active && (
                                  <CheckIcon className="absolute top-2 right-2 text-ak-blue" />
                                )}
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`font-bold ${active ? "text-ak-blue" : ""}`}
                                  >
                                    {candidate.mapId}
                                  </span>
                                  {index === 0 && (
                                    <span className="text-xs text-light-gray">
                                      推荐
                                    </span>
                                  )}
                                </div>
                                <MapPreview map={map} />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            className="text-sm px-3 py-1 border border-ak-blue text-ak-blue rounded hover:bg-ak-blue/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={pickedIndex === null}
                            onClick={() => setConfirmed(true)}
                          >
                            {pickedIndex === null
                              ? "请选择一个地图"
                              : "确认，关闭候选"}
                          </button>
                          <button
                            type="button"
                            className="text-sm px-3 py-1 border border-mid-gray text-mid-gray rounded hover:border-light-gray hover:text-light-gray"
                            onClick={cancelRecognition}
                          >
                            没有正确地图，取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      appliedMap && (
                        <div className="p-2 bg-black-gray w-fit flex items-center justify-center">
                          <MapPreview map={appliedMap} cellSize={28} />
                        </div>
                      )
                    )}

                    {/* {import.meta.env.DEV && (
                    <div className="pt-2 border-t border-mid-gray/50">
                      <div className="text-xs text-light-gray mb-1">
                        [DEV ONLY] 文字节点 {result.stats.labels} / 空白点{" "}
                        {result.stats.blanks} / 密度{" "}
                        {(result.stats.occupiedRatio * 100).toFixed(0)}% / margin{" "}
                        {result.marginRatio === null
                          ? "null"
                          : `${(result.marginRatio * 100).toFixed(2)}%`}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.correctedNodes
                          .filter((n) => !n.corrected && !n.unresolved)
                          .map((n) => (
                            <span
                              key={`${n.row},${n.col}`}
                              className={`text-xs px-1.5 py-0.5 rounded border ${
                                n.label
                                  ? "text-gray-300 border-gray-400/40 bg-gray-400/10"
                                  : "text-gray-500 border-gray-600/40 bg-gray-600/10"
                              }`}
                            >
                              ({n.row},{n.col}) {n.label ?? "(空白)"}
                            </span>
                          ))}
                      </div>
                    </div>
                  )} */}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
