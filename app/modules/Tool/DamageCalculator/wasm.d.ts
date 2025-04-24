import type { EmscriptenModule } from "@types/emscripten";

declare global {
  interface Window {
    Module: EmscriptenModule;
  }
}
export {};
