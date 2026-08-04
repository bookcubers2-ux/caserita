import { useEffect, useState } from 'react'
import { generarQrSvg } from '../services/pago'
import { Skeleton } from './ui'

/** Solo el codigo QR, escaneable, generado en el cliente. */
export default function QrImagen({
  codigo,
  negocio,
  monto,
  atenuado = false,
}: {
  codigo: string
  negocio: string
  monto: number
  atenuado?: boolean
}) {
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    setSvg(null)
    generarQrSvg({ codigo, negocio, monto }).then((s) => vivo && setSvg(s))
    return () => {
      vivo = false
    }
  }, [codigo, negocio, monto])

  if (!svg) return <Skeleton className="size-[220px] rounded-2xl" />

  return (
    <div
      className={`size-[220px] transition-all [&>svg]:size-full ${
        atenuado ? 'scale-95 opacity-25 blur-[2px]' : ''
      }`}
      role="img"
      aria-label={`Código QR de pago por Bs ${monto}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
