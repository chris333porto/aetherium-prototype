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
        cinzel: ['Cinzel', 'serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
      },
      colors: {
        ae: {
          purple: '#9590ec',
          fire: '#e05a3a',
          air: '#d4853a',
          water: '#4a9fd4',
          earth: '#2db885',
        },
      },
      animation: {
        'spin-slow': 'spin 60s linear infinite',
        'spin-slow-reverse': 'spin 60s linear infinite reverse',
      },
    },
  },
  plugins: [],
}

export default config
