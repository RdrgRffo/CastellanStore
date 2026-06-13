/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cuero': {
          50: '#f7f0ea',
          100: '#efe1d5',
          200: '#dfc3ab',
          300: '#cfa581',
          400: '#bf8757',
          500: '#8B5E3C',
          600: '#7a5235',
          700: '#6a462e',
          800: '#593a27',
          900: '#492e20',
        },
        'premium': {
          'white': '#FFFFFF',
          'gray-light': '#F5F5F5',
          'gray': '#E5E5E5',
          'gray-dark': '#6B6B6B',
          'black': '#1A1A1A',
        },
        'success': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        'danger': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Cormorant Garamond', 'Georgia', 'serif'],
        'anton': ['Anton', 'sans-serif'],
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        'premium': '2px',
      },
      boxShadow: {
        'premium': '0 1px 3px rgba(0,0,0,0.08)',
        'premium-lg': '0 4px 12px rgba(0,0,0,0.1)',
        'premium-hover': '0 8px 24px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
