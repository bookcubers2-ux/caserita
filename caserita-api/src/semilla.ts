/** Catálogo inicial de Caserita en Santa Cruz de la Sierra. */

export const UBICACION_USUARIO: [number, number] = [-17.7802, -63.183]

export const VENDEDORES = [
  { id: 'v1', nombre: 'Panadería La Espiga', tipo: 'Panadería', direccion: 'Av. Cañoto esq. Sucre', rating: 4.8, lat: -17.7869, lng: -63.1876 },
  { id: 'v2', nombre: 'Pensión Doña Mary', tipo: 'Pensión', direccion: 'Barrio Equipetrol, calle 5', rating: 4.7, lat: -17.7681, lng: -63.1966 },
  { id: 'v3', nombre: 'Salteñería El Horno', tipo: 'Salteñería', direccion: '2do anillo, Av. Alemana', rating: 4.9, lat: -17.7729, lng: -63.1706 },
  { id: 'v4', nombre: 'Café Tajibo', tipo: 'Cafetería', direccion: 'Calle Bolívar 240, Centro', rating: 4.6, lat: -17.7818, lng: -63.1801 },
  { id: 'v5', nombre: 'Heladería Tropicana', tipo: 'Heladería', direccion: '3er anillo interno, Av. Banzer', rating: 4.5, lat: -17.7563, lng: -63.1792 },
  { id: 'v6', nombre: 'Mercado La Ramada · Puesto 42', tipo: 'Mercado', direccion: 'Mercado La Ramada, pasillo B', rating: 4.4, lat: -17.7901, lng: -63.1929 },
  { id: 'v7', nombre: 'Restaurante El Camba', tipo: 'Restaurante', direccion: 'Av. Busch 1120', rating: 4.7, lat: -17.7745, lng: -63.1848 },
  { id: 'v-mio', nombre: 'Mi negocio', tipo: 'Tu local', direccion: 'Santa Cruz de la Sierra', rating: 5, lat: -17.7808, lng: -63.1836 },
]

export const BOLSAS = [
  { id: 'b1', vendedorId: 'v1', titulo: 'Bolsa de pan del día', descripcion: 'Marraqueta, cuñapé y empanadas horneadas hoy temprano.', categoria: 'Pan del día', precioViejo: 35, precioNuevo: 12, recojoInicio: '18:00', recojoFin: '19:00', disponibles: 4, imagen: '/img/espiga.jpg', kgComida: 1.2, kgCO2: 3 },
  { id: 'b2', vendedorId: 'v2', titulo: 'Almuerzo casero del día', descripcion: 'Sopa, segundo con arroz y ensalada. Lo que quedó del almuerzo.', categoria: 'Almuerzo', precioViejo: 25, precioNuevo: 10, recojoInicio: '14:30', recojoFin: '15:30', disponibles: 3, imagen: '/img/mary.jpg', kgComida: 0.9, kgCO2: 2.4 },
  { id: 'b3', vendedorId: 'v3', titulo: 'Salteñas de media mañana', descripcion: 'Salteñas de carne y pollo recién salidas del horno.', categoria: 'Almuerzo', precioViejo: 18, precioNuevo: 7, recojoInicio: '10:30', recojoFin: '11:30', disponibles: 6, imagen: '/img/horno.jpg', kgComida: 0.7, kgCO2: 1.8 },
  { id: 'b4', vendedorId: 'v4', titulo: 'Bolsa de café y repostería', descripcion: 'Croissants, medialunas y un café del día para llevar.', categoria: 'Repostería', precioViejo: 28, precioNuevo: 9, recojoInicio: '19:00', recojoFin: '20:00', disponibles: 2, imagen: '/img/cafe.jpg', kgComida: 0.6, kgCO2: 1.5 },
  { id: 'b5', vendedorId: 'v5', titulo: 'Helados artesanales del día', descripcion: 'Potes surtidos de sabores tropicales: copoazú, maracuyá y chirimoya.', categoria: 'Repostería', precioViejo: 24, precioNuevo: 8, recojoInicio: '20:00', recojoFin: '21:00', disponibles: 5, imagen: '/img/heladeria.jpg', kgComida: 1, kgCO2: 2.2 },
  { id: 'b6', vendedorId: 'v6', titulo: 'Canasta de fruta y verdura', descripcion: 'Frutas maduras y verduras del puesto, perfectas para hoy mismo.', categoria: 'Frutas', precioViejo: 30, precioNuevo: 10, recojoInicio: '17:30', recojoFin: '18:30', disponibles: 7, imagen: '/img/mercado.jpg', kgComida: 2.5, kgCO2: 4.1 },
  { id: 'b7', vendedorId: 'v7', titulo: 'Cena rescatada del día', descripcion: 'Churrasco con yuca y ensalada, porciones que no se sirvieron.', categoria: 'Cena', precioViejo: 45, precioNuevo: 15, recojoInicio: '21:30', recojoFin: '22:15', disponibles: 3, imagen: '/img/restaurante.jpg', kgComida: 1.4, kgCO2: 3.6 },
]

export const RESERVAS_SEED = [
  { id: 'r1', bolsaId: 'b1', codigo: 'A7-K9', estado: 'activa', fecha: 'Hoy', total: 12, metodoPago: 'efectivo', estadoPago: 'pendiente' },
  { id: 'r2', bolsaId: 'b3', codigo: 'M2-P4', estado: 'recogida', fecha: 'Ayer', total: 7, metodoPago: 'qr', estadoPago: 'pagado' },
  { id: 'r3', bolsaId: 'b2', codigo: 'T8-L1', estado: 'recogida', fecha: '12 jul', total: 10, metodoPago: 'efectivo', estadoPago: 'pagado' },
]

/** Se derivan del catálogo para que vendedor y comprador nunca se contradigan. */
export const PUBLICACIONES = [
  { id: 'p1', bolsaId: 'b1', categoria: 'Pan del día', cantidad: 7, precio: 12, horario: '18:00-19:00', vendidas: 3 },
  { id: 'p2', bolsaId: 'b4', categoria: 'Repostería', cantidad: 4, precio: 9, horario: '19:00-20:00', vendidas: 2 },
]

export const USUARIO = {
  id: 'u1',
  nombre: 'Camila Áñez',
  ciudad: 'Santa Cruz de la Sierra',
  telefono: '+591 700 12345',
  comidasRescatadas: 47,
  comidasEsteMes: 12,
  kgCO2Evitado: 118,
  bsAhorrados: 640,
}

export const PLANTILLA_POR_CATEGORIA: Record<
  string,
  { titulo: string; descripcion: string; imagen: string; kgComida: number; kgCO2: number }
> = {
  'Pan del día': { titulo: 'Bolsa de pan del día', descripcion: 'Pan y masitas horneadas hoy que quedaron al cierre.', imagen: '/img/espiga.jpg', kgComida: 1.2, kgCO2: 3 },
  Almuerzo: { titulo: 'Almuerzo casero del día', descripcion: 'Porciones del almuerzo que no se alcanzaron a servir.', imagen: '/img/mary.jpg', kgComida: 0.9, kgCO2: 2.4 },
  Repostería: { titulo: 'Bolsa de repostería', descripcion: 'Repostería y masas dulces del día para llevar.', imagen: '/img/cafe.jpg', kgComida: 0.6, kgCO2: 1.5 },
  Frutas: { titulo: 'Canasta de fruta y verdura', descripcion: 'Frutas y verduras maduras, perfectas para hoy mismo.', imagen: '/img/mercado.jpg', kgComida: 2.5, kgCO2: 4.1 },
  Cena: { titulo: 'Cena rescatada del día', descripcion: 'Platos preparados que no se sirvieron esta noche.', imagen: '/img/restaurante.jpg', kgComida: 1.4, kgCO2: 3.6 },
}
