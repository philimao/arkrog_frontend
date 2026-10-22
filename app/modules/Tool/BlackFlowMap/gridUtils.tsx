import type { GridState, Coord, Direction } from "./types";
import { getNodeStepRanges, isDistanceInStepRanges } from "./mapData";

export function nodeId(row: number, col: number): string {
  return `${row},${col}`;
}

export function parseNodeId(id: string): Coord {
  const [row, col] = id.split(",").map(Number);
  return { row, col };
}

export function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function isAdjacent(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
): boolean {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

export function inBounds(state: GridState, row: number, col: number): boolean {
  return row >= 0 && row < state.rows && col >= 0 && col < state.cols;
}

export function getNeighborCoord(
  state: GridState,
  row: number,
  col: number,
  dir: Direction,
): Coord | null {
  const deltas: Record<Direction, [number, number]> = {
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1],
  };
  const [dr, dc] = deltas[dir];
  const nr = row + dr;
  const nc = col + dc;
  return inBounds(state, nr, nc) ? { row: nr, col: nc } : null;
}

export function isConnected(
  state: GridState,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
): boolean {
  const key = edgeKey(nodeId(r1, c1), nodeId(r2, c2));
  return state.connections[key]?.active ?? false;
}

export function getConnectedNeighbors(
  state: GridState,
  row: number,
  col: number,
): Coord[] {
  const result: Coord[] = [];
  (["up", "down", "left", "right"] as Direction[]).forEach((dir) => {
    const n = getNeighborCoord(state, row, col, dir);
    if (n && isConnected(state, row, col, n.row, n.col)) result.push(n);
  });
  return result;
}

export interface OptionFilterCandidate {
  id: string;
  name: string;
}

export function getNodeDistanceMap(
  state: GridState,
  start: Coord | null,
  ends: Coord[] | null = null,
) {
  if (!start) return new Map<string, number>();

  const distances = new Map<string, number>();
  const endKeys = new Set(ends?.map((end) => nodeId(end.row, end.col)));
  const queue: Coord[] = [start];
  distances.set(nodeId(start.row, start.col), 0);

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
      const nextDistance = currentDistance + Number(!endKeys.has(neighborKey));
      if (nextDistance >= (distances.get(neighborKey) ?? Infinity)) continue;
      distances.set(neighborKey, nextDistance);
      if (endKeys.has(neighborKey)) {
        queue.unshift(neighbor);
      } else {
        queue.push(neighbor);
      }
    }
  }

  return distances;
}

export function getOptionsForNodeDistance({
  state,
  start,
  node,
  zone,
  isMemory,
  ends,
  options,
}: {
  state: GridState;
  start: Coord | null;
  node: Coord | null;
  zone: string;
  isMemory: boolean;
  ends: Coord[] | null;
  options: OptionFilterCandidate[];
}) {
  if (!start || !node) return options;

  const nodeKey = nodeId(node.row, node.col);
  const distance = getNodeDistanceMap(state, start, ends).get(nodeKey);
  if (distance === undefined) return [];

  return options.filter((option) => {
    if (["未知的凶戾", "未知的诡秘", "命运所指"].includes(option.name))
      return true;
    const ranges = getNodeStepRanges(option.id, zone, isMemory);
    return ranges !== undefined && isDistanceInStepRanges(distance, ranges);
  });
}
