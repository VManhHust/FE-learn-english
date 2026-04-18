import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#f5f0e8",
          light: "#faf8f3",
          dark: "#ede4d0",
        },
        olive: {
          DEFAULT: "#8a7d55",
          400: "#8a7d55",
          500: "#7a6d45",
          600: "#6a5d35",
        },
        accent: {
          DEFAULT: "#c8a84b",
          gold: "#c8a84b",
        },
        text: {
          primary: "#2c2c2c",
          secondary: "#4a4030",
          muted: "#7a7060",
        },
        border: {
          DEFAULT: "#e0d8c8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Merriweather", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
