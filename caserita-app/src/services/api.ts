import type {
  BolsaConVendedor,
  Opinion,
  MetodoPago,
  Publicacion,
  ReservaConBolsa,
  SesionVendedor,
  Usuario,
} from '../types'
import { clienteId } from '../lib/cliente'
import { ErrorApi } from './errores'
import * as local from './localApi'

/**
 * Cliente de datos de Caserita.
 *
 * - En producción habla con /api del mismo dominio (función de Vercel + Postgres).
 * - Con VITE_API_URL definida habla con ese servidor (por ejemplo el local en :3001).
 * - En desarrollo sin VITE_API_URL usa el backend de demostración que corre
 *   dentro del navegador (services/localApi.ts), para poder tocar la app sin
 *   levantar nada.
 */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const USAR_LOCAL = BASE === '' && !import.meta.env.PROD && import.meta.env.VITE_MODO_DEMO !== 'no'

export { ErrorApi }
export const modoDemo = USAR_LOCAL

let tokenVendedor: string | null = null
export function fijarTokenVendedor(t: string | null) {
  tokenVendedor = t
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const cabeceras: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Cliente-Id': clienteId(),
    ...(opciones.headers as Record<string, string> | undefined),
  }
  if (tokenVendedor) cabeceras['X-Vendedor-Token'] = tokenVendedor

  let res: Response
  try {
    res = await fetch(`${BASE}/api${ruta}`, { ...opciones, headers: cabeceras })
  } catch {
    throw new ErrorApi('No pudimos conectar con el servidor de Caserita', 0)
  }

  if (res.status === 204) return undefined as T
  const cuerpo = await res.json().catch(() => null)
  if (!res.ok) throw new ErrorApi(cuerpo?.error ?? 'Algo salió mal en el servidor', res.status)
  return cuerpo as T
}

const json = (metodo: string, cuerpo?: unknown): RequestInit => ({
  method: metodo,
  body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
})

// ----------------------------------------------------------------- catálogo

export const getBolsas = () => (USAR_LOCAL ? local.getBolsas() : pedir<BolsaConVendedor[]>('/bolsas'))

export const getBolsa = (id: string) =>
  USAR_LOCAL ? local.getBolsa(id) : pedir<BolsaConVendedor>(`/bolsas/${id}`)

export const getOpiniones = (vendedorId: string) =>
  USAR_LOCAL ? local.getOpiniones(vendedorId) : pedir<Opinion[]>(`/vendedores/${vendedorId}/opiniones`)

// ----------------------------------------------------------------- reservas

export const getReservas = () => (USAR_LOCAL ? local.getReservas() : pedir<ReservaConBolsa[]>('/reservas'))

export const getReserva = (id: string) =>
  USAR_LOCAL ? local.getReserva(id) : pedir<ReservaConBolsa>(`/reservas/${id}`)

export const crearReserva = (
  bolsaId: string,
  metodoPago: MetodoPago,
  datos: { nombre: string; telefono: string; nota?: string },
) =>
  USAR_LOCAL
    ? local.crearReserva(bolsaId, metodoPago, datos)
    : pedir<ReservaConBolsa>('/reservas', json('POST', { bolsaId, metodoPago, ...datos }))

/** Manda la captura del pago (data URL JPEG) para que la verifiquemos en Telegram. */
export const subirComprobante = (id: string, imagen: string) =>
  USAR_LOCAL
    ? local.subirComprobante(id, imagen)
    : pedir<ReservaConBolsa>(`/reservas/${id}/comprobante`, json('POST', { imagen }))

export const pagarAlRecoger = (id: string) =>
  USAR_LOCAL ? local.pagarAlRecoger(id) : pedir<ReservaConBolsa>(`/reservas/${id}/efectivo`, json('PATCH'))

export const marcarRecogidaApi = (id: string) =>
  USAR_LOCAL ? local.marcarRecogidaApi(id) : pedir<ReservaConBolsa>(`/reservas/${id}/recogida`, json('PATCH'))

export const cancelarReservaApi = (id: string) =>
  USAR_LOCAL ? local.cancelarReservaApi(id) : pedir<void>(`/reservas/${id}`, json('DELETE'))

export const calificarApi = (id: string, estrellas: number, comentario: string) =>
  USAR_LOCAL
    ? local.calificarApi(id, estrellas, comentario)
    : pedir<ReservaConBolsa>(`/reservas/${id}/calificar`, json('POST', { estrellas, comentario }))

// ------------------------------------------------------------------ usuario

export const getUsuario = () => (USAR_LOCAL ? local.getUsuario() : pedir<Usuario>('/usuario'))

export const actualizarUsuario = (datos: { nombre: string; telefono: string }) =>
  USAR_LOCAL ? local.actualizarUsuario(datos) : pedir<Usuario>('/usuario', json('PUT', datos))

// ------------------------------------------------------------------- casera

export const entrarVendedor = (pin: string) =>
  USAR_LOCAL ? local.entrarVendedor(pin) : pedir<SesionVendedor>('/vendedor/entrar', json('POST', { pin }))

export const getPublicaciones = () =>
  USAR_LOCAL ? local.getPublicaciones() : pedir<Publicacion[]>('/publicaciones')

export const crearPublicacion = (datos: Omit<Publicacion, 'id' | 'vendidas' | 'estado'>) =>
  USAR_LOCAL ? local.crearPublicacion(datos) : pedir<Publicacion>('/publicaciones', json('POST', datos))

export const getPedidosVendedor = () =>
  USAR_LOCAL ? local.getPedidosVendedor() : pedir<ReservaConBolsa[]>('/vendedor/pedidos')

export const entregarPedido = (id: string) =>
  USAR_LOCAL ? local.entregarPedido(id) : pedir<ReservaConBolsa>(`/vendedor/pedidos/${id}/entregar`, json('PATCH'))

// --------------------------------------------------------------------- demo

export const reiniciarServidor = () =>
  USAR_LOCAL ? local.reiniciarServidor() : pedir<{ ok: true }>('/reiniciar', json('POST'))
