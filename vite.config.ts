import { reactRouter } from "@react-router/dev/vite";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: true,
    },
    proxy: {
      "/api": {
        target: "https://dev.arkrog.com/api",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  // publicDir: false,
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
    devSourcemap: true,
  },
  build: {
    sourcemap: "hidden",
  },
  plugins: [reactRouter(), tsconfigPaths()],
});

