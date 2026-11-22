import type { Config } from "tailwindcss";

// 色・角丸・影・フォントは design-tokens.css の CSS 変数だけを参照する。
// 直書き（#xxxxxx や Tailwind 既定色）はしない。
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        "on-primary": "var(--color-on-primary)",
        brand: "var(--color-brand)",
        student: {
          DEFAULT: "var(--color-student)",
          bg: "var(--color-student-bg)",
        },
        farmer: {
          DEFAULT: "var(--color-farmer)",
          bg: "var(--color-farmer-bg)",
          solid: "var(--color-farmer-solid)",
        },
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        tint: "var(--color-tint)",
        border: "var(--color-border)",
        text: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-muted)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: {
          DEFAULT: "var(--color-danger)",
          bg: "var(--color-danger-bg)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      fontFamily: {
        heading: "var(--font-heading)",
        body: "var(--font-body)",
      },
    },
  },
  plugins: [],
};

export default config;
