import { useState } from 'react'
import { ShoppingBasket } from 'lucide-react'

/**
 * Imagen con respaldo: si la foto no carga, en vez de un hueco blanco
 * muestra un marcador con la identidad de Caserita.
 */
export default function Foto({
  src,
  alt,
  className = '',
  eager = false,
}: {
  src: string
  alt: string
  className?: string
  eager?: boolean
}) {
  const [fallo, setFallo] = useState(false)

  if (fallo) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`grid place-items-center bg-brand-soft text-brand-dark/50 ${className}`}
      >
        <ShoppingBasket className="size-1/4 max-h-12 min-h-6" aria-hidden />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={800}
      height={600}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFallo(true)}
      className={className}
    />
  )
}
