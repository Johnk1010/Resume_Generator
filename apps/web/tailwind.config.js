/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Space Grotesk'", "sans-serif"],
        body: ["'Manrope'", "sans-serif"]
      },
      colors: {
        ink: "#102025",
        cream: "#fffdf7",
        coral: "#f87b4f",
        teal: "#0d8a8f",
        mint: "#d3f0e4"
      },
      boxShadow: {
        glow: "0 10px 40px rgba(13,138,143,0.16)"
      }
    }
  },
  plugins: []
};

