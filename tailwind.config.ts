import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102A43",
        muted: "#627D98",
        cream: "#F8FAFC",
        forest: { 50: "#ECFDF3", 100: "#D1FADF", 500: "#12B76A", 600: "#039855", 700: "#027A48", 900: "#054F31" },
        lake: { 50: "#EFF8FF", 100: "#D1E9FF", 500: "#2E90FA", 600: "#1570EF" },
      },
      boxShadow: {
        soft: "0 18px 45px -25px rgba(16, 42, 67, 0.35)",
        lift: "0 24px 48px -24px rgba(16, 42, 67, 0.28)",
      },
    },
  },
  plugins: [],
};
export default config;
