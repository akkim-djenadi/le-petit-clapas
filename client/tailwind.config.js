/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:       { DEFAULT: '#1C3A5E', light: '#2E5F8A', dark: '#0F2138' },
        terracotta: { DEFAULT: '#C4603A', light: '#D4785A', dark: '#A04A28' },
        sand:       { DEFAULT: '#F2C078', light: '#F7D9A8', dark: '#D4A050' },
        cream:      { DEFAULT: '#F2EDE4', dark: '#E8E0D0' },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
