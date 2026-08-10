import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter } from "@heroui/react";
import Loading from "~/components/Loading";
import { useGameDataStore } from "~/stores/gameDataStore";
import { useNodeGrid } from "./useNodeGrid";
import { NodeMapCanvas } from "./mapCanvas";
import {
  ScreenshotRecognizer,
  type RecognitionCandidateInfo,
  type ScreenshotRecognizerHandle,
} from "./ScreenshotRecognizer";
import type { MarkableNode } from "./recognition/recognize";
import {
  toGridState,
  initialMaps,
  nodeOptions,
  nodeTypeLimits,
  zoneNotes,
} from "./mapData";
import type { ZoneData, ZoneOfRogue } from "~/types/gameData";
import { intToRoman } from "~/utils/tools";
import { ChevronIcon, EyeClosedIcon, EyeOpenIcon } from "~/components/Icons";
import type { Route } from "./+types/index";
import { StyledDivider } from "~/modules/Tournament/components/Shared";

// 截图识别功能默认隐藏，通过这个 localStorage key 记住是否已手动开启。
const SHOW_RECOGNIZER_KEY = "show-map-recognizer";

// 稳定的空 Set 引用，避免"当前基底还没有任何自动填入记录"这种情况下每次渲染都 new 一个新对象
const EMPTY_KEY_SET: Set<string> = new Set();

// "基底"收起/展开只在手机端有意义，大屏幕强制常驻展开——用 matchMedia 而不是纯
// CSS 的 important 覆盖，因为 Tailwind 的 lg: + ! 组合在这里没能可靠覆盖内联/普通
// 类之间的优先级，实测小屏幕点"收起"没反应
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
  const isLgScreen = useIsLgScreen();
  const zoneOfRogue: ZoneData[] = Object.values(zones).slice(0, 5);
  const { toggle, load } = useNodeGrid(toGridState(initialMaps[0]));
  // 识图自动切到基底后，把"基底"这块滚到可视区域，用户不用自己往下翻
  const baseMapsSectionRef = useRef<HTMLDivElement>(null);
  // "清除图片"可能要先弹窗问用户，问完才回头让识图组件真正清掉自己的预览状态
  const recognizerRef = useRef<ScreenshotRecognizerHandle>(null);
  const [currentZoneId, setCurrentZoneId] = useState<string>(
    zoneOfRogue[0]?.id || "",
  );
  const [selectedMapId, setSelectedMapId] = useState<string>(
    initialMaps[0]?.id || "",
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [markedNodesByMap, setMarkedNodesByMap] = useState<
    Record<string, Record<string, string>>
  >({});
  const [detectedNodesByMap, setDetectedNodesByMap] = useState<
    Record<string, Record<string, string>>
  >({});
  const [autoFilledHiddenByMap, setAutoFilledHiddenByMap] = useState<
    Record<string, boolean>
  >({});

  const markedNodes = markedNodesByMap[selectedMapId] ?? {};
  const detectedNodes = detectedNodesByMap[selectedMapId] ?? {};
  const autoFilledHidden = autoFilledHiddenByMap[selectedMapId] ?? false;
  const autoFilledKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const [key, value] of Object.entries(detectedNodes)) {
      if (markedNodes[key] === value) keys.add(key);
    }
    return keys;
  }, [markedNodes, detectedNodes]);
  // 传给地图画布的"这些格子先别画出来"集合，纯展示用
  const hiddenKeys = autoFilledHidden ? autoFilledKeys : EMPTY_KEY_SET;

  const setMarkedNodes = (
    updater:
      | Record<string, string>
      | ((prev: Record<string, string>) => Record<string, string>),
  ) => {
    setMarkedNodesByMap((prevAll) => {
      const prev = prevAll[selectedMapId] ?? {};
      const next = typeof updater === "function" ? updater(prev) : updater;
      return { ...prevAll, [selectedMapId]: next };
    });
  };

  const currentMap = initialMaps.find((m) => m.id === selectedMapId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showZoneNotes, setShowZoneNotes] = useState(false);
  const [showBaseMaps, setShowBaseMaps] = useState(true);
  const [showNodeOptions, setShowNodeOptions] = useState(true);
  const [showScreenshotRecognizer, setShowScreenshotRecognizer] =
    useState(false);
  // 识图工具区块自身的收起/展开，跟下面"基底"缩略图网格的 showBaseMaps 是两回事
  const [showRecognizerPanel, setShowRecognizerPanel] = useState(true);
  // 本次截图识别的结果（区域 + 候选基底，按分数降序），供上面"区域选择"和下面
  // "基底"缩略图网格画标记。这份状态跟着识别结果本身走，不跟着"用户现在切到
  // 哪个区域/基底"走——切区域、切基底都不清；只有用户点"清除图片"才清
  const [recognitionCandidates, setRecognitionCandidates] = useState<{
    zone: string;
    candidates: RecognitionCandidateInfo[];
  } | null>(null);
  // 识图切过去的基底本身已经有用户自己填的节点时，弹窗强制用户在"覆盖"和
  // "合并"之间选一个，选完才真正落盘——非空表示弹窗正开着
  const [pendingMerge, setPendingMerge] = useState<{
    mapId: string;
    markableNodes: MarkableNode[];
  } | null>(null);
  // 有歧义时非第一名的候选是后台静默预填的，用户当时还没看到那个基底。如果那
  // 个基底本身已经有用户填的节点，不能在用户没点开它之前就替他悄悄决定"合
  // 并"——先存这儿，等用户真的切过去（不管是点候选按钮还是直接点基底缩略图）
  // 再触发跟主结果一样的"覆盖/合并"弹窗
  const [pendingCandidateDetections, setPendingCandidateDetections] = useState<
    Record<string, MarkableNode[]>
  >({});
  // 截图识别功能还在打磨阶段，默认对所有用户隐藏；开发/内部想临时体验时，
  // 在浏览器控制台敲 enableMapRecognizer() 即可（会记住选择，刷新也生效），
  // disableMapRecognizer() 关掉。不接普通用户能看到的入口。
  useEffect(() => {
    setShowScreenshotRecognizer(
      window.localStorage.getItem(SHOW_RECOGNIZER_KEY) === "1",
    );
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

  // 完全由 selectedOptionId + currentZoneId 决定，不用单独存一份状态跟着同步
  const highlightRange = useMemo(() => {
    if (!selectedOptionId) return null;
    const step = nodeOptions
      .find((o) => o.id === selectedOptionId)
      ?.steps.find((s) => s.zone === currentZoneId);
    return step && step.min && step.max
      ? { min: step.min, max: step.max }
      : null;
  }, [selectedOptionId, currentZoneId]);

  // 切区域/切基底/截图识别切过去之后，之前的"选中节点做什么"相关 UI 状态都该
  // 清空——四处调用点原先各自重复这三行，抽成一个函数
  const resetSelection = () => {
    setSelectedOptionId("");
    setSelectedNode(null);
    setMenuOpen(false);
  };

  const handleNodeClick = (row: number, col: number) => {
    setSelectedNode({ row, col });
  };

  const handleOptionClick = (option: (typeof nodeOptions)[number]) => {
    setSelectedOptionId((prev) => (prev === option.id ? "" : option.id));
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

  // 这个基底当前的标记里，有没有哪些是"用户自己填的"（当前值不等于上一次识别
  // 基线的）——用来判断新识别结果落下去之前要不要弹"覆盖/合并"选择
  const hasUserMarkedNodes = (mapId: string) => {
    const prevMarked = markedNodesByMap[mapId] ?? {};
    const prevDetected = detectedNodesByMap[mapId] ?? {};
    return Object.entries(prevMarked).some(
      ([key, optionId]) => prevDetected[key] !== optionId,
    );
  };

  // 把某个基底的识别结果套进它自己的标记里。mode: "merge"（默认）——用户层在
  // 识别层之上，这个基底上用户已经手动标过的格子不能被识别结果覆盖掉；
  // "overwrite"——不管这格之前是什么，一律换成这次识别的结果。传入的 mapId
  // 不一定是当前 selectedMapId（比如给还没切过去的候选基底预填），所以直接按
  // mapId 写 ByMap 版本的 state，不走闭包在当前 selectedMapId 上的 setMarkedNodes 等 setter
  const applyDetectedNodes = (
    mapId: string,
    markableNodes: MarkableNode[],
    mode: "merge" | "overwrite" = "merge",
  ) => {
    const detected: Record<string, string> = {};
    for (const n of markableNodes) {
      const option = nodeOptions.find((opt) => opt.name === n.label);
      if (option) detected[`${n.row},${n.col}`] = option.id;
    }
    let nextMarkedNodes = detected;
    if (mode === "merge") {
      const prevMarked = markedNodesByMap[mapId] ?? {};
      const prevDetected = detectedNodesByMap[mapId] ?? {};
      const userMarked: Record<string, string> = {};
      for (const [key, optionId] of Object.entries(prevMarked)) {
        if (prevDetected[key] !== optionId) userMarked[key] = optionId;
      }
      nextMarkedNodes = { ...detected, ...userMarked };
    }
    setMarkedNodesByMap((prev) => ({ ...prev, [mapId]: nextMarkedNodes }));
    // 新一轮识别默认展开，别让上一轮识别时按过的"隐藏"延续到这次新结果上
    setAutoFilledHiddenByMap((prev) => ({ ...prev, [mapId]: false }));
    // 新一轮识别结果整份覆盖旧的基线——不跟 userMarked 合并，它就是单纯的
    // "这次识别出了什么"，不掺用户的手改
    setDetectedNodesByMap((prev) => ({ ...prev, [mapId]: detected }));
  };

  // 有歧义时，后台静默预填非第一名的候选用这个：没有冲突就直接填；有冲突（这
  // 个基底已经有用户填的节点）先记下来，等用户真的切过去再弹窗问，而不是替他
  // 悄悄合并掉
  const applyOrDeferDetectedNodes = (
    mapId: string,
    markableNodes: MarkableNode[],
  ) => {
    if (hasUserMarkedNodes(mapId)) {
      setPendingCandidateDetections((prev) => ({
        ...prev,
        [mapId]: markableNodes,
      }));
    } else {
      applyDetectedNodes(mapId, markableNodes);
    }
  };

  // 用户切到某个基底时，把之前后台记下来、被推迟的识别结果在这时候真正处理掉
  useEffect(() => {
    const pending = pendingCandidateDetections[selectedMapId];
    if (!pending) return;
    setPendingCandidateDetections((prev) => {
      if (!(selectedMapId in prev)) return prev;
      const next = { ...prev };
      delete next[selectedMapId];
      return next;
    });
    if (hasUserMarkedNodes(selectedMapId)) {
      setPendingMerge({ mapId: selectedMapId, markableNodes: pending });
    } else {
      applyDetectedNodes(selectedMapId, pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMapId, pendingCandidateDetections]);

  // "移除标记"按钮用：把某个节点改回它自动识别时的原始结果。改完这格自然会
  // 被 autoFilledKeys 重新算成"自动的"，不用再手动标记
  const handleRevertNode = (row: number, col: number) => {
    const key = `${row},${col}`;
    const detectedValue = detectedNodes[key];
    if (detectedValue === undefined) return;
    setMarkedNodes((prev) => ({ ...prev, [key]: detectedValue }));
  };

  // "清除图片"：只清掉截图预览本身，不碰地图上任何节点——不管是识别出来的
  // 还是用户自己填的，一律保留
  const handleClearPreview = (candidateMapIds: string[]) => {
    setPendingCandidateDetections((prev) => {
      const next = { ...prev };
      for (const mapId of candidateMapIds) delete next[mapId];
      return next;
    });
    setRecognitionCandidates(null);
    recognizerRef.current?.resetPreview();
  };

  // "清空地图"按钮用：不管是自动识别填的还是用户自己标的，一律清掉
  const clearMap = () => {
    setMarkedNodes({});
    setAutoFilledHiddenByMap((prev) => ({ ...prev, [selectedMapId]: false }));
  };

  // 按钮用：纯粹的显示开关，不碰 markedNodes/detectedNodes——隐藏识别节点
  // 只是不画出来，不代表这些节点不存在，计数、上限判断等一律不受影响
  const toggleAutoFilledVisibility = () => {
    setAutoFilledHiddenByMap((prev) => ({
      ...prev,
      [selectedMapId]: !autoFilledHidden,
    }));
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
        ? `已达标记上限`
        : // : typeFull
          //   ? `已达到${option.type === "battle" ? "凶戾类节点" : "诡秘类节点"}标记上限`
          "";

      return (
        <div
          className={`flex items-center rounded-md border ${
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
  // 隐藏识别节点纯粹是显示开关，不影响 markedNodes 本身，所以这里不用像以前
  // 那样还要额外算上"藏起来的"那一份
  const hasAnyMark = Object.keys(markedNodes).length > 0;
  const notes = currentMap?.notes?.split("；").filter(Boolean);

  return (
    <div className="relative">
      {/* 区域选择 */}
      <div className="mb-8 mt-2 grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
        {zoneOfRogue.map((zone, index) => (
          <div
            key={zone.id}
            className={
              "relative text-center font-bold leading-[2rem] p-1 " +
              `${currentZoneId === zone.id ? "bg-ak-blue text-black" : "bg-black-gray text-white"}`
            }
            role="button"
            onClick={() => {
              setCurrentZoneId(zone.id);
              const nextMap = initialMaps.find((m) => m.zone === zone.id);
              setSelectedMapId(nextMap?.id || "");
              resetSelection();
              load(toGridState(nextMap || initialMaps[0]));
              setShowZoneNotes(false);
              setShowBaseMaps(true);
            }}
          >
            {zone.id === recognitionCandidates?.zone && (
              <div
                className="absolute top-0 right-0 z-10 w-4 h-4 bg-ak-blue"
                style={{ clipPath: "polygon(100% 0, 100% 100%, 0 0)" }}
              />
            )}
            {intToRoman(index + 1)} {zone.name}
          </div>
        ))}
      </div>

      {/* 识图工具 */}
      {showScreenshotRecognizer && (
        <div className="mb-16">
          <div className="flex justify-between items-end">
            <div className="flex items-end flex-wrap">
              <h3 className="font-bold text-2xl">
                截图识别地图<span className="text-lg">（实验性）</span>
              </h3>
              <p className="text-sm text-light-mid-gray">
                此功能仍在开发中，结果仅供参考
              </p>
            </div>

            <button
              className="flex flex-shrink-0 gap-1 items-center text-ak-blue"
              onClick={() => setShowRecognizerPanel((prev) => !prev)}
            >
              {showRecognizerPanel ? "收起" : "展开"}
              <ChevronIcon
                direction={showRecognizerPanel ? "up" : "down"}
                className="w-4 h-4 text-ak-blue"
              />
            </button>
          </div>
          <StyledDivider />
          <div
            className="grid transition-[grid-template-rows] duration-200 ease-in-out"
            style={{ gridTemplateRows: showRecognizerPanel ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <ScreenshotRecognizer
                ref={recognizerRef}
                zones={zoneOfRogue}
                currentZoneId={currentZoneId}
                onCandidatesChange={setRecognitionCandidates}
                onNodesDetected={applyOrDeferDetectedNodes}
                suppressFloatingPreview={!!pendingMerge}
                onMatched={(zone, mapId, markableNodes) => {
                  const matched = initialMaps.find((m) => m.id === mapId);
                  if (!matched) return;
                  // 层数也是识别出来的，可能跟用户当前选中的层不同，一并切过去
                  setCurrentZoneId(zone);
                  setShowZoneNotes(false);
                  setSelectedMapId(mapId);
                  // 无论是刚上传完新截图，还是点了候选结果按钮，都要让用户看到
                  // 切去的是哪个基底——手机端"基底"区块可能是收起的，这里强制展开
                  setShowBaseMaps(true);
                  // 这个基底本来就有用户自己填的节点：先别落盘，弹窗让用户在
                  // "覆盖"和"合并"里选一个，选完才真正应用识别结果
                  if (hasUserMarkedNodes(mapId)) {
                    setPendingMerge({ mapId, markableNodes });
                  } else {
                    applyDetectedNodes(mapId, markableNodes);
                  }
                  resetSelection();
                  load(toGridState(matched));
                  baseMapsSectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                onCancel={handleClearPreview}
              />
            </div>
          </div>
        </div>
      )}

      <div>
        {/* 基底选择 */}
        <div className="mb-16" ref={baseMapsSectionRef}>
          <div className="flex justify-between items-end">
            <h3 className="font-bold text-2xl">
              基底<span className="text-lg">（暂不支持追忆）</span>
            </h3>

            {/* 收起/展开只在手机端有意义 —— 大屏幕空间够，基底网格常驻展开 */}
            <button
              className="flex gap-1 items-center text-ak-blue lg:hidden"
              onClick={() => setShowBaseMaps((prev) => !prev)}
            >
              {showBaseMaps ? "收起" : "展开"}
              <ChevronIcon
                direction={showBaseMaps ? "up" : "down"}
                className="w-4 h-4 text-ak-blue"
              />
            </button>
          </div>
          <StyledDivider />
          <div
            className="grid transition-[grid-template-rows] duration-200 ease-in-out"
            style={{
              gridTemplateRows: isLgScreen || showBaseMaps ? "1fr" : "0fr",
            }}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 grow">
                {initialMaps
                  .filter((m) => m.zone === currentZoneId)
                  .map((m) => {
                    const isSelected = selectedMapId === m.id;
                    const candidateIndex =
                      recognitionCandidates?.candidates.findIndex(
                        (c) => c.mapId === m.id,
                      ) ?? -1;
                    const isCandidate = candidateIndex >= 0;
                    const ambiguous =
                      (recognitionCandidates?.candidates.length ?? 0) > 1;
                    return (
                      <div
                        key={m.id}
                        className={`relative overflow-hidden pt-4 pb-2 bg-black-gray ring-1 ring-inset ${isSelected ? "ring-ak-blue" : "ring-transparent"} cursor-pointer rounded`}
                        onClick={() => {
                          setSelectedMapId(m.id);
                          resetSelection();
                        }}
                      >
                        {isCandidate && (
                          <>
                            {ambiguous && candidateIndex === 0 && (
                              <span className="absolute top-1 left-1.5 z-10 text-xs text-ak-blue">
                                推荐
                              </span>
                            )}
                            <div
                              className="absolute top-0 right-0 z-10 w-7 h-7 bg-ak-blue"
                              style={{
                                clipPath: "polygon(100% 0, 100% 100%, 0 0)",
                              }}
                            >
                              {ambiguous && (
                                <span className="absolute top-0 right-1 text-sm font-bold text-black">
                                  {candidateIndex + 1}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                        <NodeMapCanvas
                          state={toGridState(m)}
                          onToggle={() => {}}
                          start={
                            m?.start
                              ? { row: m.start[0], col: m.start[1] }
                              : null
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
            </div>
          </div>
        </div>

        {/* 大地图 */}
        <div className="flex justify-between items-end">
          <h3 className="font-bold text-2xl">地图</h3>
          <button
            type="button"
            disabled={!hasAnyMark}
            className={`px-4 py-1 ${
              !hasAnyMark
                ? "bg-mid-gray text-light-mid-gray cursor-not-allowed"
                : "bg-ak-dark-red text-white"
            }`}
            onClick={clearMap}
          >
            清空地图
          </button>
        </div>
        <StyledDivider />
        <div
          className="grow p-4"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, .4)), url('/images/map/rogue_6_map_${currentZoneId}.webp')`,
          }}
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 预览节点 */}
            {showNodeOptions && (
              <div className="relative bg-black-gray-70 rounded-md p-2 lg:w-[324px] lg:min-w-[324px]">
                <button
                  type="button"
                  className="absolute z-10 top-1 right-1 w-8 h-8 shrink-0 flex items-center justify-center text-light-gray"
                  onClick={() => setShowNodeOptions(false)}
                  aria-label="收起预览节点"
                >
                  <ChevronIcon
                    direction="left"
                    className="hidden lg:block w-4 h-4"
                  />
                  <ChevronIcon direction="up" className="lg:hidden w-4 h-4" />
                </button>
                <div className="mb-2 pr-10">预览节点</div>
                <div className="grid w-full gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-2">
                  {renderNodeOptions()}
                </div>
              </div>
            )}

            {/* 地图 */}
            <div className="flex flex-col w-full items-center relative gap-4">
              {!showNodeOptions && (
                <button
                  type="button"
                  className="absolute z-10 top-1 right-2 lg:right-auto lg:left-1 w-8 h-8 shrink-0 rounded-md bg-black-gray-70 border border-mid-gray flex items-center justify-center"
                  onClick={() => setShowNodeOptions(true)}
                  aria-label="展开预览节点"
                >
                  <ChevronIcon
                    direction="right"
                    className="hidden lg:block w-4 h-4"
                  />
                  <ChevronIcon direction="down" className="lg:hidden w-4 h-4" />
                </button>
              )}
              <div className="relative">
                {/* 当前区域笔记 */}
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

              {/* 实际大地图 */}
              <NodeMapCanvas
                state={toGridState(currentMap || initialMaps[0])}
                onToggle={toggle}
                onNodeClick={handleNodeClick}
                cellSize={80}
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
                detectedNodes={detectedNodes}
                hiddenKeys={hiddenKeys}
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
                onRevertNode={handleRevertNode}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
              />

              {/* 隐藏/显示识别节点 */}
              {autoFilledKeys.size > 0 && (
                <>
                  <button
                    type="button"
                    className="self-start flex flex-col gap-1 px-3 py-1 text-light-gray rounded"
                    onClick={toggleAutoFilledVisibility}
                  >
                    <div className="flex items-center gap-1">
                      {autoFilledHidden ? (
                        <EyeClosedIcon className="w-6 h-6" />
                      ) : (
                        <EyeOpenIcon className="w-6 h-6" />
                      )}
                      <span>
                        {autoFilledHidden ? "隐藏识别节点" : "显示识别节点"}
                      </span>
                    </div>
                    <p className="text-sm text-light-mid-gray">
                      智能识别可能有误，请核对
                    </p>
                  </button>
                </>
              )}

              {/* 基底笔记 */}
              <div className="w-full p-2 text-center space-y-2">
                <p className="font-bold">{selectedMapId}</p>
                <div className="flex flex-wrap justify-center text-sm text-light-mid-gray">
                  {notes?.map((note, index) => (
                    <span key={index} className="whitespace-nowrap">
                      {note}
                      {index < notes.length - 1 && "；"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 识图切过去的基底本身已有用户填的节点：强制选"覆盖"还是"合并" */}
      <Modal
        size="md"
        isOpen={!!pendingMerge}
        onClose={() => {}}
        isDismissable={false}
        isKeyboardDismissDisabled
        hideCloseButton
      >
        <ModalContent>
          <ModalBody>
            <p className="p-4 text-center text-xl font-bold">
              检测到基底存在已填写的节点
            </p>
          </ModalBody>
          <ModalFooter className="justify-center gap-4">
            <button
              type="button"
              className="bg-ak-dark-red px-6 py-2 font-bold text-white"
              onClick={() => {
                if (!pendingMerge) return;
                applyDetectedNodes(
                  pendingMerge.mapId,
                  pendingMerge.markableNodes,
                  "overwrite",
                );
                setPendingMerge(null);
              }}
            >
              覆盖
            </button>
            <button
              type="button"
              className="bg-ak-blue px-6 py-2 font-bold text-black"
              onClick={() => {
                if (!pendingMerge) return;
                applyDetectedNodes(
                  pendingMerge.mapId,
                  pendingMerge.markableNodes,
                  "merge",
                );
                setPendingMerge(null);
              }}
            >
              合并
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
