import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          800: "#000000", // Define the neutral color used in your gradient
        },
      },
      zIndex: {
        10: "10",
        20: "20",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(to bottom, #07070799, #07070721 19.79%, #07070754 35.86%, #070707eb 80.02%, var(--neutral--800))",
      },
    },
  },
  plugins: [],
} satisfies Config;