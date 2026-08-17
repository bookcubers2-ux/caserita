/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Paleta oficial de Caserita (identidad visual, agosto 2026). Los mismos
      // valores que el deck del pitch: la app y la presentación no pueden
      // verse como dos productos distintos.
      colors: {
        brand: '#167A3C', // Verde Casera: marca, botones, precio final
        'brand-dark': '#0E5A2B', // Verde oscuro: hover, sombras, fondos profundos
        'brand-soft': '#E4F3E8', // Verde claro: tarjetas de impacto
        naranja: '#F26522', // Naranja Remate: descuento y cifras clave
        'naranja-soft': '#FFE9DC',
        ink: '#17201A', // Carbón: titulares y texto
        'muted-foreground': '#5C6660', // Gris texto
        ubicacion: '#1B5FD1', // Azul Carrito: ubicación, íconos de pago
        ambar: '#FFC53D', // Amarillo Aguayo
        'ambar-soft': '#FFF3D6',
        'ambar-ink': '#8C5A1E',
        rosa: '#E5397A', // Solo en la franja aguayo
        destructive: '#D93A2B',
        background: '#FFF7EA', // Crema Marraqueta: nunca blanco puro
        surface: '#F7EEDD', // Crema un punto más profundo, para rellenos suaves
        card: '#FFFFFF',
        'primary-foreground': '#FFF7EA',
        border: '#E8E1D3',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        // Sombras en carbón (#17201A), no en azul: sobre crema, una sombra fría
        // ensucia el papel.
        card: '0 1px 2px 0 rgb(23 32 26 / 0.06), 0 8px 24px 0 rgb(23 32 26 / 0.06)',
        lift: '0 10px 24px -8px rgb(23 32 26 / 0.30)',
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
