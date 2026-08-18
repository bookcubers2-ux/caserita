import Simbolo from './Simbolo'

/**
 * Logotipo de Caserita: el carrito y la palabra.
 *
 * La "i" se escribe sin punto (ı) y el punto se dibuja aparte, en naranja,
 * porque repite la etiqueta de remate. El interletrado va en -2%, como manda
 * la identidad visual. El color se hereda, para poder usarlo en verde sobre
 * crema y en crema sobre verde sin tocar el componente.
 */
export default function Logotipo({
  className = '',
  conSimbolo = false,
  claseSimbolo = 'h-[1.15em] w-auto',
}: {
  className?: string
  /** Muestra el carrito junto a la palabra. */
  conSimbolo?: boolean
  claseSimbolo?: string
}) {
  const palabra = (
    // role="img" + aria-label: sin esto el lector de pantalla leería dos veces
    // el nombre, y la "ı" sin punto suelta.
    <span
      role="img"
      aria-label="Caserita"
      className="inline-block font-extrabold tracking-[-0.02em]"
    >
      caser
      <span className="relative inline-block not-italic">
        ı
        <span
          className="absolute rounded-full bg-naranja"
          style={{ left: '0.045em', top: '0.215em', width: '0.165em', height: '0.165em' }}
        />
      </span>
      ta
    </span>
  )

  if (!conSimbolo) return <span className={`inline-block ${className}`}>{palabra}</span>

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Simbolo className={claseSimbolo} />
      {palabra}
    </span>
  )
}
