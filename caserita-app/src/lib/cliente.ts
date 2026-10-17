/**
 * Identidad del vecino sin login: un id al azar guardado en este celular,
 * más su nombre y teléfono para que la casera sepa a quién le entrega.
 */
const CLAVE_ID = 'caserita:cliente-id'
const CLAVE_DATOS = 'caserita:cliente-datos'

function nuevoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function clienteId(): string {
  try {
    const guardado = localStorage.getItem(CLAVE_ID)
    if (guardado) return guardado
    const id = nuevoId()
    localStorage.setItem(CLAVE_ID, id)
    return id
  } catch {
    return 'sin-almacenamiento-' + nuevoId()
  }
}

export interface DatosCliente {
  nombre: string
  telefono: string
}

export function datosCliente(): DatosCliente {
  try {
    const crudo = localStorage.getItem(CLAVE_DATOS)
    if (crudo) return JSON.parse(crudo) as DatosCliente
  } catch {
    // sin datos guardados
  }
  return { nombre: '', telefono: '' }
}

export function guardarDatosCliente(d: DatosCliente): void {
  try {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(d))
  } catch {
    // sin espacio: la sesión sigue en memoria
  }
}
