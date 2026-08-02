export type NodeId = string; // "row,col"

export interface EdgeData {
  active: boolean;
}

export interface GridState {
  rows: number;
  cols: number;
  connections: Record<string, EdgeData>; // edgeKey -> data
}

export interface Coord {
  row: number;
  col: number;
}

export type Direction = "up" | "down" | "left" | "right";
