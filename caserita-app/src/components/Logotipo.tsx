/**
 * Logotipo de Caserita.
 *
 * La "i" se escribe sin punto (ı) y el punto se dibuja aparte, en naranja:
 * es el guiño de la identidad visual y va idéntico al del deck del pitch.
 * El color del texto se hereda, para poder usarlo en verde sobre crema y en
 * crema sobre verde sin tocar el componente.
 */
export default function Logotipo({ className = '' }: { className?: string }) {
  return (
    // role="img" + aria-label: sin esto el lector de pantalla leería dos veces
    // el nombre (el texto visible y la etiqueta), y la "ı" sin punto suelta.
    <span
      role="img"
      aria-label="Caserita"
      className={`inline-block font-extrabold tracking-[-0.035em] ${className}`}
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
}
