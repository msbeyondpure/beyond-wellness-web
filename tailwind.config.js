/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Albert Sans', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          bg: '#1a1a1a',
          dark: '#111111',
          light: '#2a2a2a',
          accent: '#c45e2c',
          'accent-hover': '#d4713f',
          success: '#8b9a3e',
        }
      }
    }
  },
  plugins: [],
}

