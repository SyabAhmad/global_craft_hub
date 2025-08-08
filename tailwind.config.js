/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#d3756b',
          dark: '#c25d52',
        },
        secondary: {
          DEFAULT: '#e7dcca',
          dark: '#d3c2a8',
        },
        brand: {
          dark: '#5e3023',
          medium: '#8c5f53',
        },
        background: '#fff9f5',
      },
    },
  },
  plugins: [],
}