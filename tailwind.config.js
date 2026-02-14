/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './views/**/*.html', './assets/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        panel: '#3f3f46',
        gamebg: '#0d0f14',
        accent: '#22d3ee'
      }
    }
  },
  plugins: []
};
