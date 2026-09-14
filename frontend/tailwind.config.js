/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#14213D',
        paper: '#F7F7F4',
        'verified-gold': '#B8923F',
        'growth-teal': '#2F6F62',
        slate: '#5B6472',
        hairline: '#DEDCD4',
        'alert-rust': '#B5482A'
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Lora', 'serif'],
      },
    },
  },
  plugins: [],
}

