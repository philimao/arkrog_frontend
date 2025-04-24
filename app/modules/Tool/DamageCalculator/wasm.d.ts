declare module "/wasm/*.js" {
  interface EmscriptenModule {
    instance: WebAssembly.Instance;
  }
  export default function init(options: {
    locateFile: (path: string) => string;
  }): Promise<EmscriptenModule>;
}
