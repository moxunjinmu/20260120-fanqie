import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "mica": "rgba(255, 255, 255, 0.72)",
        "mica-dark": "rgba(18, 18, 20, 0.6)",
      },
      boxShadow: {
        glass: "0 20px 60px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
