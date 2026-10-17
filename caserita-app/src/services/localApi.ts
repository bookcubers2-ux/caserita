/**
 * Backend de demostración de Caserita corriendo dentro del navegador.
 *
 * Replica la lógica del servidor (server/app.ts) guardando en localStorage,
 * para poder desarrollar y probar la app sin levantar nada. En producción no
 * se usa: ahí la app habla con /api (ver services/api.ts).
 *
 * La verificación del comprobante, que en producción la hace una persona
 * desde Telegram, aquí se simula: a los 4 segundos el pago queda aceptado.
 */
import type {
  BolsaConVendedor,
  Categoria,
  EstadoPago,
  MetodoPago,
  Opinion,
  Publicacion,
  Reserva,
  ReservaConBolsa,
  SesionVendedor,
  Usuario,
} from '../types'
import { BOLSAS, PLANTILLA_POR_CATEGORIA, UBICACION_USUARIO, VENDEDORES } from '../data/seed'
import { datosCliente, guardarDatosCliente } from '../lib/cliente'
import { ErrorApi } from './errores'

// ------------------------------------------------------------------ estado

interface BolsaInterna {
  id: string
  vendedorId: string
  titulo: string
  descripcion: string
  categoria: Categoria
  precioViejo: number
  precioNuevo: number
  recojoInicio: string
  recojoFin: string
  cantidad: number
  disponibles: number
  imagen: string
  kgComida: number
  kgCO2: number
  sorpresa?: boolean
  creadaEn: number
}

interface ReservaInterna extends Reserva {
  vendedorId: string
  creadaEn: number
}

interface OpinionInterna extends Opinion {
  vendedorId: string
  reservaId: string
}

interface Estado {
  bolsas: BolsaInterna[]
  reservas: ReservaInterna[]
  opiniones: OpinionInterna[]
  vendedorActual: string | null
  secuencia: number
}

const PIN_DEMO: Record<string, string> = {
  v1: '1101', v2: '4201', v3: '1103', v4: '1104', v5: '1105', v6: '4242', v7: '4207', v8: '1108', v9: '1109',
}

// La versión sube cuando cambia el catálogo semilla o la forma del estado.
const CLAVE = 'caserita:estado:v5'

function estadoInicial(): Estado {
  return {
    bolsas: BOLSAS.map((b) => ({
      id: b.id,
      vendedorId: b.vendedorId,
      titulo: b.titulo,
      descripcion: b.descripcion,
      categoria: b.categoria,
      precioViejo: b.precioViejo,
      precioNuevo: b.precioNuevo,
      recojoInicio: b.recojoInicio,
      recojoFin: b.recojoFin,
      cantidad: b.disponibles,
      disponibles: b.disponibles,
      imagen: b.imagen,
      kgComida: b.kgComida,
      kgCO2: b.kgCO2,
      sorpresa: b.sorpresa,
      creadaEn: 0,
    })),
    reservas: [],
    opiniones: [],
    vendedorActual: null,
    secuencia: 1,
  }
}

function cargar(): Estado {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (crudo) return JSON.parse(crudo) as Estado
  } catch {
    // localStorage lleno o JSON corrupto: se re-siembra.
  }
  const inicial = estadoInicial()
  guardar(inicial)
  return inicial
}

let estado: Estado = cargar()

function guardar(e: Estado = estado): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(e))
  } catch {
    // Sin espacio: la demo sigue viva en memoria.
  }
}

// --------------------------------------------------------------- utilidades

const VENDEDOR_POR_ID = new Map(VENDEDORES.map((v) => [v.id, v] as const))

function distanciaKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b[0] - a[0])
  const dLon = rad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.25 * 10) / 10
}

const LETRAS = 'ABCDEFGHJKMNPQRSTUVWXYZ'
function nuevoCodigo(): string {
  const l = () => LETRAS[Math.floor(Math.random() * LETRAS.length)]
  const d = () => Math.floor(Math.random() * 9) + 1
  return `${l()}${d()}-${l()}${d()}`
}

function ratingDe(vendedorId: string): { rating: number; opiniones: number } {
  const base = VENDEDOR_POR_ID.get(vendedorId)?.rating ?? 4.5
  const ops = estado.opiniones.filter((o) => o.vendedorId === vendedorId)
  if (ops.length === 0) return { rating: base, opiniones: 0 }
  const prom = ops.reduce((s, o) => s + o.estrellas, 0) / ops.length
  return { rating: Math.round(prom * 10) / 10, opiniones: ops.length }
}

function armarBolsa(b: BolsaInterna): BolsaConVendedor {
  const v = VENDEDOR_POR_ID.get(b.vendedorId) ?? VENDEDORES[0]
  const { rating, opiniones } = ratingDe(b.vendedorId)
  return {
    id: b.id,
    vendedorId: b.vendedorId,
    titulo: b.titulo,
    descripcion: b.descripcion,
    categoria: b.categoria,
    precioViejo: b.precioViejo,
    precioNuevo: b.precioNuevo,
    recojoInicio: b.recojoInicio,
    recojoFin: b.recojoFin,
    disponibles: b.disponibles,
    imagen: b.imagen,
    kgComida: b.kgComida,
    kgCO2: b.kgCO2,
    sorpresa: b.sorpresa,
    distanciaKm: distanciaKm(UBICACION_USUARIO, [v.lat, v.lng]),
    vendedor: { ...v, rating, opiniones },
  }
}

function armar(r: ReservaInterna, conCliente = false): ReservaConBolsa {
  const b = estado.bolsas.find((x) => x.id === r.bolsaId)
  const d = datosCliente()
  return {
    id: r.id,
    bolsaId: r.bolsaId,
    codigo: r.codigo,
    estado: r.estado,
    fecha: r.fecha,
    creadaEn: r.creadaEn,
    total: r.total,
    metodoPago: r.metodoPago,
    estadoPago: r.estadoPago,
    referenciaPago: r.referenciaPago,
    nota: r.nota,
    calificacion: r.calificacion,
    cliente: conCliente ? { nombre: d.nombre, telefono: d.telefono } : undefined,
    bolsa: b ? armarBolsa(b) : undefined,
  }
}

function buscar(id: string): ReservaInterna {
  const r = estado.reservas.find((x) => x.id === id)
  if (!r) throw new ErrorApi('Reserva no encontrada', 404)
  return r
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

// -------------------------------------------------------------------- bolsas

export async function getBolsas(): Promise<BolsaConVendedor[]> {
  return [...estado.bolsas].sort((a, b) => b.creadaEn - a.creadaEn).map(armarBolsa)
}

export async function getBolsa(id: string): Promise<BolsaConVendedor> {
  const b = estado.bolsas.find((x) => x.id === id)
  if (!b) throw new ErrorApi('Bolsa no encontrada', 404)
  return armarBolsa(b)
}

export async function getOpiniones(vendedorId: string): Promise<Opinion[]> {
  return estado.opiniones
    .filter((o) => o.vendedorId === vendedorId)
    .map(({ estrellas, comentario, fecha, nombre }) => ({ estrellas, comentario, fecha, nombre }))
    .reverse()
}

// ------------------------------------------------------------------ reservas

export async function getReservas(): Promise<ReservaConBolsa[]> {
  return [...estado.reservas].sort((a, b) => b.creadaEn - a.creadaEn).map((r) => armar(r))
}

export async function getReserva(id: string): Promise<ReservaConBolsa> {
  return armar(buscar(id))
}

export async function crearReserva(
  bolsaId: string,
  metodoPago: MetodoPago,
  datos: { nombre: string; telefono: string; nota?: string },
): Promise<ReservaConBolsa> {
  const b = estado.bolsas.find((x) => x.id === bolsaId)
  if (!b) throw new ErrorApi('Bolsa no encontrada', 404)
  if (b.disponibles <= 0) throw new ErrorApi('Se agotó mientras reservabas', 409)
  guardarDatosCliente({ nombre: datos.nombre, telefono: datos.telefono })

  b.disponibles -= 1
  const nueva: ReservaInterna = {
    id: `r${Date.now().toString(36)}`,
    bolsaId,
    vendedorId: b.vendedorId,
    codigo: nuevoCodigo(),
    estado: 'activa',
    fecha: 'Hoy',
    total: b.precioNuevo,
    metodoPago: metodoPago === 'qr' ? 'qr' : 'efectivo',
    estadoPago: 'pendiente',
    nota: datos.nota,
    creadaEn: estado.secuencia++,
  }
  estado.reservas.push(nueva)
  guardar()
  return armar(nueva)
}

export async function subirComprobante(id: string, imagen: string): Promise<ReservaConBolsa> {
  const r = buscar(id)
  if (!imagen.startsWith('data:image/')) throw new ErrorApi('El comprobante debe ser una imagen', 400)
  if (r.estadoPago === 'pagado') throw new ErrorApi('Este pedido ya está pagado', 409)
  r.metodoPago = 'qr'
  r.estadoPago = 'verificando'
  guardar()
  // Simula a la persona que acepta desde Telegram.
  window.setTimeout(() => {
    const x = estado.reservas.find((y) => y.id === id)
    if (x && x.estadoPago === 'verificando') {
      x.estadoPago = 'pagado'
      x.referenciaPago = 'DEMO'
      guardar()
    }
  }, 4000)
  return armar(r)
}

export async function pagarAlRecoger(id: string): Promise<ReservaConBolsa> {
  const r = buscar(id)
  if (r.estadoPago === 'pagado') throw new ErrorApi('Este pedido ya está pagado', 409)
  r.metodoPago = 'efectivo'
  r.estadoPago = 'pendiente'
  guardar()
  return armar(r)
}

function entregar(r: ReservaInterna) {
  r.estado = 'entregada'
  if (r.metodoPago === 'efectivo' && r.estadoPago !== 'pagado') {
    r.estadoPago = 'pagado'
    r.referenciaPago = 'EFECTIVO'
  }
}

export async function marcarRecogidaApi(id: string): Promise<ReservaConBolsa> {
  const r = buscar(id)
  if (r.estado !== 'activa') throw new ErrorApi('Esta reserva ya no está activa', 409)
  entregar(r)
  guardar()
  return armar(r)
}

export async function cancelarReservaApi(id: string): Promise<void> {
  const r = buscar(id)
  if (r.estado !== 'activa') throw new ErrorApi('Esta reserva ya no se puede cancelar', 409)
  if (r.estadoPago === 'pagado') throw new ErrorApi('Ya está pagada: escríbenos por WhatsApp para devolverte el dinero', 409)
  r.estado = 'cancelada'
  const b = estado.bolsas.find((x) => x.id === r.bolsaId)
  if (b) b.disponibles += 1
  guardar()
}

export async function calificarApi(id: string, estrellas: number, comentario: string): Promise<ReservaConBolsa> {
  const r = buscar(id)
  if (r.estado !== 'entregada') throw new ErrorApi('Podrás calificar cuando recojas tu pedido', 409)
  if (!(estrellas >= 1 && estrellas <= 5)) throw new ErrorApi('Elige de 1 a 5 estrellas', 400)
  r.calificacion = { estrellas, comentario }
  estado.opiniones = estado.opiniones.filter((o) => o.reservaId !== id)
  estado.opiniones.push({
    reservaId: id,
    vendedorId: r.vendedorId,
    estrellas,
    comentario,
    fecha: 'Hoy',
    nombre: datosCliente().nombre.split(' ')[0] || 'Vecino',
  })
  guardar()
  return armar(r)
}

// ------------------------------------------------------------------- usuario

export async function getUsuario(): Promise<Usuario> {
  const d = datosCliente()
  const validas = estado.reservas.filter((r) => r.estado !== 'cancelada')
  const bolsa = (r: ReservaInterna) => estado.bolsas.find((b) => b.id === r.bolsaId)
  return {
    id: 'local',
    nombre: d.nombre,
    ciudad: 'Santa Cruz de la Sierra',
    telefono: d.telefono,
    comidasRescatadas: validas.length,
    comidasEsteMes: validas.length,
    kgCO2Evitado: Math.round(validas.reduce((s, r) => s + (bolsa(r)?.kgCO2 ?? 0), 0) * 10) / 10,
    bsAhorrados: validas.reduce((s, r) => s + ((bolsa(r)?.precioViejo ?? 0) - (bolsa(r)?.precioNuevo ?? 0)), 0),
  }
}

export async function actualizarUsuario(datos: { nombre: string; telefono: string }): Promise<Usuario> {
  guardarDatosCliente(datos)
  return getUsuario()
}

// -------------------------------------------------------------------- casera

export async function entrarVendedor(pin: string): Promise<SesionVendedor> {
  await espera(300)
  const id = Object.keys(PIN_DEMO).find((k) => PIN_DEMO[k] === pin.trim())
  if (!id) throw new ErrorApi('Ese código no corresponde a ningún puesto', 401)
  const v = VENDEDOR_POR_ID.get(id)!
  estado.vendedorActual = id
  guardar()
  return { token: `demo.${id}`, vendedor: { id: v.id, nombre: v.nombre, tipo: v.tipo, direccion: v.direccion } }
}

function vendedorActual(): string {
  if (!estado.vendedorActual) throw new ErrorApi('Entra con el código de tu puesto', 401)
  return estado.vendedorActual
}

export async function getPublicaciones(): Promise<Publicacion[]> {
  const vid = vendedorActual()
  return estado.bolsas
    .filter((b) => b.vendedorId === vid)
    .sort((a, b) => b.creadaEn - a.creadaEn)
    .map((b) => ({
      id: b.id,
      categoria: b.categoria,
      cantidad: b.cantidad,
      precio: b.precioNuevo,
      horario: `${b.recojoInicio}-${b.recojoFin}`,
      vendidas: estado.reservas.filter((r) => r.bolsaId === b.id && r.estado !== 'cancelada').length,
      titulo: b.titulo,
      descripcion: b.descripcion,
      imagen: b.imagen,
      sorpresa: b.sorpresa,
      estado: b.disponibles > 0 ? 'activa' : 'agotada',
    }))
}

export async function crearPublicacion(
  datos: Omit<Publicacion, 'id' | 'vendidas' | 'estado'>,
): Promise<Publicacion> {
  const vid = vendedorActual()
  const { categoria, cantidad, precio, horario, titulo, descripcion, imagen, sorpresa } = datos
  const plantilla = PLANTILLA_POR_CATEGORIA[categoria as Categoria]
  if (!plantilla) throw new ErrorApi('Categoría desconocida', 400)
  if (!Number.isFinite(cantidad) || cantidad < 1) throw new ErrorApi('Cantidad inválida', 400)
  if (!Number.isFinite(precio) || precio < 1) throw new ErrorApi('Precio inválido', 400)
  const [inicio, fin] = String(horario ?? '18:00-19:00').split(/\s*[-–]\s*/)
  const marca = Date.now()
  const b: BolsaInterna = {
    id: `b-${marca}`,
    vendedorId: vid,
    titulo: titulo?.trim() || plantilla.titulo,
    descripcion: sorpresa ? '' : descripcion?.trim() || plantilla.descripcion,
    categoria,
    precioViejo: Math.round(precio * 2.6),
    precioNuevo: precio,
    recojoInicio: inicio ?? '18:00',
    recojoFin: fin ?? '19:00',
    cantidad,
    disponibles: cantidad,
    imagen: imagen || plantilla.imagen,
    kgComida: plantilla.kgComida,
    kgCO2: plantilla.kgCO2,
    sorpresa,
    creadaEn: estado.secuencia++,
  }
  estado.bolsas.unshift(b)
  guardar()
  return (await getPublicaciones()).find((p) => p.id === b.id)!
}

export async function getPedidosVendedor(): Promise<ReservaConBolsa[]> {
  const vid = vendedorActual()
  return estado.reservas
    .filter((r) => r.vendedorId === vid && r.estado !== 'cancelada')
    .sort((a, b) => b.creadaEn - a.creadaEn)
    .map((r) => armar(r, true))
}

export async function entregarPedido(id: string): Promise<ReservaConBolsa> {
  const vid = vendedorActual()
  const r = buscar(id)
  if (r.vendedorId !== vid) throw new ErrorApi('Pedido no encontrado', 404)
  if (r.estado !== 'activa') throw new ErrorApi('Este pedido ya fue cerrado', 409)
  entregar(r)
  guardar()
  return armar(r, true)
}

// ---------------------------------------------------------------------- demo

export async function reiniciarServidor(): Promise<{ ok: true }> {
  estado = estadoInicial()
  guardar()
  return { ok: true }
}

export type { EstadoPago }
