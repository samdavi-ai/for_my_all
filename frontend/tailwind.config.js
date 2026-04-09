/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#2563EB', dark: '#1E40AF', light: '#60A5FA' },
        surface: { DEFAULT: '#0F172A', card: '#1E293B', elevated: '#334155' },
        accent: { green: '#059669', amber: '#D97706', rose: '#E11D48' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
