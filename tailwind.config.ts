import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          800: "#000000",
        },
      },
      zIndex: {
        10: "10",
        20: "20",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(to bottom, #07070799, #07070721 19.79%, #07070754 35.86%, #070707eb 80.02%, var(--neutral-800))",
      },
    },
  },
  plugins: [],
};

export default config;