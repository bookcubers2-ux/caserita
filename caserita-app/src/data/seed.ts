import type { Bolsa, Categoria, Publicacion, Reserva, Usuario, Vendedor } from '../types'

/**
 * Catálogo de Caserita: comida de casera, de puesto y de carrito.
 *
 * Cada bolsa respeta el reloj real de la calle boliviana, porque un horario
 * mal puesto delata la demo: las salteñas no existen después del mediodía, el
 * api es de la mañana, y la salchipapa y el sándwich de chola son de noche.
 * Los precios están en el rango de calle de 2026.
 */

/** Centro de Santa Cruz de la Sierra: Plaza 24 de Septiembre. */
export const CENTRO_SCZ: [number, number] = [-17.7833, -63.1821]

/** Ubicacion simulada del usuario (a pocas cuadras de la plaza principal). */
export const UBICACION_USUARIO: [number, number] = [-17.7802, -63.183]

/**
 * Quienes venden son caseras, puestos y carritos, no restaurantes: es el
 * comercio que hoy bota su excedente porque no tiene dónde colocarlo.
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
    nombre: 'Salteñas Doña Fela',
    tipo: 'Salteñería',
    direccion: '2do anillo, Av. Alemana',
    rating: 4.9,
    lat: -17.7729,
    lng: -63.1706,
  },
  {
    id: 'v4',
    nombre: 'Api de Doña Nieves',
    tipo: 'Puesto de api',
    direccion: 'Calle Bolívar 240, Centro',
    rating: 4.6,
    lat: -17.7818,
    lng: -63.1801,
  },
  {
    id: 'v5',
    nombre: 'Tucumanas El Fogón',
    tipo: 'Puesto',
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
    nombre: 'Carrito de Don Grover',
    tipo: 'Carrito',
    direccion: 'Av. Busch 1120',
    rating: 4.7,
    lat: -17.7745,
    lng: -63.1848,
  },
  {
    id: 'v8',
    nombre: 'Sándwich de chola Doña Justa',
    tipo: 'Kiosco',
    direccion: '2do anillo, Av. Cristo Redentor',
    rating: 4.8,
    lat: -17.7776,
    lng: -63.1745,
  },
  {
    id: 'v9',
    nombre: 'Comedor popular del mercado',
    tipo: 'Comedor',
    direccion: 'Mercado La Ramada, planta alta',
    rating: 4.5,
    lat: -17.7852,
    lng: -63.1889,
  },
]

export const BOLSAS: Bolsa[] = [
  {
    id: 'b1',
    vendedorId: 'v1',
    titulo: 'Marraqueta y masitas del día',
    descripcion: 'Marraqueta crocante y masitas horneadas esta mañana. Van 20 panes.',
    categoria: 'Pan del día',
    precioViejo: 16,
    precioNuevo: 6,
    recojoInicio: '18:00',
    recojoFin: '19:00',
    distanciaKm: 0.8,
    disponibles: 4,
    imagen: '/img/pan.jpg',
    kgComida: 1.2,
    kgCO2: 3,
  },
  {
    id: 'b2',
    vendedorId: 'v2',
    titulo: 'Almuerzo completo: sopa y segundo',
    descripcion: 'Sopa, segundo con arroz y ensalada. Lo que quedó en la olla del mediodía.',
    categoria: 'Almuerzo',
    precioViejo: 14,
    precioNuevo: 6,
    recojoInicio: '14:30',
    recojoFin: '15:30',
    distanciaKm: 1.2,
    disponibles: 3,
    imagen: '/img/almuerzo.jpg',
    kgComida: 0.9,
    kgCO2: 2.4,
  },
  {
    id: 'b3',
    vendedorId: 'v3',
    titulo: 'Salteñas de carne y pollo',
    descripcion: 'Las de la última hornada, jugosas. Cuatro por bolsa.',
    categoria: 'Almuerzo',
    precioViejo: 24,
    precioNuevo: 9,
    // Antes del mediodía a propósito: pasadas las 12 la salteña ya no se vende.
    recojoInicio: '11:30',
    recojoFin: '12:30',
    distanciaKm: 0.5,
    disponibles: 6,
    imagen: '/img/saltenas.jpg',
    kgComida: 0.7,
    kgCO2: 1.8,
  },
  {
    id: 'b4',
    vendedorId: 'v4',
    titulo: 'Api con pastel de queso',
    descripcion: 'Api morado calentito y pastel de queso frito, espolvoreado con azúcar.',
    categoria: 'Repostería',
    precioViejo: 12,
    precioNuevo: 5,
    recojoInicio: '10:30',
    recojoFin: '11:30',
    distanciaKm: 1.6,
    disponibles: 5,
    imagen: '/img/api.jpg',
    kgComida: 0.6,
    kgCO2: 1.5,
  },
  {
    id: 'b5',
    vendedorId: 'v5',
    titulo: 'Tucumanas fritas con sus salsas',
    descripcion: 'Tucumanas de carne y de pollo de la última tanda, con llajua y ensalada.',
    categoria: 'Almuerzo',
    precioViejo: 27,
    precioNuevo: 10,
    recojoInicio: '12:00',
    recojoFin: '13:00',
    distanciaKm: 2.1,
    disponibles: 5,
    imagen: '/img/tucumanas.jpg',
    kgComida: 0.8,
    kgCO2: 2.2,
  },
  {
    id: 'b6',
    vendedorId: 'v6',
    titulo: 'Canasta de fruta y verdura',
    descripcion: 'Papa, haba, choclo y verdura del puesto, listas para hoy mismo.',
    categoria: 'Frutas',
    precioViejo: 30,
    precioNuevo: 10,
    recojoInicio: '17:30',
    recojoFin: '18:30',
    distanciaKm: 2.6,
    disponibles: 7,
    imagen: '/img/verduras.jpg',
    kgComida: 2.5,
    kgCO2: 4.1,
  },
  {
    id: 'b7',
    vendedorId: 'v7',
    titulo: 'Salchipapa completa',
    descripcion: 'Papa frita, salchicha, chorrellana y llajua. Servida en el carrito.',
    categoria: 'Cena',
    precioViejo: 15,
    precioNuevo: 7,
    recojoInicio: '21:00',
    recojoFin: '22:00',
    distanciaKm: 1.9,
    disponibles: 4,
    imagen: '/img/salchipapa.jpg',
    kgComida: 1.1,
    kgCO2: 2.8,
  },
  {
    id: 'b8',
    vendedorId: 'v8',
    titulo: 'Sándwich de chola con cuerito',
    descripcion: 'Pierna de cerdo horneada, cuerito crocante y escabeche, en pan sarnita.',
    categoria: 'Cena',
    precioViejo: 15,
    precioNuevo: 7,
    recojoInicio: '20:00',
    recojoFin: '21:00',
    distanciaKm: 1.4,
    disponibles: 3,
    imagen: '/img/chola.jpg',
    kgComida: 1,
    kgCO2: 2.6,
  },
  {
    id: 'b9',
    vendedorId: 'v9',
    titulo: 'Lo que quedó en la olla',
    descripcion: 'Lo que no se sirvió al mediodía en el comedor del mercado.',
    categoria: 'Almuerzo',
    precioViejo: 22,
    precioNuevo: 8,
    // Ventana de excedente del comedor: después del pico y antes de cerrar.
    recojoInicio: '15:00',
    recojoFin: '16:00',
    distanciaKm: 1.1,
    disponibles: 4,
    // La foto muestra el comedor, nunca el contenido: es la única sorpresa.
    imagen: '/img/puesto.jpg',
    kgComida: 1.3,
    kgCO2: 3.2,
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
    total: 6,
    metodoPago: 'efectivo',
    estadoPago: 'pendiente',
  },
  {
    id: 'r2',
    bolsaId: 'b3',
    codigo: 'M2-P4',
    estado: 'recogida',
    fecha: 'Ayer',
    total: 9,
    metodoPago: 'qr',
    estadoPago: 'pagado',
  },
  {
    id: 'r3',
    bolsaId: 'b2',
    codigo: 'T8-L1',
    estado: 'recogida',
    fecha: '12 jul',
    total: 6,
    metodoPago: 'efectivo',
    estadoPago: 'pagado',
  },
]

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
    titulo: b.titulo,
    descripcion: b.descripcion,
    imagen: b.imagen,
    sorpresa: b.sorpresa,
  }
}

export const PUBLICACIONES: Publicacion[] = [publicacionDe('b1', 3, 1), publicacionDe('b4', 2, 2)]

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
    imagen: '/img/pan.jpg',
    kgComida: 1.2,
    kgCO2: 3,
  },
  Almuerzo: {
    titulo: 'Almuerzo completo del día',
    descripcion: 'Porciones del almuerzo que no se alcanzaron a servir.',
    imagen: '/img/almuerzo.jpg',
    kgComida: 0.9,
    kgCO2: 2.4,
  },
  Repostería: {
    titulo: 'Masitas y postres del día',
    descripcion: 'Masitas y frituras dulces de la última tanda.',
    imagen: '/img/humintas.jpg',
    kgComida: 0.6,
    kgCO2: 1.5,
  },
  Frutas: {
    titulo: 'Canasta de fruta y verdura',
    descripcion: 'Frutas y verduras maduras, perfectas para hoy mismo.',
    imagen: '/img/verduras.jpg',
    kgComida: 2.5,
    kgCO2: 4.1,
  },
  Cena: {
    titulo: 'Cena del carrito',
    descripcion: 'Lo que quedó armado al cierre del puesto.',
    imagen: '/img/salchipapa.jpg',
    kgComida: 1.1,
    kgCO2: 2.8,
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
  { src: '/img/pan.jpg', etiqueta: 'Pan y masitas' },
  { src: '/img/almuerzo.jpg', etiqueta: 'Almuerzo de pensión' },
  { src: '/img/saltenas.jpg', etiqueta: 'Salteñas y empanadas' },
  { src: '/img/tucumanas.jpg', etiqueta: 'Tucumanas' },
  { src: '/img/api.jpg', etiqueta: 'Api con pastel' },
  { src: '/img/humintas.jpg', etiqueta: 'Humintas y masitas' },
  { src: '/img/salchipapa.jpg', etiqueta: 'Salchipapa' },
  { src: '/img/chola.jpg', etiqueta: 'Sándwich de chola' },
  { src: '/img/verduras.jpg', etiqueta: 'Frutas y verduras' },
  { src: '/img/puesto.jpg', etiqueta: 'Mi puesto' },
]
