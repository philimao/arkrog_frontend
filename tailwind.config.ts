import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";
import typography from "@tailwindcss/typography";

const colorExt = {
  "ak-blue": "var(--ak-blue)",
  "ak-deep-blue": "var(--ak-deep-blue)",
  "light-mid-gray": "var(--light-mid-gray)",
  "light-gray": "var(--light-gray)",
  "mid-gray": "var(--mid-gray)",
  "dark-gray": "var(--dark-gray)",
  "black-gray": "var(--black-gray)",
  "ak-purple": "var(--ak-purple)",
  "ak-dark-purple": "var(--ak-dark-purple)",
  "ak-red": "var(--ak-red)",
  "ak-dark-red": "var(--ak-dark-red)",
  "ak-pink": "var(--ak-pink)",
  "semi-black": "var(--semi-black)",
  "black-gray-70": "var(--black-gray-70)",
};

export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./app/**/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // 预生成一些常用颜色类，确保它们始终可用
    {
      pattern:
        /^text-(lime|emerald|green|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
    },
    // 预生成指针事件类，确保立即可用
    "pe-auto",
    "pe-none",
    "pointer-events-auto",
    "pointer-events-none",
  ],
  theme: {
    extend: {
      backgroundColor: {
        ...colorExt,
      },
      colors: {
        ...colorExt,
      },
      fontFamily: {
        sans: [
          '"Inter"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "0.5rem",
          sm: "0.5rem",
          md: "1rem",
          lg: "2rem",
          xl: "4rem",
          "2xl": "6rem",
        },
      },
      aspectRatio: {
        banner: "96/35",
      },
      lineHeight: {
        "12": "3rem",
      },
      boxShadow: {
        "outer-lg": "0 0 10px 2px currentColor",
        "outer-md": "0 0 8px 2px currentColor",
        "outer-sm": "0 0 5px 1px currentColor",
      },
    },
  },
  darkMode: "class",
  plugins: [heroui(), typography],
} satisfies Config;
