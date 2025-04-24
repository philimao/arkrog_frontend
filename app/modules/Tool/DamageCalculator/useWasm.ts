import { useEffect, useState } from "react";

export function useWasm(filename: string) {
  const [instance, setInstance] = useState<WebAssembly.Instance | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL;
    const scriptUrl = `${base}/wasm/${filename}.js`;
    import(scriptUrl)
      .then((res) => {
        return res.default();
      })
      .then((res) => {
        setInstance(res);
      })
      .catch((err) => {
        console.error(err);
        setError(new Error(`Failed to load WASM script: ${scriptUrl}`))
      });
  }, [filename]);

  return { instance, error };
}
