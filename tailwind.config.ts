import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce7ff',
          200: '#b9cfff',
          300: '#86adff',
          400: '#537dff',
          500: '#2d56f5',
          600: '#1a36e0',
          700: '#1428b8',
          800: '#172495',
          900: '#182476',
          950: '#111649',
        },
        heritage: {
          navy: '#1a2744',
          gold: '#c8a84b',
          lightgold: '#f0e0a0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        print: { raw: 'print' },
      },
    },
  },
  plugins: [],
}

export default config
