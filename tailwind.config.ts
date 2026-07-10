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
        'doggo-yellow':     '#FDC423',
        'doggo-red':        '#AA1126',
        'doggo-red-bright': '#ED0126',
        'doggo-dark':       '#1A1A1A',
        'doggo-dark2':      '#262626',
        'doggo-dark3':      '#2E2E2E',
        'doggo-gray':       '#6B6B6B',
        'doggo-light':      '#F5F5F5',
      },
    },
  },
  plugins: [],
}

export default config
