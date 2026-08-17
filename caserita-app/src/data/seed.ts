import type { Bolsa, Categoria, Publicacion, Reserva, Usuario, Vendedor } from '../types'

/**
 * Centro de Santa Cruz de la Sierra: Plaza 24 de Septiembre.
 * Sirve como centro del mapa real (OpenStreetMap).
 */
export const CENTRO_SCZ: [number, number] = [-17.7833, -63.1821]

/** Ubicacion simulada del usuario (a pocas cuadras de la plaza principal). */
export const UBICACION_USUARIO: [number, number] = [-17.7802, -63.183]

/**
 * Coordenadas reales aproximadas: cada punto cae en el barrio o avenida
 * que declara su direccion. No son direcciones catastradas.
 */
export const VENDEDORES: Vendedor[] = [
  {
    id: 'v1',
    nombre: 'Panadería La Espiga',
    tipo: 'Panadería',
    direccion: 'Av. Cañoto esq. Sucre',
    rating: 4.8,
    lat: -17.7869,
    lng: -63.1876,
  },
  {
    id: 'v2',
    nombre: 'Pensión Doña Mary',
    tipo: 'Pensión',
    direccion: 'Barrio Equipetrol, calle 5',
    rating: 4.7,
    lat: -17.7681,
    lng: -63.1966,
  },
  {
    id: 'v3',
    nombre: 'Salteñería El Horno',
    tipo: 'Salteñería',
    direccion: '2do anillo, Av. Alemana',
    rating: 4.9,
    lat: -17.7729,
    lng: -63.1706,
  },
  {
    id: 'v4',
    nombre: 'Café Tajibo',
    tipo: 'Cafetería',
    direccion: 'Calle Bolívar 240, Centro',
    rating: 4.6,
    lat: -17.7818,
    lng: -63.1801,
  },
  {
    id: 'v5',
    nombre: 'Heladería Tropicana',
    tipo: 'Heladería',
    direccion: '3er anillo interno, Av. Banzer',
    rating: 4.5,
    lat: -17.7563,
    lng: -63.1792,
  },
  {
    id: 'v6',
    nombre: 'Mercado La Ramada · Puesto 42',
    tipo: 'Mercado',
    direccion: 'Mercado La Ramada, pasillo B',
    rating: 4.4,
    lat: -17.7901,
    lng: -63.1929,
  },
  {
    id: 'v7',
    nombre: 'Restaurante El Camba',
    tipo: 'Restaurante',
    direccion: 'Av. Busch 1120',
    rating: 4.7,
    lat: -17.7745,
    lng: -63.1848,
  },
]

export const BOLSAS: Bolsa[] = [
  {
    id: 'b1',
    vendedorId: 'v1',
    titulo: 'Pan del día: marraqueta, cuñapé y empanadas',
    descripcion: 'Marraqueta, cuñapé y empanadas horneadas hoy temprano.',
    categoria: 'Pan del día',
    precioViejo: 35,
    precioNuevo: 12,
    recojoInicio: '18:00',
    recojoFin: '19:00',
    distanciaKm: 0.8,
    disponibles: 4,
    imagen: '/img/espiga.jpg',
    kgComida: 1.2,
    kgCO2: 3,
  },
  {
    id: 'b2',
    vendedorId: 'v2',
    titulo: 'Almuerzo casero del día',
    descripcion: 'Sopa, segundo con arroz y ensalada. Lo que quedó del almuerzo.',
    categoria: 'Almuerzo',
    precioViejo: 25,
    precioNuevo: 10,
    recojoInicio: '14:30',
    recojoFin: '15:30',
    distanciaKm: 1.2,
    disponibles: 3,
    imagen: '/img/mary.jpg',
    kgComida: 0.9,
    kgCO2: 2.4,
  },
  {
    id: 'b3',
    vendedorId: 'v3',
    titulo: 'Salteñas de media mañana',
    descripcion: 'Salteñas de carne y pollo recién salidas del horno.',
    categoria: 'Almuerzo',
    precioViejo: 18,
    precioNuevo: 7,
    recojoInicio: '10:30',
    recojoFin: '11:30',
    distanciaKm: 0.5,
    disponibles: 6,
    imagen: '/img/horno.jpg',
    kgComida: 0.7,
    kgCO2: 1.8,
  },
  {
    id: 'b4',
    vendedorId: 'v4',
    titulo: 'Croissants, medialunas y café del día',
    descripcion: 'Croissants, medialunas y un café del día para llevar.',
    categoria: 'Repostería',
    precioViejo: 28,
    precioNuevo: 9,
    recojoInicio: '19:00',
    recojoFin: '20:00',
    distanciaKm: 1.6,
    disponibles: 2,
    imagen: '/img/cafe.jpg',
    kgComida: 0.6,
    kgCO2: 1.5,
  },
  {
    id: 'b5',
    vendedorId: 'v5',
    titulo: 'Helados artesanales del día',
    descripcion: 'Potes surtidos de sabores tropicales: copoazú, maracuyá y chirimoya.',
    categoria: 'Repostería',
    precioViejo: 24,
    precioNuevo: 8,
    recojoInicio: '20:00',
    recojoFin: '21:00',
    distanciaKm: 2.1,
    disponibles: 5,
    imagen: '/img/heladeria.jpg',
    kgComida: 1,
    kgCO2: 2.2,
  },
  {
    id: 'b6',
    vendedorId: 'v6',
    titulo: 'Canasta de fruta y verdura',
    descripcion: 'Frutas maduras y verduras del puesto, perfectas para hoy mismo.',
    categoria: 'Frutas',
    precioViejo: 30,
    precioNuevo: 10,
    recojoInicio: '17:30',
    recojoFin: '18:30',
    distanciaKm: 2.6,
    disponibles: 7,
    imagen: '/img/mercado.jpg',
    kgComida: 2.5,
    kgCO2: 4.1,
  },
  {
    id: 'b7',
    vendedorId: 'v7',
    titulo: 'Cena rescatada del día',
    descripcion: 'Churrasco con yuca y ensalada, porciones que no se sirvieron.',
    categoria: 'Cena',
    precioViejo: 45,
    precioNuevo: 15,
    recojoInicio: '21:30',
    recojoFin: '22:15',
    distanciaKm: 1.9,
    disponibles: 3,
    imagen: '/img/restaurante.jpg',
    kgComida: 1.4,
    kgCO2: 3.6,
    // La única sorpresa del catálogo: la modalidad es la excepción, no la regla.
    sorpresa: true,
  },
]

export const RESERVAS_SEED: Reserva[] = [
  {
    id: 'r1',
    bolsaId: 'b1',
    codigo: 'A7-K9',
    estado: 'activa',
    fecha: 'Hoy',
    total: 12,
    metodoPago: 'efectivo',
    estadoPago: 'pendiente',
  },
  {
    id: 'r2',
    bolsaId: 'b3',
    codigo: 'M2-P4',
    estado: 'recogida',
    fecha: 'Ayer',
    total: 7,
    metodoPago: 'qr',
    estadoPago: 'pagado',
  },
  {
    id: 'r3',
    bolsaId: 'b2',
    codigo: 'T8-L1',
    estado: 'recogida',
    fecha: '12 jul',
    total: 10,
    metodoPago: 'efectivo',
    estadoPago: 'pagado',
  },
]

// Los deliveries ya no vienen precargados: se crean al pedirlos desde una
// reserva concreta, para que el seguimiento corresponda a ese pedido.

/**
 * Lo que ve el vendedor se DERIVA del mismo catálogo que ve el comprador,
 * para que las dos pantallas nunca se contradigan: si la vitrina dice
 * "4 disponibles", el panel dice "3 de 7 vendidas".
 */
function publicacionDe(bolsaId: string, vendidas: number, indice: number): Publicacion {
  const b = BOLSAS.find((x) => x.id === bolsaId)!
  const cantidad = b.disponibles + vendidas
  return {
    id: `p${indice}`,
    categoria: b.categoria,
    cantidad,
    precio: b.precioNuevo,
    horario: `${b.recojoInicio}-${b.recojoFin}`,
    vendidas,
    estado: b.disponibles > 0 ? 'activa' : 'agotada',
  }
}

export const PUBLICACIONES: Publicacion[] = [
  publicacionDe('b1', 3, 1),
  publicacionDe('b4', 2, 2),
]

export const USUARIO: Usuario = {
  id: 'u1',
  nombre: 'Camila Áñez',
  ciudad: 'Santa Cruz de la Sierra',
  telefono: '+591 700 12345',
  comidasRescatadas: 47,
  comidasEsteMes: 12,
  kgCO2Evitado: 118,
  bsAhorrados: 640,
}

export const CATEGORIAS = ['Pan del día', 'Almuerzo', 'Repostería', 'Frutas', 'Cena'] as const

/** El negocio del propio usuario cuando publica desde el modo vendedor. */
export const MI_NEGOCIO: Vendedor = {
  id: 'v-mio',
  nombre: 'Mi negocio',
  tipo: 'Tu local',
  direccion: 'Santa Cruz de la Sierra',
  rating: 5,
  lat: -17.7808,
  lng: -63.1836,
}

/** Con qué se rellena una bolsa recién publicada según su categoría. */
export const PLANTILLA_POR_CATEGORIA: Record<
  Categoria,
  { titulo: string; descripcion: string; imagen: string; kgComida: number; kgCO2: number }
> = {
  'Pan del día': {
    titulo: 'Pan y masitas del día',
    descripcion: 'Pan y masitas horneadas hoy que quedaron al cierre.',
    imagen: '/img/espiga.jpg',
    kgComida: 1.2,
    kgCO2: 3,
  },
  Almuerzo: {
    titulo: 'Almuerzo casero del día',
    descripcion: 'Porciones del almuerzo que no se alcanzaron a servir.',
    imagen: '/img/mary.jpg',
    kgComida: 0.9,
    kgCO2: 2.4,
  },
  Repostería: {
    titulo: 'Repostería y masas dulces del día',
    descripcion: 'Repostería y masas dulces del día para llevar.',
    imagen: '/img/cafe.jpg',
    kgComida: 0.6,
    kgCO2: 1.5,
  },
  Frutas: {
    titulo: 'Canasta de fruta y verdura',
    descripcion: 'Frutas y verduras maduras, perfectas para hoy mismo.',
    imagen: '/img/mercado.jpg',
    kgComida: 2.5,
    kgCO2: 4.1,
  },
  Cena: {
    titulo: 'Cena rescatada del día',
    descripcion: 'Platos preparados que no se sirvieron esta noche.',
    imagen: '/img/restaurante.jpg',
    kgComida: 1.4,
    kgCO2: 3.6,
  },
}

/**
 * Lo que reemplaza a la descripción cuando la bolsa es sorpresa. El comercio,
 * la categoría, el precio, el horario y la distancia se siguen viendo: lo
 * único que se reserva es el contenido.
 */
export const TEXTO_SORPRESA =
  'Contenido sorpresa. Sabés el comercio y la categoría; lo que va adentro lo descubrís al recoger.'

/** Fotos con las que el vendedor puede ilustrar lo que publica. */
export const FOTOS_DISPONIBLES: { src: string; etiqueta: string }[] = [
  { src: '/img/espiga.jpg', etiqueta: 'Pan y masitas' },
  { src: '/img/mary.jpg', etiqueta: 'Almuerzo casero' },
  { src: '/img/horno.jpg', etiqueta: 'Salteñas y horneados' },
  { src: '/img/cafe.jpg', etiqueta: 'Café y repostería' },
  { src: '/img/heladeria.jpg', etiqueta: 'Helados y postres' },
  { src: '/img/mercado.jpg', etiqueta: 'Frutas y verduras' },
  { src: '/img/restaurante.jpg', etiqueta: 'Platos preparados' },
]
