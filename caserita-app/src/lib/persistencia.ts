/**
 * Guarda el estado de la app en el navegador para que sobreviva a una recarga.
 * Cuando exista backend, esto pasa a ser solo una cache local.
 */
const CLAVE = 'caserita:v2'
const CLAVES_VIEJAS = ['caserita:v1']

export interface EstadoGuardado {
  reservas: unknown[]
  publicaciones: unknown[]
  deliveries: unknown[]
  reservadas: Record<string, number>
  usuario: unknown
  rol: string
  vistoOnboarding: boolean
  /** Día en que se guardó, en formato AAAA-MM-DD. */
  guardadoEl: string
}

export function hoy(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Devuelve el estado guardado solo si es de HOY. Las bolsas son excedente
 * del día: arrastrar las reservas y el stock consumido de ayer dejaría la
 * app degradada sin que nadie entienda por qué. Lo único que sí perdura
 * entre días es que ya se vio el tour.
 */
export function leerEstado(): Partial<EstadoGuardado> | null {
  try {
    CLAVES_VIEJAS.forEach((c) => localStorage.removeItem(c))
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return null

    const datos = JSON.parse(crudo) as Partial<EstadoGuardado>
    if (!datos || typeof datos !== 'object') return null

    if (datos.guardadoEl !== hoy()) {
      return { vistoOnboarding: datos.vistoOnboarding === true }
    }

    // Validación mínima de forma: si un campo no tiene el tipo esperado se
    // descarta ese campo, no todo el estado.
    return {
      reservas: Array.isArray(datos.reservas) ? datos.reservas : undefined,
      publicaciones: Array.isArray(datos.publicaciones) ? datos.publicaciones : undefined,
      deliveries: Array.isArray(datos.deliveries) ? datos.deliveries : undefined,
      reservadas:
        datos.reservadas && typeof datos.reservadas === 'object' ? datos.reservadas : undefined,
      usuario: datos.usuario && typeof datos.usuario === 'object' ? datos.usuario : undefined,
      rol: datos.rol === 'vendedor' || datos.rol === 'comprador' ? datos.rol : undefined,
      vistoOnboarding: datos.vistoOnboarding === true,
    }
  } catch {
    // JSON corrupto, modo incógnito o almacenamiento bloqueado: arrancamos limpio.
    return null
  }
}

export function guardarEstado(estado: Omit<Partial<EstadoGuardado>, 'guardadoEl'>): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ ...estado, guardadoEl: hoy() }))
  } catch {
    /* cuota llena o almacenamiento no disponible: seguimos sin persistencia */
  }
}

export function borrarEstado(): void {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* nada que hacer */
  }
}
