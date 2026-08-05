import { useCallback, useRef, useState } from "react";
import { ChevronIcon } from "~/components/Icons";
import { NodeMapCanvas } from "./mapCanvas";
import { initialMaps, toGridState } from "./mapData";
import { recognizeMap, confidenceOf } from "./recognition/recognize";
import { ZoneUndetectedError, NoNodeDetectedError } from "./recognition/recognize";
import { OcrRequestError } from "./recognition/ocrClient";
import { ANCHOR_LABELS } from "./recognition/vocab";
import type { ConfidenceTone, RecognizeResult } from "./recognition/types";
import type { ZoneData } from "~/types/gameData";
import { intToRoman } from "~/utils/tools";

const toneClass: Record<ConfidenceTone, string> = {
  high: "text-green-400 border-green-400/40 bg-green-400/10",
  medium: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  low: "text-red-400 border-red-400/40 bg-red-400/10",
  none: "text-gray-400 border-gray-400/40 bg-gray-400/10",
};

export interface ConfidentNode {
  row: number;
  col: number;
  label: string;
}

interface ScreenshotRecognizerProps {
  /** 该肉鸽主题的层列表，顺序即层序；层名用于从截图判定层数 */
  zones: ZoneData[];
  /** 层数识别失败时的兜底：用户当前手选的层 */
  currentZoneId: string;
  onMatched: (zone: string, mapId: string, confidentNodes: ConfidentNode[]) => void;
}

/**
 * 自动标记节点的准确率还不够（整体基底匹配 96.3%，但单个节点标签的正确率未单独
 * 验证），暂时关掉——代码保留，之后验证过再打开。关闭后只切层/切地图，不标节点。
 */
const AUTO_MARK_NODES_ENABLED = false;

/**
 * 截图识别：上传游戏内地图截图，**一次云 OCR 调用同时判出层数与基底**，
 * 命中后回调 onMatched 让外层切过去，方便用户跟自己的截图对照。
 *
 * 全部推理在前端完成，后端只做 OCR 签名转发。本组件默认不渲染，由外层通过
 * localStorage 开关控制。
 */
export function ScreenshotRecognizer({
  zones,
  currentZoneId,
  onMatched,
}: ScreenshotRecognizerProps) {
  const [expanded, setExpanded] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecognizeResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runRecognition = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return objectUrl;
      });

      try {
        const data = await recognizeMap(file, zones, { fallbackZone: currentZoneId });
        setResult(data);

        // 只把「有把握」的节点自动标记上：坐标没经过修正、不是空白点、也不是
        // 结构性锚点（锚点在地图上由 ends/battleEnd 单独画出，不能当可标记节点）
        const confidentNodes: ConfidentNode[] = AUTO_MARK_NODES_ENABLED
          ? data.correctedNodes
              .filter(
                (n): n is typeof n & { label: string } =>
                  !!n.label && !n.corrected && !n.unresolved && !ANCHOR_LABELS[n.label],
              )
              .map((n) => ({ row: n.row, col: n.col, label: n.label }))
          : [];
        onMatched(data.zone, data.mapId, confidentNodes);
      } catch (err) {
        if (err instanceof OcrRequestError && err.status === 429) {
          setError(err.message);
        } else if (err instanceof ZoneUndetectedError || err instanceof NoNodeDetectedError) {
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
  const bestMap = best ? initialMaps.find((m) => m.id === best.mapId) : undefined;
  const zoneIndex = result ? zones.findIndex((z) => z.id === result.zone) : -1;
  const zoneLabel =
    zoneIndex >= 0 ? `${intToRoman(zoneIndex + 1)} ${zones[zoneIndex].name}` : result?.zone;

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
            className="border-2 border-dashed border-mid-gray rounded-md p-4 text-center cursor-pointer hover:border-ak-blue transition-colors"
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
              <img src={previewUrl} alt="预览" className="max-h-40 mx-auto rounded" />
            ) : (
              <div className="text-sm text-light-gray">
                点击选择地图截图，或拖拽到此处
                <span className="text-ak-blue">（层数会自动识别，无需先选层）</span>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="text-center text-light-gray py-2">识别中……</div>
          )}

          {error && (
            <div className="text-center text-sm text-red-400 py-2 border border-red-400/30 rounded bg-red-400/10">
              {error}
            </div>
          )}

          {result && best && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm px-2 py-0.5 rounded border text-ak-blue border-ak-blue/40 bg-ak-blue/10">
                  {zoneLabel}
                </span>
                <span className="text-lg font-bold text-ak-blue">{best.mapId}</span>
                {(() => {
                  const c = confidenceOf(
                    result.hasAnchor,
                    best.outOfBounds,
                    result.marginRatio,
                    best.anchorScore === best.anchorTotal,
                  );
                  return (
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${toneClass[c.tone]}`}
                    >
                      可信度：{c.text}
                    </span>
                  );
                })()}
                <div className="text-sm text-light-gray">
                  已自动切换，可直接跟截图对照。若识别不正确，请手动选择层数与基底。
                </div>
              </div>

              {bestMap && (
                <div className="p-2 bg-black-gray w-fit">
                  <NodeMapCanvas
                    state={toGridState(bestMap)}
                    onToggle={() => {}}
                    start={
                      bestMap.start
                        ? { row: bestMap.start[0], col: bestMap.start[1] }
                        : null
                    }
                    ends={
                      bestMap.ends
                        ? bestMap.ends.map((en) => ({ row: en[0], col: en[1] }))
                        : null
                    }
                    battleEnd={
                      bestMap.battleEnd
                        ? { row: bestMap.battleEnd[0], col: bestMap.battleEnd[1] }
                        : null
                    }
                    knownBattles={
                      bestMap.knownBattles
                        ? bestMap.knownBattles.map((b) => ({ row: b[0], col: b[1] }))
                        : null
                    }
                    knownShops={
                      bestMap.knownShops
                        ? bestMap.knownShops.map((s) => ({ row: s[0], col: s[1] }))
                        : null
                    }
                    cellSize={26}
                    zone={bestMap.zone}
                    readOnly
                  />
                </div>
              )}

              {import.meta.env.DEV && (
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
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
