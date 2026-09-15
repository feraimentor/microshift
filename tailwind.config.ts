import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        chumbo: {
          DEFAULT: "#1e293b",
          dark: "#0f172a",
          light: "#334155",
          muted: "#64748b",
        },
        calm: {
          bg: "#020617",
          card: "#0b1329",
          cardHover: "#121d38",
          surface: "#16203b",
          border: "#1e293b",
          borderSubtle: "#334155",
          text: "#f8fafc",
          muted: "#94a3b8",
          accent: "#10b981",
        },
      },
    },
  },
  plugins: [],
};
export default config;
