import { useCallback, useRef, useState } from "react";
import { ChevronIcon } from "~/components/Icons";
import { NodeMapCanvas } from "./mapCanvas";
import { initialMaps, toGridState } from "./mapData";

export interface MapMatchCandidateResult {
  mapId: string;
  offset: { dr: number; dc: number };
  anchorScore: number;
  anchorTotal: number;
  edgeHits: number;
  edgeTotal: number;
  cellHits: number;
  cellTotal: number;
  outOfBounds: number;
}

export interface CorrectedNode {
  row: number;
  col: number;
  label: string | null;
  corrected: boolean;
  unresolved?: boolean;
}

export interface MapMatchResult {
  zone: string;
  hasAnchor: boolean;
  detectedNodes: { row: number; col: number; label: string | null }[];
  candidates: MapMatchCandidateResult[];
  best: MapMatchCandidateResult | null;
  correctedNodes: CorrectedNode[];
  marginRatio: number | null;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

// 没检测到险路尽头/险路恶敌这个锚点时，没有任何基准点可以对齐坐标系，
// 只能穷举所有平移量、纯靠连线/格子命中率打分——这种结果不能标"可信度：高/中/低"，
// 那样会显得像一个正常给出的结论，容易误导用户。必须明确标成"无法确认"。
//
// 可信度不是看 edgeRate 这类绝对命中率——即使这次识别、这次选的地图完全
// 正确，edgeRate 也很难摸到 90%+：迷宫本身就存在"两个节点格子相邻、但没有
// 路连着"的情况，这部分天然不可能命中，edgeRate 的天花板本来就低（实测正确
// 结果普遍也就 60%~80%）。真正该看的是"这次匹配有没有歧义"：best 跟"最像
// 的、但地图不一样"的候选比，分数差距占 best 自身分数的比例（marginRatio）
// ——差距越大，说明越不可能选错成别的地图。用 ~80 张真实截图实测校准出
// 0.5% / 2% 这两档分界（低于 0.5% 时正确率明显下降，高于 2% 后几乎都对）。
function confidenceLabel(
  candidate: MapMatchCandidateResult,
  hasAnchor: boolean,
  marginRatio: number | null,
): {
  text: string;
  tone: "high" | "medium" | "low" | "none";
} {
  if (!hasAnchor) {
    return { text: "无法确认（未检测到锚点）", tone: "none" };
  }
  const anchorOk = candidate.anchorScore === candidate.anchorTotal;
  if (!anchorOk || marginRatio === null) {
    return { text: "低", tone: "low" };
  }
  if (candidate.outOfBounds === 0 && marginRatio >= 0.02) {
    return { text: "高", tone: "high" };
  }
  if (candidate.outOfBounds <= 1 && marginRatio >= 0.005) {
    return { text: "中", tone: "medium" };
  }
  return { text: "低", tone: "low" };
}

const toneClass: Record<"high" | "medium" | "low" | "none", string> = {
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
  zone: string;
  zoneLabel: string;
  onMatched: (mapId: string, confidentNodes: ConfidentNode[]) => void;
}

// 结构性锚点（险路尽头/险路恶敌）不是可标记的节点类型，地图上是用 ends/battleEnd
// 单独画出来的，不需要、也不能通过 markedNodes 去标记
const ANCHOR_LABELS = new Set(["险路尽头", "险路恶敌"]);

// 自动标记节点这个功能准确率还不够，暂时关掉——代码保留，之后识别准确率
// 提上来了再打开。关闭后只切地图、不自动标节点。
const AUTO_MARK_NODES_ENABLED = false;

/**
 * 截图识别：上传游戏内地图截图，自动识别匹配到 initialMaps 里的哪张基底，
 * 命中后回调 onMatched 让外层直接把大地图切过去，方便用户跟自己的截图对照。
 * 自动标记节点见 AUTO_MARK_NODES_ENABLED；识别基于 OCR 文字，仍处于实验
 * 阶段，结果仅供参考。本组件默认不渲染，由外层通过 localStorage 开关控制。
 */
export function ScreenshotRecognizer({
  zone,
  zoneLabel,
  onMatched,
}: ScreenshotRecognizerProps) {
  const [expanded, setExpanded] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MapMatchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runRecognition = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const dataUrl = await fileToDataUrl(file);
        setPreviewUrl(dataUrl);

        const apiBase =
          (import.meta.env.VITE_API_BASE_URL as string)?.trim() || "";
        const response = await fetch(`${apiBase}/map-recognition/match`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl, zone }),
        });

        const json = await response.json();
        if (!response.ok || json.code !== 0) {
          throw new Error(json.message || "识别失败");
        }
        const data = json.data as MapMatchResult;
        setResult(data);
        // 没锚点的结果是纯猜测，不该拿去自动切换大地图——那样会让用户误以为
        // 这是一个有把握的结论
        if (data.best && data.hasAnchor) {
          // 只把"有把握"的节点（坐标没经过修正、且不是空白点/结构性锚点）
          // 自动标记上——修正过的、无法修正的都可能是识别有误，不该替用户
          // 悄悄标上去。AUTO_MARK_NODES_ENABLED 关闭时直接传空数组，只切地图不标节点。
          const confidentNodes: ConfidentNode[] = AUTO_MARK_NODES_ENABLED
            ? data.correctedNodes
                .filter(
                  (n): n is typeof n & { label: string } =>
                    !!n.label &&
                    !n.corrected &&
                    !n.unresolved &&
                    !ANCHOR_LABELS.has(n.label),
                )
                .map((n) => ({ row: n.row, col: n.col, label: n.label }))
            : [];
          onMatched(data.best.mapId, confidentNodes);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [zone, onMatched],
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
              <img
                src={previewUrl}
                alt="预览"
                className="max-h-40 mx-auto rounded"
              />
            ) : (
              <div className="text-sm text-light-gray">
                点击选择当前 <span className="text-ak-blue">{zoneLabel}</span>{" "}
                的地图截图，或拖拽到此处
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

          {result && !isLoading && (
            <div className="space-y-2">
              {result.hasAnchor && best ? (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg font-bold text-ak-blue">
                      {best.mapId}
                    </span>
                    {(() => {
                      const c = confidenceLabel(best, result.hasAnchor, result.marginRatio);
                      return (
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${toneClass[c.tone]}`}
                        >
                          可信度：{c.text}
                        </span>
                      );
                    })()}
                    <div className="text-sm text-light-gray">
                      已自动切换地图，可直接跟截图对照。若识别不正确，请手动选择基底。
                    </div>
                  </div>
                  {(() => {
                    const bestMap = initialMaps.find(
                      (m) => m.id === best.mapId,
                    );
                    if (!bestMap) return null;
                    return (
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
                              ? bestMap.ends.map((en) => ({
                                  row: en[0],
                                  col: en[1],
                                }))
                              : null
                          }
                          battleEnd={
                            bestMap.battleEnd
                              ? {
                                  row: bestMap.battleEnd[0],
                                  col: bestMap.battleEnd[1],
                                }
                              : null
                          }
                          knownBattles={
                            bestMap.knownBattles
                              ? bestMap.knownBattles.map((b) => ({
                                  row: b[0],
                                  col: b[1],
                                }))
                              : null
                          }
                          knownShops={
                            bestMap.knownShops
                              ? bestMap.knownShops.map((s) => ({
                                  row: s[0],
                                  col: s[1],
                                }))
                              : null
                          }
                          cellSize={26}
                          zone={bestMap.zone}
                          readOnly
                        />
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg font-bold text-ak-red">
                    未能成功识别地图
                  </span>
                  <span className="text-sm text-light-gray">
                    请手动选择基底，或更换截图重试
                  </span>
                </div>
              )}
              {import.meta.env.DEV && (
                <div className="pt-2 border-t border-mid-gray/50">
                  <div className="text-xs text-light-gray mb-1">
                    [DEV ONLY] 识别到的节点列表（准确率堪忧）
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {result.correctedNodes
                      .filter((n) => !n.corrected && !n.unresolved)
                      .map((n) => {
                        const tone = n.label
                          ? "text-gray-300 border-gray-400/40 bg-gray-400/10"
                          : "text-gray-500 border-gray-600/40 bg-gray-600/10";
                        return (
                          <span
                            key={`${n.row},${n.col}`}
                            className={`text-xs px-1.5 py-0.5 rounded border ${tone}`}
                          >
                            ({n.row},{n.col}) {n.label ?? "(空白)"}
                          </span>
                        );
                      })}
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
