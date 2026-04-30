/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        golden: {
          DEFAULT: "#C8A951",
          light: "#D4B86A",
          dark: "#D4A843",
          50: "#FDF8EC",
          100: "#F9EDCC",
          500: "#C8A951",
          600: "#D4A843",
          700: "#B8952E",
        },
        navy: {
          DEFAULT: "#1B2B4B",
          light: "#2A3F6B",
          dark: "#111D35",
          50: "#E8ECF3",
          500: "#1B2B4B",
          700: "#111D35",
          900: "#0A1122",
        },
        cream: {
          DEFAULT: "#FFF9F0",
          50: "#FFFDFB",
          100: "#FFF9F0",
          200: "#FFF3E0",
        },
      },
    },
  },
  plugins: [],
};
