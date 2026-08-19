/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./views/**/*.{vue,js,ts,jsx,tsx}",
    "./components/**/*.{vue,js,ts,jsx,tsx}",
    "./services/**/*.{vue,js,ts,jsx,tsx}",
    "./utils/**/*.{vue,js,ts,jsx,tsx}",
    "./App.vue",
    "./main.js",
    "./router.js",
    "./store.js",
  ],
  theme: {
    extend: {
      colors: {
        'emerald-50': '#e6f6ee',
        'emerald-100': '#ccede0',
        'emerald-500': '#00a758',
        'emerald-600': '#00964f',
        'emerald-700': '#008646',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      }
    },
  },
  plugins: [],
}