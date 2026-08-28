/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Comfortaa', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Metrophobic', 'sans-serif'],
        label: ['Public Sans', 'sans-serif'],
      },
      colors: {
        // Aura English Minimalist System Colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb', // Electric Blue
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
          950: '#0f172a',
        },
        electricBlue: '#2563eb',
        vibrantOrange: '#ea580c',
        neonGreen: '#059669',
        bgLight: '#f8fafc',
        textDark: '#0f172a',
        textMuted: '#64748b',
        // Game compatibility tokens mapped to clean theme
        game: {
          green: '#059669',
          'green-shadow': '#047857',
          red: '#dc2626',
          'red-shadow': '#b91c1c',
          yellow: '#ea580c',
          'yellow-shadow': '#c2410c',
          orange: '#ea580c',
          'orange-shadow': '#c2410c',
          purple: '#2563eb',
          'purple-shadow': '#1d4ed8',
          slate: '#e2e8f0',
          'slate-shadow': '#cbd5e1',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.06)',
        'glass-hover': '0 20px 40px -15px rgba(37, 99, 235, 0.15)',
        'glow-primary': '0 8px 30px rgba(37, 99, 235, 0.45)',
        'soft-sm': '0 2px 8px 0 rgba(15, 23, 42, 0.04)',
        'soft-md': '0 4px 16px 0 rgba(15, 23, 42, 0.06)',
        'soft-lg': '0 12px 32px 0 rgba(15, 23, 42, 0.08)',
        '3d-primary': '0 4px 0 0 #1d4ed8',
        '3d-orange': '0 4px 0 0 #c2410c',
        '3d-green': '0 4px 0 0 #047857',
        '3d-red': '0 4px 0 0 #b91c1c',
        '3d-yellow': '0 4px 0 0 #c2410c',
        '3d-purple': '0 4px 0 0 #1d4ed8',
        '3d-slate': '0 4px 0 0 #cbd5e1',
        '3d-dark': '0 4px 0 0 #0f172a',
        '3d-none': '0 0px 0 0 transparent',
      },
      borderRadius: {
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
