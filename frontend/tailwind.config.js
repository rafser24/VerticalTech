/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pastel: {
          bg: '#F8FAFC',
          primary: '#A7C7E7',
          secondary: '#CDEAC0',
          accent: '#FADADD',
          warning: '#FFF3CD',
          purple: '#E8D5F5',
          orange: '#FFE5CC',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0,0,0,0.06)',
        'card': '0 4px 20px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
