/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: 'oklch(52.3% 0.135 144.2 / <alpha-value>)',
        'brand-dark': 'oklch(42.5% 0.116 144.3 / <alpha-value>)',
        'brand-soft': 'oklch(95.7% 0.021 147.6 / <alpha-value>)',
        ink: 'oklch(27.8% 0.03 256.8 / <alpha-value>)',
        ubicacion: 'oklch(54.6% 0.215 262.9 / <alpha-value>)',
        ambar: 'oklch(76.1% 0.117 70.9 / <alpha-value>)',
        'ambar-soft': 'oklch(96.2% 0.038 84 / <alpha-value>)',
        'ambar-ink': 'oklch(48% 0.095 68 / <alpha-value>)',
        destructive: 'oklch(57.7% 0.245 27.325 / <alpha-value>)',
        tan: 'oklch(73.7% 0.086 76.5 / <alpha-value>)',
        terracota: 'oklch(70.9% 0.112 50.5 / <alpha-value>)',
        surface: 'oklch(96.9% 0.003 128.5 / <alpha-value>)',
        background: 'oklch(100% 0 0 / <alpha-value>)',
        card: 'oklch(100% 0 0 / <alpha-value>)',
        'primary-foreground': 'oklch(100% 0 0 / <alpha-value>)',
        'muted-foreground': 'oklch(55.1% 0.023 264.4 / <alpha-value>)',
        border: 'oklch(92.8% 0.006 264.5 / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 oklch(0.278 0.03 256.8 / 0.06), 0 8px 24px 0 oklch(0.278 0.03 256.8 / 0.06)',
        lift: '0 10px 24px -8px oklch(0.278 0.03 256.8 / 0.30)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '60%': { transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        rise: 'rise 0.4s ease both',
        pop: 'pop 0.35s ease both',
      },
    },
  },
  plugins: [],
}
