import { create } from "zustand/index";
import { devtools } from "zustand/middleware";
import { toast } from "react-toastify";

type WasmStore = {
  instances: Record<string, EmscriptenModule>;
  getInstance: (filename: string) => Promise<EmscriptenModule>;
};

export const useWasmStore = create<WasmStore>()(
  devtools((set, get) => ({
    instances: {},
    getInstance: (filename: string) => {
      const _instance = get().instances[filename];
      if (_instance) return _instance;

      return new Promise((resolve) => {
        const wasmBaseUrl =
          import.meta.env.VITE_WASM_URL ||
          import.meta.env.VITE_API_BASE_URL + "/wasm";
        const scriptUrl = `${wasmBaseUrl}/${filename}.js`;

        window.Module = {
          locateFile(path: string) {
            return `${wasmBaseUrl}/${path}`;
          },
          onRuntimeInitialized() {
            try {
              const instance = window.Module;
              set((state) => ({
                ...state,
                instances: { ...state.instances, [filename]: instance },
              }));
              resolve(instance);
            } catch (err) {
              console.log(err);
              toast.error(
                `Failed to load wasm\n${(err as Error).name}: ${(err as Error).message}`,
              );
            }
          },
        };

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.onerror = () => {
          toast.error("Failed to load wasm");
        };
        document.body.appendChild(script);
      });
    },
  })),
);
