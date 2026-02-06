/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}', // include if you use pages folder
  ],
  darkMode: 'media', // automatically uses prefers-color-scheme
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        vibeBlue: '#3b82f6',
        vibeGreen: '#10b981',
        vibeYellow: '#facc15',
      },
      fontFamily: {
        sans: ['Geist Sans', 'Arial', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      boxShadow: {
        vibeGlow: '0 0 15px rgba(59, 130, 246, 0.5)',
      },
      animation: {
        pulseSlow: 'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
