import { reactRouter } from "@react-router/dev/vite";
// import autoprefixer from "autoprefixer";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import babel from "vite-plugin-babel";

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
  // css: {
  //   postcss: {
  //     plugins: [tailwindcss, autoprefixer],
  //   },
  //   devSourcemap: true,
  // },
  build: {
    sourcemap: "hidden",
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    // 仅开发模式：styled-components 类名嵌入组件名（Banner__StyledDots-sc-xxx），生产保持短哈希
    // 注意：include 必须显式给出，默认值只匹配 .jsx? 会漏掉全部 .tsx
    babel({
      apply: "serve",
      include: /[\\/]app[\\/].*\.[jt]sx?$/,
      exclude: /node_modules/,
      babelConfig: {
        babelrc: false,
        configFile: false,
        presets: ["@babel/preset-typescript"],
        plugins: [
          ["babel-plugin-styled-components", { displayName: true, fileName: true, ssr: false }],
        ],
      },
    }),
  ],
});

