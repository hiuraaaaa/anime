/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e7ff",
          200: "#b4cfff",
          300: "#8fb7ff",
          400: "#6a9fff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a"
        }
      },
      boxShadow: {
        soft: "0 8px 24px rgba(15,23,42,0.06)"
      },
      borderRadius: {
        xl2: "1rem"
      }
    },
  },
  plugins: [],
};
