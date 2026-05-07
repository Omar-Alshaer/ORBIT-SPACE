import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orbit: {
          orange: "#FF7A00",
          amber: "#FFB347",
          ink: "#0D1117",
          panel: "#161B22",
          paper: "#F7F8FA",
          text: "#E6EDF3",
          coal: "#0B0F14",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-orbit)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        orbit: "0 24px 80px rgba(255, 122, 0, 0.18)",
      },
      keyframes: {
        "star-drift": {
          "0%": { transform: "translate3d(0, 0, 0)" },
          "100%": { transform: "translate3d(-160px, 120px, 0)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.9" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -18px, 0)" },
        },
      },
      animation: {
        "star-drift": "star-drift 34s linear infinite",
        twinkle: "twinkle 3.4s ease-in-out infinite",
        orbit: "orbit 30s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
