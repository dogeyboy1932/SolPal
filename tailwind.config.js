/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/screens/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
    "./index.html" // For web
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007AFF',
        secondary: '#8E8E93',
      },
    },
  },
  plugins: [],
}
