/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4fb',
          100: '#d7e6f4',
          200: '#b0cce9',
          300: '#83aeda',
          400: '#548ec7',
          500: '#2f70ae',
          600: '#245a91',
          700: '#1d4874',
          800: '#183b5e',
          900: '#102640',
          950: '#08182b',
        },
        steel: {
          50: '#f6f8fa',
          100: '#eaeff4',
          200: '#d3dde6',
          300: '#adbccc',
          400: '#7f95ac',
          500: '#5f7891',
          600: '#4a6178',
          700: '#3d4f61',
          800: '#354352',
          900: '#2f3946',
          950: '#1e242e',
        },
        surface: {
          DEFAULT: '#ffffff',
          alt: '#f6f8fa',
          raised: '#ffffff',
          sunken: '#eef2f6',
          inverse: '#0f1720',
        },
        line: {
          DEFAULT: '#e2e8f0',
          soft: '#eef2f6',
          strong: '#cbd5e1',
        },
        ink: {
          primary: '#0f1720',
          secondary: '#334155',
          muted: '#64748b',
          faint: '#94a3b8',
          inverse: '#f8fafc',
        },
        signal: {
          ok: '#059669',
          'ok-soft': '#ecfdf5',
          watch: '#b45309',
          'watch-soft': '#fffbeb',
          risk: '#dc2626',
          'risk-soft': '#fef2f2',
          critical: '#991b1b',
          info: '#2f70ae',
          'info-soft': '#eff6ff',
          neutral: '#475569',
          'neutral-soft': '#f1f5f9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.02em' }],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(15, 23, 42, 0.04), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        raised: '0 1px 2px 0 rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
        panel: '0 8px 24px -8px rgba(15, 23, 42, 0.16), 0 2px 4px 0 rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        DEFAULT: '4px',
      },
    },
  },
  plugins: [],
};
