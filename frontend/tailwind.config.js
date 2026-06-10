/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paletă inspirată din sigla USU (Universitatea Ștefan cel Mare Suceava)
        brand: {
          50: '#eef4fb',
          100: '#d7e6f6',
          200: '#b3cdec',
          300: '#8ec5e8',
          400: '#5a93cf',
          500: '#3b6fb5',
          600: '#2c5499',
          700: '#1f4a8f',
          800: '#1a3b73',
          900: '#162f5c',
        },
        usu: {
          dark: '#1f4a8f',
          light: '#8ec5e8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'card-hover': '0 10px 30px -10px rgba(31,74,143,0.25)',
        glow: '0 0 0 3px rgba(142,197,232,0.35)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        floatUp: 'floatUp 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}
