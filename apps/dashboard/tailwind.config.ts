import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'trolley-green': '#10b981',
        'trolley-yellow': '#f59e0b',
        'trolley-red': '#ef4444',
      },
    },
  },
  plugins: [],
}
export default config

