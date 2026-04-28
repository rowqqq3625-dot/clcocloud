import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "var(--bg-cream)",
        "cream-2": "var(--bg-cream-2)",
        peach: "var(--bg-peach)",
        dark: "var(--surface-dark)",
        "dark-2": "var(--surface-dark-2)",
        glass: "var(--surface-glass)",
        coral: "var(--coral)",
        "coral-hi": "var(--coral-hi)",
        "coral-lo": "var(--coral-lo)",
        live: "var(--live)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)"
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        serif: ["Georgia", "Times New Roman", "serif"]
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        coral: "var(--shadow-coral)"
      },
      borderRadius: {
        card: "20px",
        panel: "28px",
        pill: "999px"
      },
      transitionTimingFunction: {
        cinematic: "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "0.45", transform: "scale(0.78)" },
          "50%": { opacity: "1", transform: "scale(1.12)" }
        },
        scrollDot: {
          "0%, 100%": { transform: "scaleY(0.4)", opacity: "0.35" },
          "50%": { transform: "scaleY(1)", opacity: "1" }
        }
      },
      animation: {
        "pulse-dot": "pulseDot 1.5s ease-in-out infinite",
        "scroll-dot": "scrollDot 1.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
