import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.035em',
        tight: '-0.02em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
      },
      colors: {
        brand: {
          primary: 'var(--brand-primary, #003629)',
          emerald: 'var(--brand-emerald, #1B4D3E)',
          'emerald-light': '#8ABDA9',
          evergreen: 'var(--brand-evergreen, #0D2218)',
          'evergreen-mid': '#133E2B',
          mint: 'var(--brand-mint, #34D399)',
          'mint-dark': '#006C4B',
          'mint-light': '#64F9BC',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          canvas: 'var(--surface-canvas, #F4F5F4)',
          card: '#FFFFFF',
          dim: '#E2E8F0',
          low: '#F1F5F9',
          subtle: '#F8FAFC',
          container: '#F1F5F9',
          high: '#E2E8F0',
          highest: '#CBD5E1',
          dark: '#0D2218',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
          onSurface: '#0F172A',
          onVariant: '#334155',
        },
        border: {
          DEFAULT: '#E2E8F0',
          subtle: '#E2E8F080',
          divider: '#F1F5F9',
          outline: '#94A3B8',
          'outline-variant': '#CBD5E1',
        },
        status: {
          completed: {
            bg: '#E8F8F0',
            text: '#1B4D3E',
          },
          progress: {
            bg: '#FEF3C7',
            text: '#92400E',
          },
          pending: {
            bg: '#F1F5F9',
            text: '#475569',
          },
          error: {
            DEFAULT: '#EF4444',
            bg: '#FEE2E2',
            text: '#991B1B',
          },
        },
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card-hover': '0 10px 24px -4px rgba(13, 34, 24, 0.08), 0 4px 6px -2px rgba(13, 34, 24, 0.04)',
        glow: '0 0 20px -3px rgba(52, 211, 153, 0.15)',
        'glow-dark': '0 12px 32px -8px rgba(13, 34, 24, 0.45)',
        'glow-emerald': '0 12px 32px -8px rgba(27, 77, 62, 0.35)',
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};

export default config;
