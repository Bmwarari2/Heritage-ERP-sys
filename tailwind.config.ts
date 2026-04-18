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
        // Primary palette — sampled from the Heritage shield logo
        heritage: {
          50:  '#F3F7FB',
          100: '#E4EEF7',
          200: '#C7DCEC',
          300: '#9FC1DC',
          400: '#6FA0C6',
          500: '#4A82B0',
          600: '#3A6EA5', // primary blue (Heritage wordmark)
          700: '#2F5F8F',
          800: '#264D74',
          900: '#1E3A5F', // deepest brand navy
          950: '#14283F',
        },
        // Slate gray — from the darker side of the shield
        slate2: {
          50:  '#F5F6F8',
          100: '#E8EAEE',
          200: '#CED2DA',
          300: '#A9B1BD',
          400: '#7A8593',
          500: '#5C6772',
          600: '#4A535E',
          700: '#3A4350',
          800: '#2F3641',
          900: '#232931',
        },
        // Legacy aliases (kept so existing code keeps working)
        brand: {
          50:  '#F3F7FB',
          100: '#E4EEF7',
          200: '#C7DCEC',
          300: '#9FC1DC',
          400: '#6FA0C6',
          500: '#4A82B0',
          600: '#3A6EA5',
          700: '#2F5F8F',
          800: '#264D74',
          900: '#1E3A5F',
          950: '#14283F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        script: ['"Brush Script MT"', '"Segoe Script"', 'cursive'],
      },
      boxShadow: {
        soft:   '0 1px 2px 0 rgba(17, 24, 39, 0.04), 0 1px 3px 0 rgba(17, 24, 39, 0.06)',
        card:   '0 4px 6px -1px rgba(17, 24, 39, 0.06), 0 2px 4px -2px rgba(17, 24, 39, 0.04)',
        lifted: '0 10px 25px -5px rgba(30, 58, 95, 0.12), 0 8px 10px -6px rgba(30, 58, 95, 0.08)',
        inset:  'inset 0 1px 2px 0 rgba(17, 24, 39, 0.05)',
      },
      borderRadius: {
        xl:  '0.875rem',
        '2xl': '1.125rem',
      },
      screens: {
        xs: '480px',
        print: { raw: 'print' },
      },
      keyframes: {
        'fade-in':  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in':  'fade-in 180ms ease-out',
        'slide-up': 'slide-up 220ms ease-out',
      },
    },
  },
  plugins: [],
}

export default config
