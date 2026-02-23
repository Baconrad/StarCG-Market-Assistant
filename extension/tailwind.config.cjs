/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './entrypoints/**/*.{html,vue,ts,js,jsx,tsx}',
    './components/**/*.{html,vue,ts,js,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans TC"', 'sans-serif'],
      },
      colors: {
        primary: '#c99b71',
        'primary-dark': '#b07f57',
        'primary-light': '#e8d5c8',
        'text-dark': '#2b1a10',
        'text-base': '#3b2b22',
        'text-muted': '#5a4536',
        'border-light': '#d6b089',
        'bg-light': '#fff8f2',
        'bg-lighter': '#f8eee7',
        'bg-base': '#f3e7de',
      }
    },
  },
  plugins: [],
}

