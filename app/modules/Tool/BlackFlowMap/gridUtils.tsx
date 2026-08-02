import type { GridState, Coord, Direction } from "./types";

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
