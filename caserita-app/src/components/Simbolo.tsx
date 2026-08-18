/**
 * El símbolo de Caserita: el carrito de comida callejera.
 *
 * Reducido a dos colores y sin detalles, tal como manda la identidad visual:
 * techo, mostrador, marco y ruedas heredan el color del texto (verde sobre
 * crema, crema sobre verde), y las ollas y el cuerpo van siempre en naranja.
 * Así la misma pieza sirve para la versión principal y para la invertida.
 */
const NARANJA = '#F26522'

export default function Simbolo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="14 26 172 170"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* techo */}
      <path d="M18 60 L182 60 L166 30 L34 30 Z" fill="currentColor" />
      {/* postes */}
      <rect x="42" y="60" width="8" height="56" fill="currentColor" />
      <rect x="150" y="60" width="8" height="56" fill="currentColor" />
      {/* ollas */}
      <ellipse cx="74" cy="112" rx="18" ry="7" fill={NARANJA} />
      <ellipse cx="112" cy="112" rx="18" ry="7" fill={NARANJA} />
      {/* mostrador */}
      <rect x="30" y="114" width="140" height="18" rx="4" fill="currentColor" />
      {/* cuerpo del carrito */}
      <rect x="36" y="132" width="128" height="42" rx="4" fill={NARANJA} />
      <rect
        x="36"
        y="132"
        width="128"
        height="42"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
      />
      <rect x="97" y="132" width="6" height="42" fill="currentColor" />
      {/* ruedas */}
      <circle cx="62" cy="180" r="12" fill="currentColor" />
      <circle cx="138" cy="180" r="12" fill="currentColor" />
    </svg>
  )
}
