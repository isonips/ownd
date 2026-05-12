import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        panel: "#141414",
        border: "#222",
        own: "#6DD0A9",
        contested: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Inter"],
      },
    },
  },
  plugins: [],
};
export default config;
