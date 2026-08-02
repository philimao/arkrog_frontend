import type { GridState, EdgeData } from "./types";
import { nodeId, edgeKey, isAdjacent, inBounds } from "./gridUtils";

type Action =
  | {
      type: "CONNECT";
      r1: number;
      c1: number;
      r2: number;
      c2: number;
      data?: Partial<EdgeData>;
    }
  | { type: "DISCONNECT"; r1: number; c1: number; r2: number; c2: number }
  | { type: "TOGGLE"; r1: number; c1: number; r2: number; c2: number }
  | { type: "LOAD"; state: GridState }
  | { type: "CLEAR" };

export function gridReducer(state: GridState, action: Action): GridState {
  switch (action.type) {
    case "LOAD":
      return action.state;

    case "CLEAR":
      return { ...state, connections: {} };

    case "CONNECT": {
      const { r1, c1, r2, c2, data } = action;
      if (!inBounds(state, r1, c1) || !inBounds(state, r2, c2)) return state;
      if (!isAdjacent(r1, c1, r2, c2)) return state;
      const key = edgeKey(nodeId(r1, c1), nodeId(r2, c2));
      return {
        ...state,
        connections: { ...state.connections, [key]: { active: true, ...data } },
      };
    }

    case "DISCONNECT": {
      const { r1, c1, r2, c2 } = action;
      const key = edgeKey(nodeId(r1, c1), nodeId(r2, c2));
      const { [key]: _removed, ...rest } = state.connections;
      return { ...state, connections: rest };
    }

    case "TOGGLE": {
      const { r1, c1, r2, c2 } = action;
      if (!isAdjacent(r1, c1, r2, c2)) return state;
      const key = edgeKey(nodeId(r1, c1), nodeId(r2, c2));
      const exists = state.connections[key]?.active;
      if (exists) {
        const { [key]: _removed, ...rest } = state.connections;
        return { ...state, connections: rest };
      }
      return {
        ...state,
        connections: { ...state.connections, [key]: { active: true } },
      };
    }

    default:
      return state;
  }
}
