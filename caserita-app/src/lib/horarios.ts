/**
 * Las ventanas de recojo son horas fijas del negocio (una panadería saca su
 * excedente a las 18:00 todos los días). Si la ventana de hoy ya pasó, la
 * siguiente es la de mañana: eso se calcula acá para que la app nunca diga
 * "Recoge hoy 10:30" a las nueve de la noche.
 */
export interface Ventana {
  /** 'Hoy' o 'Mañana' según la hora actual. */
  dia: 'Hoy' | 'Mañana'
  /** true si la ventana de hoy ya se cerró. */
  esManana: boolean
  /** Ej: "Hoy 18:00–19:00". */
  etiqueta: string
}

function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function ventanaDeRecojo(inicio: string, fin: string, ahora = new Date()): Ventana {
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()
  const esManana = aMinutos(fin) <= minutosAhora
  const dia = esManana ? 'Mañana' : 'Hoy'
  return { dia, esManana, etiqueta: `${dia} ${inicio}–${fin}` }
}

/** Minutos que faltan para que abra la ventana (0 si ya está abierta). */
export function minutosParaAbrir(inicio: string, fin: string, ahora = new Date()): number {
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()
  const i = aMinutos(inicio)
  if (aMinutos(fin) <= minutosAhora) return 24 * 60 - minutosAhora + i
  return Math.max(0, i - minutosAhora)
}
