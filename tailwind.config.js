/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/renderer/**/*.{html,js,ts}"],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#1a1625',
        'bg-darker': '#13111d',
        'bg-primary': '#201c2d',
        'text-primary': '#e0d9ff',
        'text-secondary': '#b794f6',
        'border': '#2d2454',
        'hover': '#9f7aea',
        'success': '#22c55e',
        'error': '#ef4444',
        'info': '#3c44b8'
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'cursive'],
        'mono': ['Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pixel-fade': 'pixelFade 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite'
      },
      keyframes: {
        pixelFade: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%, 100%': {
            'text-shadow': '0 0 10px #b794f6, 0 0 20px #b794f6'
          },
          '50%': {
            'text-shadow': '0 0 20px #9f7aea, 0 0 30px #9f7aea'
          }
        }
      }
    }
  },
  plugins: [],
}

