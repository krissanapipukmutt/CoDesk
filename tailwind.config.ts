import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', '"Space Grotesk"', 'sans-serif'],
        display: ['"Space Grotesk"', '"IBM Plex Sans Thai"', 'sans-serif']
      },
      colors: {
        ink: '#10121A',
        haze: '#F4F7FB',
        sky: '#E6EDFF',
        indigo: '#3D5AFE',
        mint: '#34D399',
        rose: '#FB7185'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(12, 24, 64, 0.08)',
        glow: '0 8px 24px rgba(61, 90, 254, 0.2)'
      }
    }
  },
  plugins: []
} satisfies Config;
