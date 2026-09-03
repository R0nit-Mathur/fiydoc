/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#F0FAF8",
          100: "#E0F7F4",
          200: "#B8EFE7",
          500: "#00B39B",
          600: "#009E88",
          700: "#008C7A",
          900: "#004F45",
        },
        brand: {
          teal: "#00B39B",
          blue: "#1E58C8",
          navy: "#0F2454",
        },
        royal: {
          50: "#F4F8FE",
          100: "#EEF4FF",
          200: "#D4E2FD",
          500: "#1E58C8",
          600: "#1846A3",
          700: "#15429B",
          900: "#0C265B",
        },
      },
    },
  },
  plugins: [],
};
