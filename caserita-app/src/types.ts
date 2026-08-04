export type Categoria = 'Pan del día' | 'Almuerzo' | 'Repostería' | 'Frutas' | 'Cena'

export type MetodoPago = 'efectivo' | 'qr'

export interface Vendedor {
  id: string
  nombre: string
  tipo: string
  direccion: string
  rating: number
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
}

export interface BolsaConVendedor extends Bolsa {
  vendedor: Vendedor
}

export type EstadoReserva = 'activa' | 'recogida'

/**
 * Ciclo de vida del cobro:
 * pendiente  = aun no se genero o no se escaneo el QR
 * esperando  = QR en pantalla, esperando que el banco reporte el pago
 * procesando = el banco recibio la transaccion y la esta acreditando
 * pagado     = confirmado
 * expirado   = el QR vencio sin pago
 */
export type EstadoPago = 'pendiente' | 'esperando' | 'procesando' | 'pagado' | 'expirado'

export interface Reserva {
  id: string
  bolsaId: string
  codigo: string
  estado: EstadoReserva
  fecha: string
  total: number
  metodoPago: MetodoPago
  estadoPago: EstadoPago
  referenciaPago?: string
}

export interface ReservaConBolsa extends Reserva {
  bolsa?: BolsaConVendedor
}

export type PasoDelivery = 'preparando' | 'en_camino' | 'entregado'

export interface Delivery {
  id: string
  reservaId: string
  paso: PasoDelivery
  etaMin: number
  costoDelivery: number
  /** Momento en que se pidio, para que el seguimiento avance solo. */
  creadoEn: number
}

export interface Publicacion {
  id: string
  categoria: Categoria
  cantidad: number
  precio: number
  horario: string
  vendidas: number
  estado: 'activa' | 'agotada'
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

export type Rol = 'comprador' | 'vendedor'
