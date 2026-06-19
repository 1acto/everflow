/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        google: {
          blue: '#1a73e8',
          red: '#ea4335',
          yellow: '#fbbc05',
          green: '#34a853',
          teal: '#009688',
          bg: '#F8F9FA',
          darkBg: '#1F1F1F',
          darkCard: '#2D2D2D',
        }
      },
      fontFamily: {
        sans: ['"Google Sans"', '"Product Sans"', 'Roboto', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'google': '24px',
        'google-lg': '32px',
      }
    },
  },
  plugins: [],
}
