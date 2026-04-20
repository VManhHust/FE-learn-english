import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: 'class',
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
        // CSS variable-based colors for global dark mode
        app: {
          bg: {
            primary: 'var(--bg-primary)',
            secondary: 'var(--bg-secondary)',
            tertiary: 'var(--bg-tertiary)',
            cream: 'var(--bg-cream)',
            'cream-light': 'var(--bg-cream-light)',
            'cream-dark': 'var(--bg-cream-dark)',
          },
          text: {
            primary: 'var(--text-primary)',
            secondary: 'var(--text-secondary)',
            tertiary: 'var(--text-tertiary)',
            muted: 'var(--text-muted)',
          },
          border: {
            primary: 'var(--border-primary)',
            secondary: 'var(--border-secondary)',
            DEFAULT: 'var(--border-color)',
          },
          accent: {
            olive: 'var(--accent-olive)',
            gold: 'var(--accent-gold)',
          },
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
