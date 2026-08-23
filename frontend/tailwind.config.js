/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#030712',
          900: '#0f172a',
          850: '#131d35',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
        indigo: {
          600: '#4f46e5',
          500: '#6366f1',
          400: '#818cf8',
        },
        emerald: {
          500: '#10b981',
          400: '#34d399',
          950: '#022c22',
        },
        amber: {
          500: '#f59e0b',
          400: '#fbbf24',
          950: '#451a03',
        },
        rose: {
          500: '#f43f5e',
          400: '#fb7185',
          950: '#4c0519',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
