import type { Config } from 'tailwindcss';

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
          100: '#dde5ff',
          200: '#c3cfff',
          300: '#9eadff',
          400: '#7580ff',
          500: '#5558f8',
          600: '#4338ee',
          700: '#3829d5',
          800: '#2f25aa',
          900: '#2a2486',
          950: '#19154e',
        },
        navy: { 
          DEFAULT: '#1B4B8A', 
          dark: '#0D2D57', 
          deeper: '#071A35' 
        },
        mint: { 
          DEFAULT: '#52C99A', 
          light: '#A8E6CE', 
          pale: '#E1F5EE', 
          dark: '#0F6E56' 
        },
        cream: '#F7F5F0',
        dark: {
          50:  '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b1bac9',
          400: '#8795ab',
          500: '#677891',
          600: '#536178',
          700: '#444f62',
          800: '#3b4452',
          900: '#343b47',
          950: '#0d1117',
        },
        fraud: {
          red:    '#ef4444',
          orange: '#f97316',
          yellow: '#eab308',
          green:  '#22c55e',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-in-out',
        'slide-up':    'slideUp 0.3s ease-out',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':        'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(85,88,248,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(85,88,248,0.7)' },
        },
      },
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-dark':     'linear-gradient(135deg, #0d1117 0%, #161b27 50%, #1a1f2e 100%)',
        'gradient-card':     'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'gradient-brand':    'linear-gradient(135deg, #5558f8 0%, #4338ee 100%)',
        'gradient-fraud':    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'gradient-safe':     'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

export default config;
