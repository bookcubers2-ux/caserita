/**
 * Backend de Caserita corriendo dentro del navegador.
 *
 * Replica endpoint por endpoint la lógica del servidor Express (caserita-api),
 * pero guardando el estado en localStorage. Así la demo funciona en Vercel sin
 * ningún servidor detrás, e incluso sin conexión. La única diferencia con el
 * backend real es la garantía transaccional de reservas simultáneas, que no
 * tiene sentido con un solo usuario en un solo dispositivo.
 *
 * Si algún día se despliega el backend, basta con definir VITE_API_URL y la
 * app vuelve a hablar por red (ver services/api.ts). Nada de esto se toca.
 */
import type {
  BolsaConVendedor,
  Categoria,
  Delivery,
  EstadoPago,
  MetodoPago,
  PasoDelivery,
  Publicacion,
  Reserva,
  ReservaConBolsa,
  Usuario,
} from '../types'
import {
  BOLSAS,
  MI_NEGOCIO,
  PLANTILLA_POR_CATEGORIA,
  RESERVAS_SEED,
  UBICACION_USUARIO,
  USUARIO,
  VENDEDORES,
} from '../data/seed'
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
  disponibles: number
  imagen: string
  kgComida: number
  kgCO2: number
  sorpresa?: boolean
  creadaEn: number
}

interface ReservaInterna extends Reserva {
  creadaEn: number
}

interface PublicacionInterna {
  id: string
  bolsaId?: string
  categoria: Categoria
  cantidad: number
  precio: number
  horario: string
  vendidas: number
  titulo?: string
  descripcion?: string
  imagen?: string
  sorpresa?: boolean
  creadaEn: number
}

interface DeliveryInterno {
  id: string
  reservaId: string
  costoDelivery: number
  creadoEn: number
}

interface Estado {
  bolsas: BolsaInterna[]
  reservas: ReservaInterna[]
  publicaciones: PublicacionInterna[]
  deliveries: DeliveryInterno[]
  usuario: Usuario
  /** Contador monótono para ordenar lo nuevo por encima de lo sembrado. */
  secuencia: number
}

// La versión sube cuando cambia el catálogo semilla: si no, quien ya abrió la
// app seguiría viendo el catálogo viejo guardado en su navegador.
const CLAVE = 'caserita:estado:v3'

/** Deja el estado como recién instalado, a partir del catálogo semilla. */
function estadoInicial(): Estado {
  const bolsas: BolsaInterna[] = BOLSAS.map((b) => ({
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
    creadaEn: 0,
  }))

  const reservas: ReservaInterna[] = RESERVAS_SEED.map((r) => ({ ...r, creadaEn: 0 }))

  // El estado de una publicación se DERIVA del stock real de su bolsa; por eso
  // guardamos el vínculo bolsaId, igual que el backend. Lo que describe al
  // producto también sale de la bolsa: las dos pantallas no pueden discrepar.
  const publicacionSemilla = (
    id: string,
    bolsaId: string,
    cantidad: number,
    vendidas: number,
  ): PublicacionInterna => {
    const b = bolsas.find((x) => x.id === bolsaId)!
    return {
      id,
      bolsaId,
      categoria: b.categoria,
      cantidad,
      precio: b.precioNuevo,
      horario: `${b.recojoInicio}-${b.recojoFin}`,
      vendidas,
      titulo: b.titulo,
      descripcion: b.descripcion,
      imagen: b.imagen,
      sorpresa: b.sorpresa,
      creadaEn: 0,
    }
  }

  const publicaciones: PublicacionInterna[] = [
    publicacionSemilla('p1', 'b1', 7, 3),
    publicacionSemilla('p2', 'b4', 4, 2),
  ]

  return {
    bolsas,
    reservas,
    publicaciones,
    deliveries: [],
    usuario: { ...USUARIO },
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
    // Sin espacio para guardar: la demo sigue viva en memoria igual.
  }
}

// --------------------------------------------------------------- utilidades

const VENDEDOR_POR_ID = new Map(
  [...VENDEDORES, MI_NEGOCIO].map((v) => [v.id, v] as const),
)

/** Misma fórmula del backend: haversine con un factor de 1.25 por las calles. */
function distanciaKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b[0] - a[0])
  const dLon = rad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.25 * 10) / 10
}

const LETRAS = 'ABCDEFGHJKMNPQRSTUVWXYZ'
function nuevoCodigo(): string {
  const l = () => LETRAS[Math.floor(Math.random() * LETRAS.length)]
  const d = () => Math.floor(Math.random() * 9) + 1
  return `${l()}${d()}-${l()}${d()}`
}

function armarBolsa(b: BolsaInterna): BolsaConVendedor {
  const vendedor = VENDEDOR_POR_ID.get(b.vendedorId) ?? MI_NEGOCIO
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
    distanciaKm: distanciaKm(UBICACION_USUARIO, [vendedor.lat, vendedor.lng]),
    vendedor,
  }
}

function reservaConBolsa(r: ReservaInterna): ReservaConBolsa {
  const b = estado.bolsas.find((x) => x.id === r.bolsaId)
  return {
    id: r.id,
    bolsaId: r.bolsaId,
    codigo: r.codigo,
    estado: r.estado,
    fecha: r.fecha,
    total: r.total,
    metodoPago: r.metodoPago,
    estadoPago: r.estadoPago,
    referenciaPago: r.referenciaPago,
    bolsa: b ? armarBolsa(b) : undefined,
  }
}

// El seguimiento del delivery se deriva del tiempo transcurrido, igual que en
// store.tsx (FASE_EN_CAMINO = 15 s, FASE_ENTREGADO = 75 s).
function armarDelivery(d: DeliveryInterno): Delivery {
  const seg = (Date.now() - d.creadoEn) / 1000
  const paso: PasoDelivery = seg < 15 ? 'preparando' : seg < 75 ? 'en_camino' : 'entregado'
  const etaMin = Math.max(0, Math.ceil((75 - seg) / 5))
  return {
    id: d.id,
    reservaId: d.reservaId,
    paso,
    etaMin,
    costoDelivery: d.costoDelivery,
    creadoEn: d.creadoEn,
  }
}

// -------------------------------------------------------------------- bolsas

export async function getBolsas(): Promise<BolsaConVendedor[]> {
  return [...estado.bolsas].sort((a, b) => b.creadaEn - a.creadaEn).map(armarBolsa)
}

export async function getBolsa(id: string): Promise<BolsaConVendedor> {
  const b = estado.bolsas.find((x) => x.id === id)
  if (!b) throw new ErrorApi('Bolsa no encontrada', 404)
  return armarBolsa(b)
}

// ------------------------------------------------------------------ reservas

export async function getReservas(): Promise<ReservaConBolsa[]> {
  return [...estado.reservas].sort((a, b) => b.creadaEn - a.creadaEn).map(reservaConBolsa)
}

export async function crearReserva(
  bolsaId: string,
  metodoPago: MetodoPago,
): Promise<ReservaConBolsa> {
  const b = estado.bolsas.find((x) => x.id === bolsaId)
  if (!b) throw new ErrorApi('Bolsa no encontrada', 404)
  if (b.disponibles <= 0) throw new ErrorApi('Esa bolsa se agotó mientras reservabas', 409)

  b.disponibles -= 1

  const nueva: ReservaInterna = {
    id: `r${Date.now()}`,
    bolsaId,
    codigo: nuevoCodigo(),
    estado: 'activa',
    fecha: 'Hoy',
    total: b.precioNuevo,
    metodoPago: metodoPago === 'qr' ? 'qr' : 'efectivo',
    estadoPago: 'pendiente',
    creadaEn: estado.secuencia++,
  }
  estado.reservas.push(nueva)

  const u = estado.usuario
  u.comidasRescatadas += 1
  u.comidasEsteMes += 1
  u.kgCO2Evitado = Math.round((u.kgCO2Evitado + b.kgCO2) * 10) / 10
  u.bsAhorrados += b.precioViejo - b.precioNuevo

  guardar()
  return reservaConBolsa(nueva)
}

export async function actualizarPago(
  id: string,
  estadoPago: EstadoPago,
  referencia?: string,
): Promise<ReservaConBolsa> {
  const permitidos: EstadoPago[] = ['pendiente', 'esperando', 'procesando', 'pagado', 'expirado']
  if (!permitidos.includes(estadoPago)) throw new ErrorApi('Estado de pago inválido', 400)

  const r = estado.reservas.find((x) => x.id === id)
  if (!r) throw new ErrorApi('Reserva no encontrada', 404)

  r.estadoPago = estadoPago
  if (referencia !== undefined && referencia !== null) r.referenciaPago = referencia
  r.metodoPago = estadoPago === 'pendiente' ? 'efectivo' : 'qr'

  guardar()
  return reservaConBolsa(r)
}

export async function marcarRecogidaApi(id: string): Promise<ReservaConBolsa> {
  const r = estado.reservas.find((x) => x.id === id)
  if (!r) throw new ErrorApi('Reserva no encontrada', 404)
  r.estado = 'recogida'
  guardar()
  return reservaConBolsa(r)
}

/** Cancelar devuelve la bolsa al stock y revierte el impacto acumulado. */
export async function cancelarReservaApi(id: string): Promise<void> {
  const idx = estado.reservas.findIndex((x) => x.id === id)
  if (idx === -1) throw new ErrorApi('Reserva no encontrada', 404)

  const r = estado.reservas[idx]
  const b = estado.bolsas.find((x) => x.id === r.bolsaId)

  if (b) b.disponibles += 1
  estado.deliveries = estado.deliveries.filter((d) => d.reservaId !== id)
  estado.reservas.splice(idx, 1)

  if (b) {
    const u = estado.usuario
    u.comidasRescatadas = Math.max(0, u.comidasRescatadas - 1)
    u.comidasEsteMes = Math.max(0, u.comidasEsteMes - 1)
    u.kgCO2Evitado = Math.max(0, Math.round((u.kgCO2Evitado - b.kgCO2) * 10) / 10)
    u.bsAhorrados = Math.max(0, u.bsAhorrados - (b.precioViejo - b.precioNuevo))
  }

  guardar()
}

// ------------------------------------------------------------- publicaciones

export async function getPublicaciones(): Promise<Publicacion[]> {
  return [...estado.publicaciones]
    .sort((a, b) => b.creadaEn - a.creadaEn)
    .map((p) => {
      const bolsa = p.bolsaId ? estado.bolsas.find((x) => x.id === p.bolsaId) : undefined
      const disponibles = bolsa ? bolsa.disponibles : 0
      return {
        id: p.id,
        categoria: p.categoria,
        cantidad: p.cantidad,
        precio: p.precio,
        horario: p.horario,
        vendidas: p.vendidas,
        titulo: p.titulo,
        descripcion: p.descripcion,
        imagen: p.imagen,
        sorpresa: p.sorpresa,
        estado: disponibles > 0 ? 'activa' : 'agotada',
      }
    })
}

/** Publicar crea la publicación Y la bolsa que verá el comprador. */
export async function crearPublicacion(
  datos: Omit<Publicacion, 'id' | 'vendidas' | 'estado'>,
): Promise<Publicacion> {
  const { categoria, cantidad, precio, horario, titulo, descripcion, imagen, sorpresa } = datos
  const plantilla = PLANTILLA_POR_CATEGORIA[categoria as Categoria]
  if (!plantilla) throw new ErrorApi('Categoría desconocida', 400)
  if (!Number.isFinite(cantidad) || cantidad < 1) throw new ErrorApi('Cantidad inválida', 400)
  if (!Number.isFinite(precio) || precio < 1) throw new ErrorApi('Precio inválido', 400)

  const [inicio, fin] = String(horario ?? '18:00-19:00').split(/\s*[-–]\s*/)
  const marca = Date.now()
  const bolsaId = `b-${marca}`
  const seq = estado.secuencia++

  // Lo que escribió el vendedor manda; la plantilla solo cubre lo que dejó en
  // blanco (y en una sorpresa la descripción se queda vacía a propósito).
  const tituloFinal = titulo?.trim() || plantilla.titulo
  const descripcionFinal = sorpresa ? '' : descripcion?.trim() || plantilla.descripcion
  const imagenFinal = imagen?.trim() || plantilla.imagen

  estado.bolsas.push({
    id: bolsaId,
    vendedorId: 'v-mio',
    titulo: tituloFinal,
    descripcion: descripcionFinal,
    categoria: categoria as Categoria,
    precioViejo: Math.round(precio * 2.6),
    precioNuevo: precio,
    recojoInicio: inicio ?? '18:00',
    recojoFin: fin ?? '19:00',
    disponibles: cantidad,
    imagen: imagenFinal,
    kgComida: plantilla.kgComida,
    kgCO2: plantilla.kgCO2,
    sorpresa: sorpresa || undefined,
    creadaEn: seq,
  })

  const pub: PublicacionInterna = {
    id: `p${marca}`,
    bolsaId,
    categoria: categoria as Categoria,
    cantidad,
    precio,
    horario: `${inicio}-${fin ?? ''}`.replace(/-$/, ''),
    vendidas: 0,
    titulo: tituloFinal,
    descripcion: descripcionFinal,
    imagen: imagenFinal,
    sorpresa: sorpresa || undefined,
    creadaEn: seq,
  }
  estado.publicaciones.push(pub)

  guardar()
  return {
    id: pub.id,
    categoria: pub.categoria,
    cantidad: pub.cantidad,
    precio: pub.precio,
    horario: pub.horario,
    vendidas: 0,
    titulo: pub.titulo,
    descripcion: pub.descripcion,
    imagen: pub.imagen,
    sorpresa: pub.sorpresa,
    estado: 'activa',
  }
}

// --------------------------------------------------------------- deliveries

export async function crearDelivery(reservaId: string): Promise<Delivery> {
  const existeReserva = estado.reservas.some((r) => r.id === reservaId)
  if (!existeReserva) throw new ErrorApi('Reserva no encontrada', 404)

  const LIMITE_ENTREGADO = 75_000
  const enCurso = estado.deliveries
    .filter((d) => d.reservaId === reservaId)
    .sort((a, b) => b.creadoEn - a.creadoEn)[0]

  if (enCurso && Date.now() - enCurso.creadoEn < LIMITE_ENTREGADO) return armarDelivery(enCurso)

  const nuevo: DeliveryInterno = {
    id: `d-${reservaId}-${Date.now()}`,
    reservaId,
    costoDelivery: 8,
    creadoEn: Date.now(),
  }
  estado.deliveries = estado.deliveries.filter((d) => d.reservaId !== reservaId)
  estado.deliveries.push(nuevo)

  guardar()
  return armarDelivery(nuevo)
}

export async function getDelivery(id: string): Promise<Delivery> {
  const d = estado.deliveries.find((x) => x.id === id)
  if (!d) throw new ErrorApi('Delivery no encontrado', 404)
  return armarDelivery(d)
}

// ------------------------------------------------------------------ usuario

export async function getUsuario(): Promise<Usuario> {
  return { ...estado.usuario }
}

/** Vuelve a dejar la demo como recién instalada. Útil entre presentaciones. */
export async function reiniciarServidor(): Promise<{ ok: true }> {
  estado = estadoInicial()
  guardar()
  return { ok: true }
}
