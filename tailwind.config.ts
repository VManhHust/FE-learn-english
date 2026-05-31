import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // shadcn/ui CSS variable colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
        },
        border: {
          DEFAULT: "var(--border)",
        },
        input: "var(--input)",
        ring: "var(--ring)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        // Project custom colors
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
          DEFAULT: "var(--accent)",
          gold: "#d4a853",
          foreground: "var(--accent-foreground)",
        },
        text: {
          primary: "#2c2c2c",
          secondary: "#4a4030",
          muted: "#7a7060",
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
