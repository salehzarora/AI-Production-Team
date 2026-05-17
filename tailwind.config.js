/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#070914',
          panel: '#0d1024',
          card: '#11142b',
          border: '#1f2347',
        },
        accent: {
          blue: '#5b8cff',
          violet: '#9b5bff',
          cyan: '#37e0ff',
          pink: '#ff5bd1',
          lime: '#7cff5b',
          gold: '#ffd45b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px 0 rgba(91, 140, 255, 0.25)',
        'glow-violet': '0 0 24px 0 rgba(155, 91, 255, 0.30)',
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at 50% 0%, rgba(91,140,255,0.18), transparent 60%)',
      },
    },
  },
  plugins: [],
};
