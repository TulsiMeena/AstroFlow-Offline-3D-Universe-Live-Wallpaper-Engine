/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hyper: {
          cyan: '#00F0FF',
          purple: '#7000FF',
          neon: '#00FFA3',
          pink: '#FF007F'
        }
      }
    },
  },
  plugins: [],
}
