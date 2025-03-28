// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooksPlugin from "eslint-plugin-react-hooks"; // 新增插件导入[1,6](@ref)

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  // React Hooks 专用配置
  {
    files: ["**/*.tsx"], // 仅针对 TSX 文件生效
    plugins: {
      "react-hooks": reactHooksPlugin, // 注册 React Hooks 插件[4,6](@ref)
    },
    rules: reactHooksPlugin.configs.recommended.rules, // 启用推荐规则集
    settings: {
      react: {
        version: "detect", // 自动检测 React 版本[4,5](@ref)
      },
    },
  },
);
