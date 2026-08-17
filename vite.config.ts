import { reactRouter } from "@react-router/dev/vite";
// import autoprefixer from "autoprefixer";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import babel from "vite-plugin-babel";

// manualChunks 的分组表，见下方 build.rollupOptions 的注释
const VENDOR_REACT = ["react/", "react-dom/", "scheduler/", "react-router/"];
const VENDOR_UI = [
  "@heroui/",
  "@react-aria/",
  "@react-stately/",
  "@react-types/",
  "@internationalized/",
];

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
    // 2026-08-03：CDN 在故障期间把 index.html 缓存进了 /assets/ 下多个文件的
    // gzip 变体（源站不发 gzip，是 CDN 自己压的），刷新缓存清不掉该变体，
    // 浏览器必发 gzip 因而必中毒。换目录 = 换全部 URL，绕开所有投毒条目。
    // nginx 侧 assets 与 assets-v2 都会命中长缓存规则。
    assetsDir: "assets-v2",
    rollupOptions: {
      output: {
        // 2026-08-17 CDN 成本优化：一次 app 启动要拉 67 个 JS/CSS，占全站 CDN
        // 请求数 57%（HTTPS 请求数按次计费，是账单里更贵的一半）。碎片的来源是
        // heroui 依赖的 @react-aria/@react-stately 家族——几十个各自成块的小包，
        // rollup 因它们被多条路由共享而不肯合并。按库族显式归组后启动集合降到
        // 27 个，gzip 体积基本持平（436K → 448K）。
        //
        // 两个踩过的坑，改这里前先看：
        // 1. 不要加 vendor-misc 之类的兜底分组——会把只有懒加载路由才用的库
        //    拽进启动包（实测启动 gzip 436K → 818K）。
        // 2. 不要给 @blocknote/@tiptap 单独建组——启动链上有模块静态引用了它们
        //    的一小部分，一旦成组，整个 1.3MB 编辑器包会变成启动依赖。
        // 3. 不要开 experimentalMinChunkSize——文件数能再降到 20 个，但会把公共
        //    代码复制进各路由块，黑流图页 gzip 470K → 559K，不划算。
        manualChunks(id: string) {
          const marker = "node_modules/";
          const at = id.lastIndexOf(marker);
          if (at < 0) return undefined;
          // pnpm 的 .pnpm/<pkg>@<ver>/node_modules/<pkg> 布局下，取最后一段才是真包名
          const pkg = id.slice(at + marker.length);
          if (VENDOR_REACT.some((p) => pkg.startsWith(p))) return "vendor-react";
          if (VENDOR_UI.some((p) => pkg.startsWith(p))) return "vendor-ui";
          return undefined;
        },
      },
    },
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

