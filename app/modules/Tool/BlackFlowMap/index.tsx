import { useEffect, useState } from "react";
import Loading from "~/components/Loading";
import { useGameDataStore } from "~/stores/gameDataStore";
import { useNodeGrid } from "./useNodeGrid";
import { NodeMapCanvas } from "./mapCanvas";
import { ScreenshotRecognizer } from "./ScreenshotRecognizer";
import {
  toGridState,
  initialMaps,
  nodeOptions,
  nodeTypeLimits,
  zoneNotes,
} from "./mapData";
import type { ZoneData, ZoneOfRogue } from "~/types/gameData";
import { intToRoman } from "~/utils/tools";
import { ChevronIcon } from "~/components/Icons";
import type { Route } from "./+types/index";

// 截图识别功能默认隐藏，通过这个 localStorage key 记住是否已手动开启。
const SHOW_RECOGNIZER_KEY = "show-map-recognizer";

declare global {
  interface Window {
    enableMapRecognizer?: () => void;
    disableMapRecognizer?: () => void;
  }
}

// 该地图渲染依赖大量动态 DOM 节点（节点网格、选项列表），且切换区域时变动量很大；
// 浏览器翻译插件等外部脚本可能在此时抢改 DOM 引发 removeChild 报错。
// 用局部边界兜住，避免整站被带崩到 root.tsx 的全局错误页。
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const details =
    import.meta.env.DEV && error instanceof Error ? error.message : undefined;

  return (
    <div className="w-full text-center pt-[20vh] text-xl">
      地图渲染出错，请刷新页面重试
      {details && (
        <pre className="mt-4 text-sm whitespace-pre-wrap text-left">
          {"<DEV ONLY> Error message: " + details}
        </pre>
      )}
    </div>
  );
}

function Notice({ children }: { children: string }) {
  return (
    <div className="w-full text-center pt-[20vh] text-xl font-bold text-ak-blue">
      {children}
    </div>
  );
}

export default function BlackFlowMapWrapper() {
  const { zones, basicLoaded, basicError, fetchGameDataBasic } =
    useGameDataStore();

  // 本页是 ToolLayout 下与 /tool 索引页平级的兄弟路由，蹭不到索引页的加载闸门；
  // 而 RootLayout 的 preload 只在首屏挂载时跑一次，站内跳转进来不会补拉，故自行拉取
  useEffect(() => {
    void fetchGameDataBasic();
  }, [fetchGameDataBasic]);

  // 必须先守卫再解引用：bundle 未加载时 zones 为 undefined
  const zonesOfRogue6 = zones?.["rogue_6"];
  if (!zonesOfRogue6) {
    // store 已重试过一轮（含绕缓存），仍失败就别再转圈了
    if (basicError) return <Notice>游戏数据加载失败，请刷新页面重试</Notice>;
    if (basicLoaded) return <Notice>暂无黑流树海数据</Notice>;
    return <Loading />;
  }

  return <BlackFlowMap zones={zonesOfRogue6} />;
}

function BlackFlowMap({ zones }: { zones: ZoneOfRogue }) {
  const zoneOfRogue: ZoneData[] = Object.values(zones).slice(0, 5);
  const { toggle, load } = useNodeGrid(toGridState(initialMaps[0]));
  const [currentZoneId, setCurrentZoneId] = useState<string>(
    zoneOfRogue[0]?.id || "",
  );
  const [selectedMapId, setSelectedMapId] = useState<string>(
    initialMaps[0]?.id || "",
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [highlightRange, setHighlightRange] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [markedNodes, setMarkedNodes] = useState<Record<string, string>>({});
  const currentMap = initialMaps.find((m) => m.id === selectedMapId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showZoneNotes, setShowZoneNotes] = useState(false);
  const [showBaseMaps, setShowBaseMaps] = useState(true);
  const [showScreenshotRecognizer, setShowScreenshotRecognizer] = useState(false);

  // 截图识别功能还在打磨阶段，默认对所有用户隐藏；开发/内部想临时体验时，
  // 在浏览器控制台敲 enableMapRecognizer() 即可（会记住选择，刷新也生效），
  // disableMapRecognizer() 关掉。不接普通用户能看到的入口。
  useEffect(() => {
    setShowScreenshotRecognizer(window.localStorage.getItem(SHOW_RECOGNIZER_KEY) === "1");
    window.enableMapRecognizer = () => {
      window.localStorage.setItem(SHOW_RECOGNIZER_KEY, "1");
      window.location.reload();
    };
    window.disableMapRecognizer = () => {
      window.localStorage.removeItem(SHOW_RECOGNIZER_KEY);
      window.location.reload();
    };
  }, []);

  const visibleOptions = nodeOptions.filter(
    (option) =>
      option.steps.filter((s) => s.zone === currentZoneId && s.max && s.min)
        .length > 0,
  );

  const handleNodeClick = (row: number, col: number) => {
    setSelectedNode({ row, col });
  };

  const handleOptionClick = (option: (typeof nodeOptions)[number]) => {
    if (selectedOptionId === option.id) {
      setSelectedOptionId("");
      setHighlightRange(null);
      return;
    }

    const step = option.steps.find((s) => s.zone === currentZoneId);
    setSelectedOptionId(option.id);
    setHighlightRange(
      step && step.min && step.max ? { min: step.min, max: step.max } : null,
    );
  };

  const handleMarkNodeAt = (row: number, col: number, optionId: string) => {
    const key = `${row},${col}`;
    setMarkedNodes((prev) => {
      const next = { ...prev };
      if (next[key] === optionId) {
        delete next[key];
      } else {
        next[key] = optionId;
      }
      return next;
    });
    setSelectedNode(null);
  };

  const getOptionLimit = (optionId: string) => {
    const option = nodeOptions.find((opt) => opt.id === optionId);
    return option?.steps.find((step) => step.zone === currentZoneId)
      ?.maxAllowed;
  };

  // const getTypeLimit = (type: string) => {
  //   const entry = nodeTypeLimits.find((limit) => limit.type === type);
  //   return entry?.steps.find((step) => step.zone === currentZoneId)?.maxAllowed;
  // };

  const getSidebarCounts = () => {
    const optionCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();

    const add = (optionId: string, type: string, amount = 1) => {
      optionCounts.set(optionId, (optionCounts.get(optionId) || 0) + amount);
      typeCounts.set(type, (typeCounts.get(type) || 0) + amount);
    };

    if (currentMap?.knownBattles?.length) {
      add("battle_normal", "battle", currentMap.knownBattles.length);
    }
    if (currentMap?.knownShops?.length) {
      add("shop", "other", currentMap.knownShops.length);
    }

    for (const id of Object.values(markedNodes)) {
      const option = nodeOptions.find((opt) => opt.id === id);
      if (!option) continue;
      add(id, option.type);
    }

    return { optionCounts, typeCounts };
  };

  const renderNodeOptions = () => {
    const { optionCounts, typeCounts } = getSidebarCounts();

    return visibleOptions.map((option) => {
      const isActive = selectedOptionId === option.id;
      const optionLimit = getOptionLimit(option.id);
      const currentOptionCount = optionCounts.get(option.id) || 0;
      const optionFull =
        optionLimit !== undefined && currentOptionCount >= optionLimit;
      // const typeLimit = getTypeLimit(option.type);
      const currentTypeCount = typeCounts.get(option.type) || 0;
      // const typeFull = typeLimit !== undefined && currentTypeCount >= typeLimit;
      const disabled = optionFull; // || typeFull;
      const note = optionFull
        ? `已达${option.name}标记上限`
        : // : typeFull
          //   ? `已达到${option.type === "battle" ? "凶戾类节点" : "诡秘类节点"}标记上限`
          "";

      return (
        <div
          className={`flex items-center rounded-md border-2 ${
            isActive
              ? "border-ak-blue bg-ak-blue/10"
              : "border-mid-gray bg-black-gray"
          } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          role="button"
          key={option.id}
          onClick={() => {
            if (!disabled) handleOptionClick(option);
          }}
          style={{ cursor: disabled ? "not-allowed" : "pointer" }}
          aria-disabled={disabled}
        >
          <img
            src={`/images/map/${option.id}.webp`}
            className="w-12 h-12 aspect-square"
          />
          <div className="flex flex-col justify-center">
            <span>{option.name}</span>
            {note ? (
              <span className="text-xs text-white/60 pb-[1px] pr-[2px]">
                {note}
              </span>
            ) : null}
          </div>
        </div>
      );
    });
  };

  const selectedNodeKey = selectedNode
    ? `${selectedNode.row},${selectedNode.col}`
    : null;
  const highlightOptionType = selectedOptionId
    ? nodeOptions.find((o) => o.id === selectedOptionId)?.type || null
    : null;

  return (
    <div className="relative">
      {/* 区域选择 */}
      <div className="mb-4 mt-2 grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
        {zoneOfRogue.map((zone, index) => (
          <div
            key={zone.id}
            className={
              "text-center font-bold leading-[2rem] p-1 " +
              `${currentZoneId === zone.id ? "bg-ak-blue text-black" : "bg-black-gray text-white"}`
            }
            role="button"
            onClick={() => {
              setCurrentZoneId(zone.id);
              const nextMap = initialMaps.find((m) => m.zone === zone.id);
              setSelectedMapId(nextMap?.id || "");
              setSelectedOptionId("");
              setHighlightRange(null);
              setSelectedNode(null);
              setMarkedNodes({});
              setMenuOpen(false);
              load(toGridState(nextMap || initialMaps[0]));
              setShowZoneNotes(false);
              setShowBaseMaps(true);
            }}
          >
            {intToRoman(index + 1)} {zone.name}
          </div>
        ))}
      </div>

      <div className="mb-4">
        {showScreenshotRecognizer && (
          <ScreenshotRecognizer
            zones={zoneOfRogue}
            currentZoneId={currentZoneId}
            onMatched={(zone, mapId, markableNodes) => {
              const matched = initialMaps.find((m) => m.id === mapId);
              if (!matched) return;
              // 层数也是识别出来的，可能跟用户当前选中的层不同，一并切过去
              setCurrentZoneId(zone);
              setShowZoneNotes(false);
              setShowBaseMaps(true);
              setSelectedMapId(mapId);
              // 把识别出来、有把握的节点自动标记上，代替用户手动一个个点选
              const nextMarkedNodes: Record<string, string> = {};
              for (const n of markableNodes) {
                const option = nodeOptions.find((opt) => opt.name === n.label);
                if (option) nextMarkedNodes[`${n.row},${n.col}`] = option.id;
              }
              setMarkedNodes(nextMarkedNodes);
              setSelectedOptionId("");
              setHighlightRange(null);
              setSelectedNode(null);
              setMenuOpen(false);
              load(toGridState(matched));
            }}
          />
        )}
      </div>

      <div>
        {/* 基底选择 */}
        <div className="mb-8">
          <button
            type="button"
            className="w-full flex items-center justify-between mb-2"
            onClick={() => setShowBaseMaps((prev) => !prev)}
          >
            <span className="font-bold text-xl">基底（暂不支持追忆）</span>
            <div className="flex gap-1 items-center">
              {showBaseMaps ? "收起" : "展开"}
              <ChevronIcon
                direction={showBaseMaps ? "up" : "down"}
                className="w-4 h-4 text-white"
              />
            </div>
          </button>
          {showBaseMaps && (
            <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 grow">
              {initialMaps
                .filter((m) => m.zone === currentZoneId)
                .map((m) => {
                  const isSelected = selectedMapId === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`p-2 bg-black-gray border-2 ${isSelected ? "border-ak-blue" : "border-transparent"} cursor-pointer`}
                      onClick={() => {
                        setSelectedMapId(m.id);
                        setMarkedNodes({});
                        setSelectedOptionId("");
                        setHighlightRange(null);
                        setSelectedNode(null);
                        setMenuOpen(false);
                      }}
                    >
                      <NodeMapCanvas
                        state={toGridState(m)}
                        onToggle={() => {}}
                        start={
                          m?.start ? { row: m.start[0], col: m.start[1] } : null
                        }
                        ends={
                          m?.ends
                            ? m.ends.map((en) => ({ row: en[0], col: en[1] }))
                            : null
                        }
                        battleEnd={
                          m?.battleEnd
                            ? { row: m.battleEnd[0], col: m.battleEnd[1] }
                            : null
                        }
                        knownBattles={
                          m?.knownBattles
                            ? m.knownBattles.map((b) => ({
                                row: b[0],
                                col: b[1],
                              }))
                            : null
                        }
                        knownShops={
                          m?.knownShops
                            ? m.knownShops.map((s) => ({
                                row: s[0],
                                col: s[1],
                              }))
                            : null
                        }
                        cellSize={20}
                        zone={m.zone}
                        readOnly
                      />
                      <div
                        className={`font-bold text-center ${isSelected ? "text-ak-blue" : "text-white"}`}
                      >
                        {m.id}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* 大地图 */}
        <h3 className="font-bold text-xl mb-2">地图</h3>
        <div
          className="grow p-4"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, .4)), url('/images/map/rogue_6_map_${currentZoneId}.webp')`,
          }}
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 节点选择 */}
            <div className="bg-black-gray-70 rounded-md p-2 lg:w-[324px] lg:min-w-[324px]">
              <div className="grid w-full gap-2 grid-cols-2 sm:grid-cols-4 lg:grid-cols-2">
                {renderNodeOptions()}
              </div>
            </div>

            {/* 地图 */}
            <div className="flex flex-col w-full items-center relative gap-4">
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-1"
                  onClick={() => setShowZoneNotes((prev) => !prev)}
                >
                  <img
                    className="h-12 w-auto"
                    src={`/images/map/${currentZoneId}.png`}
                  />
                  <ChevronIcon
                    direction={showZoneNotes ? "up" : "down"}
                    className="w-3 h-3 text-white"
                  />
                </button>
                {showZoneNotes && (
                  <ul className="absolute list-disc rounded-md bg-black-gray top-full left-1/2 -translate-x-1/2 z-10 mt-2 w-max max-w-[90vw] space-y-1 pl-6 pr-2 py-2 leading-6 border border-mid-gray text-sm text-white shadow-lg">
                    {zoneNotes[currentZoneId]?.split("\n").map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
              <NodeMapCanvas
                state={toGridState(currentMap || initialMaps[0])}
                onToggle={toggle}
                onNodeClick={handleNodeClick}
                selectedNodeKey={selectedNodeKey}
                start={
                  currentMap?.start
                    ? {
                        row: currentMap.start[0] || 0,
                        col: currentMap.start[1] || 0,
                      }
                    : null
                }
                ends={
                  currentMap?.ends
                    ? currentMap.ends.map((en) => ({ row: en[0], col: en[1] }))
                    : null
                }
                battleEnd={
                  currentMap?.battleEnd
                    ? {
                        row: currentMap.battleEnd[0],
                        col: currentMap.battleEnd[1],
                      }
                    : null
                }
                knownBattles={
                  currentMap?.knownBattles
                    ? currentMap.knownBattles.map((b) => ({
                        row: b[0],
                        col: b[1],
                      }))
                    : null
                }
                knownShops={
                  currentMap?.knownShops
                    ? currentMap.knownShops.map((s) => ({
                        row: s[0],
                        col: s[1],
                      }))
                    : null
                }
                zone={currentZoneId}
                highlightRange={highlightRange}
                highlightOptionId={selectedOptionId}
                highlightOptionType={highlightOptionType}
                markedNodes={markedNodes}
                options={visibleOptions
                  .concat(
                    currentZoneId === "zone_5"
                      ? nodeOptions.filter((n) => n.name === "命运所指")
                      : [],
                  )
                  .concat(
                    nodeOptions.filter(
                      (n) => n.name === "未知的凶戾" || n.name === "未知的诡秘",
                    ),
                  )}
                onMarkNode={handleMarkNodeAt}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
              />
              <div className="w-full p-2 bg-black-gray-70 rounded-md">
                {selectedMapId}
                {currentMap?.notes && ": " + currentMap?.notes}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
