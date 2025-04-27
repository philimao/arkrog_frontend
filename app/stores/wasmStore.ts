import { create } from "zustand/index";
import { devtools } from "zustand/middleware";
import { toast } from "react-toastify";

type WasmStore = {
  instances: Record<string, EmscriptenModule>;
  getInstance: (filename: string) => Promise<EmscriptenModule>;
};

export const useWasmStore = create<WasmStore>()(
  devtools(
    (set, get) => ({
      instances: {},
      getInstance: async (filename: string) => {
        const _instance = get().instances[filename];
        if (_instance) return _instance;

        const wasmBaseUrl =
          import.meta.env.VITE_WASM_URL ||
          import.meta.env.VITE_API_BASE_URL + "/wasm";
        const scriptUrl = `${wasmBaseUrl}/${filename}.es6.js`;

        return await import(/* @vite-ignore */ scriptUrl)
          .then((module) => module.default())
          .then((instance) => {
            set(
              (state) => ({
                ...state,
                instances: { ...state.instances, [filename]: instance },
              }),
              undefined,
              "getInstance",
            );
            return instance;
          })
          .catch((err) => {
            console.error(err);
            toast.error(`Failed to load WASM script: ${scriptUrl}`);
          });
      },
    }),
    { name: "wasm" },
  ),
);
