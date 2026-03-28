import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        soil: "#55331A",
        wheat: "#D8A84D",
        leaf: "#355E3B",
        mist: "#F8F1E7",
        bark: "#8D6A45"
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["'Trebuchet MS'", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;

