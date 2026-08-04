import type {
  BolsaConVendedor,
  Delivery,
  EstadoPago,
  MetodoPago,
  Publicacion,
  ReservaConBolsa,
  Usuario,
} from '../types'
import { ErrorApi } from './errores'
import * as local from './localApi'

/**
 * Cliente de datos de Caserita.
 *
 * - Si se define VITE_API_URL, habla por red con el backend Express desplegado.
 * - Si NO se define (lo normal en la demo de Vercel), usa un backend que corre
 *   dentro del navegador (services/localApi.ts) con los mismos datos y la misma
 *   lógica, guardando en localStorage. Así la app funciona sola, sin servidor.
 */
const BASE = import.meta.env.VITE_API_URL ?? ''
const USAR_LOCAL = BASE.trim() === ''

export { ErrorApi }

async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}/api${ruta}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    })
  } catch {
    throw new ErrorApi('No pudimos conectar con el servidor de Caserita', 0)
  }

  if (res.status === 204) return undefined as T
  const cuerpo = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ErrorApi(cuerpo?.error ?? 'Algo salió mal en el servidor', res.status)
  }
  return cuerpo as T
}

export const getBolsas = () =>
  USAR_LOCAL ? local.getBolsas() : pedir<BolsaConVendedor[]>('/bolsas')

export const getBolsa = (id: string) =>
  USAR_LOCAL ? local.getBolsa(id) : pedir<BolsaConVendedor>(`/bolsas/${id}`)

export const getReservas = () =>
  USAR_LOCAL ? local.getReservas() : pedir<ReservaConBolsa[]>('/reservas')

export const crearReserva = (bolsaId: string, metodoPago: MetodoPago) =>
  USAR_LOCAL
    ? local.crearReserva(bolsaId, metodoPago)
    : pedir<ReservaConBolsa>('/reservas', {
        method: 'POST',
        body: JSON.stringify({ bolsaId, metodoPago }),
      })

export const actualizarPago = (id: string, estado: EstadoPago, referencia?: string) =>
  USAR_LOCAL
    ? local.actualizarPago(id, estado, referencia)
    : pedir<ReservaConBolsa>(`/reservas/${id}/pago`, {
        method: 'PATCH',
        body: JSON.stringify({ estado, referencia }),
      })

export const marcarRecogidaApi = (id: string) =>
  USAR_LOCAL
    ? local.marcarRecogidaApi(id)
    : pedir<ReservaConBolsa>(`/reservas/${id}/recogida`, { method: 'PATCH' })

export const cancelarReservaApi = (id: string) =>
  USAR_LOCAL ? local.cancelarReservaApi(id) : pedir<void>(`/reservas/${id}`, { method: 'DELETE' })

export const getPublicaciones = () =>
  USAR_LOCAL ? local.getPublicaciones() : pedir<Publicacion[]>('/publicaciones')

export const crearPublicacion = (datos: Omit<Publicacion, 'id' | 'vendidas' | 'estado'>) =>
  USAR_LOCAL
    ? local.crearPublicacion(datos)
    : pedir<Publicacion>('/publicaciones', { method: 'POST', body: JSON.stringify(datos) })

export const crearDelivery = (reservaId: string) =>
  USAR_LOCAL
    ? local.crearDelivery(reservaId)
    : pedir<Delivery>('/deliveries', { method: 'POST', body: JSON.stringify({ reservaId }) })

export const getDelivery = (id: string) =>
  USAR_LOCAL ? local.getDelivery(id) : pedir<Delivery>(`/deliveries/${id}`)

export const getUsuario = () => (USAR_LOCAL ? local.getUsuario() : pedir<Usuario>('/usuario'))

export const reiniciarServidor = () =>
  USAR_LOCAL ? local.reiniciarServidor() : pedir<{ ok: true }>('/reiniciar', { method: 'POST' })
