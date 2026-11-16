/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mess: {
          bg: '#07111f',
          surface: '#101d2d',
          card: '#0e1a2b',
          border: '#1e293b',
          field: '#091421',
        }
      }
    },
  },
  plugins: [],
};
