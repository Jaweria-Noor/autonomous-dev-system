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
        background: '#0a051b',
        panel: 'rgba(20, 10, 40, 0.65)',
        primary: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        accent: {
          pink: '#ec4899',
          purple: '#d946ef',
          cyan: '#06b6d4',
        }
      },
      boxShadow: {
        'neon-purple': '0 0 15px rgba(139, 92, 246, 0.4)',
        'neon-pink': '0 0 15px rgba(236, 72, 153, 0.4)',
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.4)',
      }
    },
  },
  plugins: [],
}
