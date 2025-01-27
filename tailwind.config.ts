import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const colorExt = {
  "ak-blue": "#18D1FF",
  "ak-deep-blue": "#0691CD",
  "light-mid-gray": "#9A9A9A",
  "light-gray": "#D9D9D9",
  "mid-gray": "#444444",
  "dark-gray": "#242424",
  "black-gray": "#181818",
  "ak-purple": "#D533EB",
  "ak-red": "#EB3333",
};

export default {
  content: [
    "./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
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
          DEFAULT: "0",
          sm: "0.5rem",
          md: "1rem",
          lg: "2rem",
          xl: "4rem",
          "2xl": "6rem",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
} satisfies Config;
