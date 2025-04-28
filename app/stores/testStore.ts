import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type N = 1 | 2 | 3 | 4;
interface Test {
  a: N;
  increment: () => void;
}

export const useTestStore = create<Test>()(
  devtools(
    immer(
      (set, get): Test => ({
        // widen literal to match N
        a: 1 as N,
        increment: () => {
          set((state) => {
            // ensure update remains within N
            state.a = (state.a + 1) as N;
          });
        },
      }),
    ),
    { name: "123" },
  ),
);
