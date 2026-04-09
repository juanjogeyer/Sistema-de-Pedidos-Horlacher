/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#005CA9',
          'blue-dark': '#004a8a',
          'blue-light': '#e8f2fb',
          red: '#E30613',
          'red-dark': '#b8040f',
          'red-light': '#fde8e9',
        },
      }
    },
  },
  plugins: [],
}