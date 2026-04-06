import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        soil: "#1f2a23",
        wheat: "#b38a54",
        leaf: "#4f6652",
        mist: "#f3eee6",
        bark: "#8a7a67",
      },
      fontFamily: {
        display: ["'Aptos'", "'Segoe UI'", "'Helvetica Neue'", "sans-serif"],
        body: ["'Aptos'", "'Segoe UI'", "'Helvetica Neue'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
