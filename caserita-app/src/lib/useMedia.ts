import { useEffect, useState } from 'react'

/**
 * Escucha una media query. Se usa para montar UNA sola versión de las
 * pantallas que llevan mapa: dejar la otra escondida con CSS crearía un
 * segundo mapa de Leaflet descargando tiles a la vez.
 */
export function useMedia(consulta: string): boolean {
  const [coincide, setCoincide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(consulta).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(consulta)
    const revisar = () => setCoincide(mq.matches)
    revisar()
    mq.addEventListener('change', revisar)
    // Respaldo: en algunos entornos el evento 'change' no llega al redimensionar.
    window.addEventListener('resize', revisar)
    return () => {
      mq.removeEventListener('change', revisar)
      window.removeEventListener('resize', revisar)
    }
  }, [consulta])

  return coincide
}

/** El corte donde la app pasa de columna de teléfono a layout de escritorio. */
export const useEsEscritorio = () => useMedia('(min-width: 1024px)')
