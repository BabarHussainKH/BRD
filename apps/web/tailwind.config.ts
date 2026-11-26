import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ubl: {
          blue: "#017DC5",
          dark: "#005F96",
          deep: "#0B3D66",
          soft: "#E8F4FB",
          sky: "#6FC9F9",
          red: "#CA242D",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "Tahoma", "sans-serif"],
        display: ["var(--font-sans)", "Segoe UI", "Tahoma", "sans-serif"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(11, 61, 102, 0.06), 0 8px 24px rgba(11, 61, 102, 0.06)",
      },
      fontSize: {
        bank: ["13px", { lineHeight: "1.45" }],
        "bank-sm": ["12px", { lineHeight: "1.4" }],
        "bank-xs": ["11px", { lineHeight: "1.35" }],
        "bank-lg": ["16px", { lineHeight: "1.35" }],
        "bank-xl": ["20px", { lineHeight: "1.25" }],
        "bank-2xl": ["24px", { lineHeight: "1.2" }],
      },
    },
  },
  plugins: [],
};

export default config;
