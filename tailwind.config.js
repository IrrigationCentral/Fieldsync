/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'field-primary': '#2D5016',
        'field-secondary': '#8FBC3B',
        'field-accent': '#F4B942',
        'field-danger': '#C73E1D',
        'field-water': '#4A90A4',
        'field-soil': '#8B6F47',
        'field-sky': '#87CEEB',
        'field-muted': '#9CA986',
        'field-bg': '#FEFDF8',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(143, 188, 59, 0.3)',
        'glow-lg': '0 0 40px rgba(143, 188, 59, 0.4)',
      }
    },
  },
  plugins: [],
}
