/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
        display: ['"Rubik Mono One"', 'Heebo', 'sans-serif'],
        bones: ['"Rubik Wet Paint"', 'Heebo', 'cursive'],
        elegant: ['"Frank Ruhl Libre"', 'serif'],
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.6)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        up: { '0%': { transform: 'translateY(40px)', opacity: 0 }, '100%': { transform: 'none', opacity: 1 } },
        blink: { '0%,92%,100%': { transform: 'scaleY(1)' }, '95%': { transform: 'scaleY(.1)' } },
      },
      animation: { pop: 'pop .25s ease-out', up: 'up .22s ease-out', blink: 'blink 4s infinite' },
    },
  },
  plugins: [],
};
