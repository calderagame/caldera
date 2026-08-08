import type { Config } from "tailwindcss";

/** Caldera lava palette — globe HUD shell. */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#070707",
        ink: "#0c0c0c",
        panel: "#111111",
        line: "#2A2018",
        mist: "#888888",
        foam: "#F3F1EC",
        copper: "#FF6A00",
        copperDim: "#D84A05",
        gold: "#FF8A3D",
        claim: "#54D27A",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseCopper: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,106,0,0.35)" },
          "50%": { boxShadow: "0 0 0 8px rgba(255,106,0,0)" },
        },
      },
      animation: {
        ticker: "ticker 28s linear infinite",
        fadeUp: "fadeUp 0.7s ease-out both",
        pulseCopper: "pulseCopper 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
