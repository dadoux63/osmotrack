/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#f7f5f2',
        brand: {
          DEFAULT: '#185FA5',
          dark: '#0f172a',
          light: '#2d7fc8',
          pale: '#dbeafe',
        },
        status: {
          urgent: '#dc2626',
          bientot: '#d97706',
          ok: '#16a34a',
          info: '#185FA5',
        }
      },
      fontFamily: {
        serif: ['Palatino Linotype', 'Palatino', 'Book Antiqua', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-mineral': 'linear-gradient(135deg, #f7f5f2 0%, #eef2f7 100%)',
      }
    },
  },
  plugins: [],
}
