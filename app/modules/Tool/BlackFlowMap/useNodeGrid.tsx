import { useReducer, useCallback } from "react";
import { gridReducer } from "./gridReducer";
import type { GridState } from "./types";

export function useNodeGrid(initial: GridState) {
  const [state, dispatch] = useReducer(gridReducer, initial);

  const toggle = useCallback(
    (r1: number, c1: number, r2: number, c2: number) =>
      dispatch({ type: "TOGGLE", r1, c1, r2, c2 }),
    [],
  );
  const load = useCallback(
    (s: GridState) => dispatch({ type: "LOAD", state: s }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  return { state, toggle, load, clear };
}
