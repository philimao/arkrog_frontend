import { useEffect, useState } from "react";

export function useWasm(filename: string) {
  const [instance, setInstance] = useState<WebAssembly.Instance | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL;
    const scriptUrl = `${base}/wasm/${filename}.js`;

    (window as any).Module = {
      locateFile(path: string) {
        return `${base}/wasm/${path}`;
      },
      onRuntimeInitialized() {
        try {
          setInstance((window as any).Module.instance);
        } catch (e) {
          setError(e as Error);
        }
      },
    };

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onerror = () => {
      setError(new Error(`Failed to load WASM script: ${scriptUrl}`));
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      delete (window as any).Module;
    };
  }, [filename]);

  return { instance, error };
}
