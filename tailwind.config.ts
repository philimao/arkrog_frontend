import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

export default {
  content: [
    "./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundColor: {
        "page-nav-hover": "#D9D9D9",
        "ak-blue": "#18D1FF",
        "ak-deep-blue": "#0691CD",
        "light-gray": "#D9D9D9",
        "dark-gray": "#242424",
        "black-gray": "#181818",
      },
      colors: {
        "ak-blue": "#18D1FF",
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
    },
  },
  darkMode: "class",
  plugins: [heroui()],
} satisfies Config;
