/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6200ea',
        secondary: '#03dac6',
        background: '#000000',
        surface: '#121212',
        error: '#cf6679',
        onPrimary: '#ffffff',
        onSecondary: '#000000',
        onBackground: '#ffffff',
        onSurface: '#ffffff',
        onError: '#000000',
      },
    },
  },
  plugins: [],
} 