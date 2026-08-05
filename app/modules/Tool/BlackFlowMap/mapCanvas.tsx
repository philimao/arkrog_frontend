import React, { useCallback, useMemo, useRef, useState } from "react";
import type { GridState, Coord } from "./types";
import {
  getConnectedNeighbors,
  nodeId,
  getOptionsForNodeDistance,
} from "./gridUtils";
import { CloseIcon } from "@mantine/core";
import { nodeOptions, nodeTypeLimits } from "./mapData";

// 节点名字只在屏幕够宽时显示，小屏幕上地图本来就挤，只留图标；用 SVG text
// 而不是额外的 HTML 元素，这样能跟着 viewBox 一起缩放、不用另外定位。
// 描边是为了在背景图亮暗不一的情况下都能看清字（paintOrder 让描边在填色下面）。
function NodeLabel({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      className="pointer-events-none select-none fill-white text-[10px]"
      style={{
        paintOrder: "stroke",
        stroke: "rgba(0,0,0,0.75)",
        strokeWidth: 3,
      }}
    >
      {children}
    </text>
  );
}

interface NodeMapCanvasProps {
  state: GridState;
  onToggle: (r1: number, c1: number, r2: number, c2: number) => void;
  onNodeClick?: (row: number, col: number) => void;
  cellSize?: number;
  dotRadius?: number;
  readOnly?: boolean;
  /** optional start coordinate to highlight */
  start?: Coord | null;
  /** optional end coordinates to highlight */
  ends?: Coord[] | null;
  /** optional fighting end coordinate to highlight */
  battleEnd?: Coord | null;
  zone: string;
  highlightRange?: { min: number; max: number } | null;
  highlightOptionId?: string | null;
  markedNodes?: Record<string, string>;
  selectedNodeKey?: string | null;
  options?: { id: string; name: string }[];
  highlightOptionType?: string | null;
  onMarkNode?: (row: number, col: number, optionId: string) => void;
  menuOpen?: boolean;
  setMenuOpen?: (open: boolean) => void;
  knownBattles?: Coord[] | null;
  knownShops?: Coord[] | null;
}

export function NodeMapCanvas({
  state,
  onNodeClick,
  cellSize = 64,
  dotRadius = 6,
  readOnly = false,
  start = null,
  ends = null,
  battleEnd = null,
  zone = "",
  highlightRange = null,
  selectedNodeKey = null,
  highlightOptionId = null,
  highlightOptionType = null,
  markedNodes = {},
  options = [],
  onMarkNode,
  menuOpen = false,
  setMenuOpen,
  knownBattles = null,
  knownShops = null,
}: NodeMapCanvasProps) {
  const sketchPaths = useRef(new Map<string, string>());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{
    left: number;
    top: number;
    placement: "left" | "right";
  } | null>(null);
  const [menuNode, setMenuNode] = useState<Coord | null>(null);
  const visibleMenuOptions = useMemo(() => {
    if (!menuNode) return options;
    return getOptionsForNodeDistance({
      state,
      start,
      node: menuNode,
      zone,
      options,
    });
  }, [menuNode, options, start, state, zone]);

  const optionMap = useMemo(
    () => new Map(nodeOptions.map((option) => [option.id, option])),
    [],
  );

  const { optionCounts, typeCounts } = useMemo(() => {
    const optionCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();

    const addCount = (optionId: string, type: string, amount = 1) => {
      optionCounts.set(optionId, (optionCounts.get(optionId) || 0) + amount);
      typeCounts.set(type, (typeCounts.get(type) || 0) + amount);
    };

    if (knownBattles?.length) {
      addCount("battle_normal", "battle", knownBattles.length);
    }
    if (knownShops?.length) {
      addCount("shop", "other", knownShops.length);
    }

    for (const optionId of Object.values(markedNodes)) {
      const option = optionMap.get(optionId);
      if (!option) continue;
      addCount(optionId, option.type);
    }

    return { optionCounts, typeCounts };
  }, [markedNodes, optionMap, knownBattles?.length, knownShops?.length]);

  const currentTypeLimit = useCallback(
    (type: string) => {
      const limit = nodeTypeLimits
        .find((limitEntry) => limitEntry.type === type)
        ?.steps.find((step) => step.zone === zone)?.maxAllowed;
      return limit ?? Infinity;
    },
    [zone],
  );

  const highlightedNodeIds = useMemo(() => {
    if (!start || !highlightRange) return new Set<string>();

    const distances = new Map<string, number>();
    const queue: Coord[] = [start];
    const startKey = nodeId(start.row, start.col);
    distances.set(startKey, 0);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentKey = nodeId(current.row, current.col);
      const currentDistance = distances.get(currentKey)!;

      for (const neighbor of getConnectedNeighbors(
        state,
        current.row,
        current.col,
      )) {
        const neighborKey = nodeId(neighbor.row, neighbor.col);
        if (distances.has(neighborKey)) continue;
        distances.set(neighborKey, currentDistance + 1);
        queue.push(neighbor);
      }
    }

    return new Set(
      [...distances.entries()]
        .filter(
          ([, distance]) =>
            distance >= highlightRange.min && distance <= highlightRange.max,
        )
        .map(([id]) => id),
    );
  }, [highlightRange, start, state]);

  const width = state.cols * cellSize;
  const height = state.rows * cellSize;

  const toX = (col: number) => col * cellSize + cellSize / 2;
  const toY = (row: number) => row * cellSize + cellSize / 2;

  function getSketchPath(
    key: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) {
    if (sketchPaths.current.has(key)) {
      return sketchPaths.current.get(key)!;
    }

    const wobble = 6;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * wobble;

    const path = `
      M ${x1} ${y1}
      Q ${midX} ${midY}
        ${x2} ${y2}
    `;

    sketchPaths.current.set(key, path);

    return path;
  }

  // Render every active connection as a line
  const lines = Object.entries(state.connections)
    .filter(([, data]) => data.active)
    .map(([key]) => {
      const [a, b] = key.split("|");
      const [r1, c1] = a.split(",").map(Number);
      const [r2, c2] = b.split(",").map(Number);

      const x1 = toX(c1);
      const y1 = toY(r1);
      const x2 = toX(c2);
      const y2 = toY(r2);
      const path = getSketchPath(key, x1, y1, x2, y2);

      if (readOnly) {
        return (
          <path
            key={key}
            d={path}
            className="fill-none stroke-[var(--color-light-mid-gray)] stroke-[1.5] stroke-linecap-round stroke-linejoin-round"
          />
        );
      }

      return (
        <g key={key}>
          <path
            d={path}
            className="fill-none stroke-[rgba(0,0,0,0.35)] stroke-[10] stroke-linecap-round stroke-linejoin-round"
          />

          <path
            d={path}
            className="fill-none stroke-[rgba(255,255,255,0.35)] stroke-[6] stroke-linecap-round stroke-linejoin-round"
          />

          <path
            d={path}
            className="fill-none stroke-[#444] stroke-[3] stroke-linecap-round stroke-linejoin-round"
          />
        </g>
      );
    });

  const dots = [];
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const nodeKey = nodeId(r, c);
      const isMarked = Boolean(markedNodes[nodeKey]);
      const isHighlighted = highlightedNodeIds.has(nodeKey);
      const isStart = start && start.row === r && start.col === c;
      const isEnd = ends?.some((end) => end.row === r && end.col === c);
      const isBattleEnd =
        battleEnd && battleEnd.row === r && battleEnd.col === c;
      const neighbors = getConnectedNeighbors(state, r, c);
      const isKnownBattle = knownBattles?.some(
        (b) => b.row === r && b.col === c,
      );
      const isKnownShop = knownShops?.some((s) => s.row === r && s.col === c);
      // skip rendering isolated nodes (unless they are start or end)
      if (!isStart && !isEnd && !isBattleEnd && neighbors.length === 0)
        continue;

      const x = toX(c);
      const y = toY(r);
      const baseSize = dotRadius;
      const emptyIconSize = 20;
      const iconSize = 80;
      const ringSize = Math.max(4, baseSize - 1);
      const nodeCursor =
        readOnly ||
        isKnownBattle ||
        isKnownShop ||
        isEnd ||
        isBattleEnd ||
        isStart
          ? "default"
          : "pointer";
      const canMarkNode = !readOnly && !isStart && !isEnd && !isBattleEnd;
      const baseHighlightActive =
        isHighlighted && canMarkNode && Boolean(highlightOptionId);
      const isTempReveal =
        isMarked &&
        baseHighlightActive &&
        ((Boolean(highlightOptionType) &&
          markedNodes[nodeKey] === `hide_${highlightOptionType}`) ||
          (highlightOptionType === "other" &&
            markedNodes[nodeKey] === "hide_invisible"));
      const showHighlightImage =
        baseHighlightActive && (!isMarked || isTempReveal);
      const imageHref =
        isMarked && !isTempReveal
          ? `/images/map/${markedNodes[nodeKey]}.webp`
          : showHighlightImage
            ? `/images/map/${highlightOptionId}.webp`
            : "/images/map/empty.webp";
      const isSelectedNode = selectedNodeKey === nodeKey;

      if (isStart) {
        dots.push(
          <g key={`${r},${c}`}>
            <circle
              cx={x}
              cy={y}
              r={readOnly ? baseSize : baseSize * 1.5}
              fill={"#f59e0b"}
            />
            {!readOnly && (
              <image
                href="/images/map/cursor_anchor.webp"
                x={x - iconSize / 4}
                y={y - iconSize / 4}
                width={iconSize * 0.5}
                height={iconSize * 0.5}
                style={{ cursor: nodeCursor }}
              />
            )}
          </g>,
        );
      } else if (isEnd || isBattleEnd) {
        if (readOnly) {
          dots.push(
            <g key={`${r},${c}`}>
              <circle
                cx={x}
                cy={y}
                r={baseSize}
                fill={isBattleEnd ? "#cd2020" : "#97be4a"}
              />
            </g>,
          );
        } else {
          dots.push(
            <g key={`${r},${c}`}>
              <image
                href={
                  isBattleEnd
                    ? zone === "zone_5"
                      ? "/images/map/battle_boss_cadejo.webp"
                      : "/images/map/battle_mid_boss_shsgzd.webp"
                    : "/images/map/final.webp"
                }
                x={x - iconSize / 2}
                y={y - iconSize / 2}
                width={iconSize}
                height={iconSize}
                style={{ cursor: nodeCursor }}
              />
              <NodeLabel x={x} y={y + iconSize / 2 - 10}>
                {isBattleEnd ? "险路恶敌" : "险路尽头"}
              </NodeLabel>
            </g>,
          );
        }
      } else if (isKnownBattle || isKnownShop) {
        if (readOnly) {
          dots.push(
            <g key={`${r},${c}`}>
              <circle
                cx={x}
                cy={y}
                r={baseSize}
                fill={isKnownBattle ? "#854286" : "#20bb75"}
              />
            </g>,
          );
        } else {
          const knownOptionName = optionMap.get(
            isKnownBattle ? "battle_normal" : "shop",
          )?.name;
          dots.push(
            <g key={`${r},${c}`}>
              <image
                href={
                  isKnownBattle
                    ? "/images/map/battle_normal.webp"
                    : "/images/map/shop.webp"
                }
                x={x - iconSize / 2}
                y={y - iconSize / 2}
                width={iconSize}
                height={iconSize}
                style={{ cursor: nodeCursor }}
              />
              {knownOptionName && (
                <NodeLabel x={x} y={y + iconSize / 2 - 10}>
                  {knownOptionName}
                </NodeLabel>
              )}
            </g>,
          );
        }
      } else if (readOnly) {
        dots.push(
          <g key={`${r},${c}`}>
            <circle
              cx={x}
              cy={y}
              r={ringSize}
              fill="var(--color-black-gray)"
              stroke="var(--color-light-mid-gray)"
              strokeWidth={2}
            />
          </g>,
        );
      } else {
        const iconWidth =
          showHighlightImage || isMarked ? iconSize : emptyIconSize;
        const iconHeight =
          showHighlightImage || isMarked ? iconSize : emptyIconSize;

        dots.push(
          <g key={`${r},${c}`}>
            <image
              href={imageHref}
              x={x - iconWidth / 2}
              y={y - iconHeight / 2}
              width={iconWidth}
              height={iconHeight}
              className={showHighlightImage ? "opacity-50" : undefined}
              style={{
                cursor: nodeCursor,
                pointerEvents: "all",
                ...(isSelectedNode && menuOpen
                  ? { filter: "drop-shadow(0 0 0.5rem rgba(96,165,250, 0.8))" }
                  : {}),
              }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (canMarkNode && typeof onNodeClick === "function") {
                  onNodeClick(r, c);
                }
                if (canMarkNode && options && options.length > 0) {
                  const isSameNode =
                    menuOpen && menuNode?.row === r && menuNode?.col === c;
                  if (setMenuOpen && isSameNode) {
                    setMenuOpen(false);
                    return;
                  }
                  const rect = containerRef.current?.getBoundingClientRect();
                  const scrollLeft = containerRef.current?.scrollLeft || 0;
                  const scrollTop = containerRef.current?.scrollTop || 0;
                  if (rect && setMenuOpen) {
                    const relativeX = e.clientX - rect.left;
                    const left = relativeX + scrollLeft;
                    const top = e.clientY - rect.top + scrollTop;
                    const menuWidth = 200;
                    const placement =
                      relativeX < menuWidth + 16
                        ? "right"
                        : relativeX > rect.width - menuWidth - 16
                          ? "left"
                          : "left";
                    setMenuPos({ left, top, placement });
                    setMenuNode({ row: r, col: c });
                    setMenuOpen(true);
                  }
                }
              }}
            />
            {isMarked && !isTempReveal && (
              <NodeLabel x={x} y={y + iconHeight / 2 - 10}>
                {optionMap.get(markedNodes[nodeKey])?.name}
              </NodeLabel>
            )}
          </g>,
        );
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onPointerLeave={() => {}}
      onClick={() => setMenuOpen && setMenuOpen(false)}
      className={`relative flex w-full items-center justify-center grow ${readOnly ? "" : "min-h-[320px]"}`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-auto w-full"
        style={{ maxWidth: width, maxHeight: "100%" }}
      >
        {lines}
        {dots}
      </svg>
      {menuOpen && menuPos && menuNode ? (
        <div
          className="pointer-events-auto absolute z-50 flex max-h-[340px] min-w-[180px] max-w-[200px] flex-col gap-2 overflow-y-auto rounded-lg border border-white/10 bg-black/95 p-2 text-white"
          style={{
            left: menuPos.left,
            top: menuPos.top,
            transform:
              menuPos.placement === "left"
                ? "translate(-110%, -50%)"
                : "translate(10%, -50%)",
          }}
        >
          <span>可能出现以下节点</span>
          {(() => {
            const currentKey = nodeId(menuNode.row, menuNode.col);
            const currentMark = markedNodes[currentKey];
            return (
              currentMark && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen && setMenuOpen(false);
                    if (typeof onMarkNode === "function") {
                      onMarkNode(menuNode.row, menuNode.col, "");
                    }
                  }}
                  className="flex cursor-pointer items-center rounded-md border border-mid-gray bg-transparent px-2 py-1 text-left text-white"
                >
                  <div>
                    <CloseIcon width={24} height={24} />
                  </div>
                  <span>移除标记</span>
                </button>
              )
            );
          })()}
          {visibleMenuOptions.map((opt) => {
            const option = optionMap.get(opt.id);
            const perOptionLimit = option
              ? option.steps.find((step) => step.zone === zone)?.maxAllowed
              : undefined;
            const optionCount = optionCounts.get(opt.id) || 0;
            const isOptionLimitReached =
              perOptionLimit !== undefined && optionCount >= perOptionLimit;
            // const typeLimit = option ? currentTypeLimit(option.type) : Infinity;
            // const typeCount = option ? typeCounts.get(option.type) || 0 : 0;
            // const isTypeLimitReached = typeCount >= typeLimit;
            const disabled = isOptionLimitReached; // || isTypeLimitReached;
            const disabledNote = isOptionLimitReached
              ? `已达${opt.name}标记上限`
              : // : isTypeLimitReached
                //   ? `已达${option?.type === "battle" ? "凶戾类节点" : "诡秘类节点"}标记上限`
                "";

            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (disabled) return;
                  setMenuOpen && setMenuOpen(false);
                  if (typeof onMarkNode === "function") {
                    onMarkNode(menuNode.row, menuNode.col, opt.id);
                  }
                }}
                disabled={disabled}
                className={`flex items-center rounded-md border border-mid-gray bg-transparent text-left ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                style={{ cursor: disabled ? "not-allowed" : "pointer" }}
              >
                <img
                  src={`/images/map/${opt.id}.webp`}
                  className="w-8 h-8 aspect-square"
                />
                <div className="flex flex-col">
                  <span>{opt.name}</span>
                  {disabledNote ? (
                    <span className="text-xs text-white/60">
                      {disabledNote}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
