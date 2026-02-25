import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          green: '#16a34a',
          red: '#dc2626',
          dark: '#0a0a0a',
          card: '#111111',
          border: '#1f1f1f',
        }
      }
    },
  },
  plugins: [],
}
export default config
