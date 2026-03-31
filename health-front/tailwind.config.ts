import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.1rem",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
      },
      colors: {
        brand: {
          DEFAULT: "var(--brand-primary)",
          strong: "var(--brand-primary-strong)",
        },
      },
    },
  },
  plugins: [],
};

export default config;

