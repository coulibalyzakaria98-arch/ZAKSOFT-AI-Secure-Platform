/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyan:   '#00f5d4',
        violet: '#7c3aed',
        bg1:    '#050e1f',
        bg2:    '#0a1628',
        bg3:    '#0d2145',
        red:    '#ef4444',
        green:  '#22c55e',
        amber:  '#f59e0b',
      },
      fontFamily: {
        body:    ['Inter', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'spin-slow': 'spin 1.2s linear infinite',
        'fade-in':   'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}


