import type { EmscriptenModule } from "@types/emscripten";
import type { CalculatorOutput } from "~/types/gameData";

declare global {
  interface Window {
    Module: EmscriptenModule;
  }

  interface WasmModule extends EmscriptenModule {
    calculator: (props: string) => CalculatorOutput;
  }
}
export {};
