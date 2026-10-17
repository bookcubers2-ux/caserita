export type Categoria = 'Pan del día' | 'Almuerzo' | 'Repostería' | 'Frutas' | 'Cena'

export type MetodoPago = 'efectivo' | 'qr'

export interface Vendedor {
  id: string
  nombre: string
  tipo: string
  direccion: string
  rating: number
  /** Cuántos vecinos ya calificaron a esta casera (0 = todavía usa el rating de arranque). */
  opiniones?: number
  /** Coordenadas reales (aproximadas) dentro de Santa Cruz de la Sierra. */
  lat: number
  lng: number
}

export interface Bolsa {
  id: string
  vendedorId: string
  titulo: string
  descripcion: string
  categoria: Categoria
  precioViejo: number
  precioNuevo: number
  recojoInicio: string
  recojoFin: string
  distanciaKm: number
  disponibles: number
  imagen: string
  kgComida: number
  kgCO2: number
  /** true = bolsa sorpresa: el contenido no se revela hasta el retiro. */
  sorpresa?: boolean
}

export interface BolsaConVendedor extends Bolsa {
  vendedor: Vendedor
}

/**
 * Vida de un pedido:
 * activa    = reservado, todavía no lo recogió
 * entregada = la casera (o el vecino) marcó que ya se entregó
 * cancelada = el vecino lo canceló antes de recoger
 */
export type EstadoReserva = 'activa' | 'entregada' | 'cancelada'

/**
 * Vida del cobro:
 * pendiente   = todavía no mandó el comprobante (o paga en efectivo al recoger)
 * verificando = subió la captura; la estamos revisando en Telegram
 * pagado      = aceptado
 * rechazado   = la captura no sirvió; puede volver a subir otra o pagar al recoger
 */
export type EstadoPago = 'pendiente' | 'verificando' | 'pagado' | 'rechazado'

export interface Calificacion {
  estrellas: number
  comentario: string
}

export interface Reserva {
  id: string
  bolsaId: string
  codigo: string
  estado: EstadoReserva
  fecha: string
  creadaEn?: number
  total: number
  metodoPago: MetodoPago
  estadoPago: EstadoPago
  referenciaPago?: string
  nota?: string
  calificacion?: Calificacion
  /** Solo lo ve la casera en su panel. */
  cliente?: { nombre: string; telefono: string }
}

export interface ReservaConBolsa extends Reserva {
  bolsa?: BolsaConVendedor
}

export interface Opinion {
  estrellas: number
  comentario: string
  fecha: string
  nombre: string
}

export interface Publicacion {
  id: string
  categoria: Categoria
  cantidad: number
  precio: number
  horario: string
  vendidas: number
  estado: 'activa' | 'agotada'
  /** Lo que el vendedor escribió del producto. Si falta, se usa la plantilla. */
  titulo?: string
  descripcion?: string
  imagen?: string
  /** true = bolsa sorpresa: el contenido no se revela hasta el retiro. */
  sorpresa?: boolean
}

export interface Usuario {
  id: string
  nombre: string
  ciudad: string
  telefono: string
  comidasRescatadas: number
  comidasEsteMes: number
  kgCO2Evitado: number
  bsAhorrados: number
}

export interface SesionVendedor {
  token: string
  vendedor: { id: string; nombre: string; tipo: string; direccion: string }
}

export type Rol = 'comprador' | 'vendedor'
