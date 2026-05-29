/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./*.js"],
  theme: {
    extend: {
      colors: {
        ink: '#070a14',
        neonpurple: '#9c4bff',
        neonblue: '#56d5ff',
        softblack: '#05070f'
      },
      boxShadow: {
        glow: '0 0 35px rgba(156, 75, 255, 0.18)',
        soft: '0 20px 60px rgba(0,0,0,0.35)'
      },
      backgroundImage: {
        'anime-dusk': 'radial-gradient(circle at top, rgba(156, 75, 255, 0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(86, 213, 255, 0.12), transparent 28%), linear-gradient(180deg, #08101f 0%, #040608 100%)'
      }
    }
  },
  plugins: []
}
