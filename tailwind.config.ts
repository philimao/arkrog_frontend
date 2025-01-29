import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const colorExt = {
  "ak-blue": "var(--ak-blue)",
  "ak-deep-blue": "var(--ak-deep-blue)",
  "light-mid-gray": "var(--light-mid-gray)",
  "light-gray": "var(--light-gray)",
  "mid-gray": "var(--mid-gray)",
  "dark-gray": "var(--dark-gray)",
  "black-gray": "var(--black-gray)",
  "ak-purple": "var(--ak-purple)",
  "ak-red": "var(--ak-red)",
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
