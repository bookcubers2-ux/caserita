/**
 * API de Caserita. Es independiente del servidor que la aloje: la misma
 * función `manejar` la usan la función de Vercel (api/index.ts) y el servidor
 * local de desarrollo (server/dev.ts).
 *
 * Flujo que importa:
 *   1. el vecino reserva y elige QR;
 *   2. paga con el QR de Caserita y sube la captura del comprobante;
 *   3. la foto llega a Telegram con "Aceptar" y "Rechazar";
 *   4. al aceptar, la reserva queda pagada y aparece en el panel de la casera;
 *   5. la casera marca "Entregado" cuando el vecino recoge;
 *   6. el vecino califica a la casera.
 */
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { q, uno, type Fila } from './db.js'
import { PLANTILLA_POR_CATEGORIA, UBICACION_USUARIO } from '../src/data/seed.js'
import * as tg from './telegram.js'

// ------------------------------------------------------------------ tipos

export interface Peticion {
  metodo: string
  /** Ruta sin el prefijo /api, por ejemplo "/reservas/r1/comprobante". */
  ruta: string
  query: URLSearchParams
  cabecera: (nombre: string) => string | undefined
  cuerpo: unknown
}

export interface Respuesta {
  status: number
  cuerpo: unknown
}

class ErrorHttp extends Error {
  constructor(
    public status: number,
    mensaje: string,
  ) {
    super(mensaje)
  }
}

const SECRETO = () => process.env.CASERITA_SECRETO || process.env.TELEGRAM_BOT_TOKEN || 'caserita-dev'
const APP_URL = () => (process.env.APP_URL || 'https://www.caserita.shop').replace(/\/$/, '')

const ok = (cuerpo: unknown, status = 200): Respuesta => ({ status, cuerpo })

// -------------------------------------------------------------- utilidades

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

function fechaCorta(ms: number): string {
  const tz = 'America/La_Paz'
  const dia = (t: number) => new Date(t).toLocaleDateString('es-BO', { timeZone: tz })
  const hoy = dia(Date.now())
  if (dia(ms) === hoy) return 'Hoy'
  if (dia(ms) === dia(Date.now() - 86_400_000)) return 'Ayer'
  return new Date(ms).toLocaleDateString('es-BO', { timeZone: tz, day: 'numeric', month: 'short' })
}

function firmar(id: string): string {
  return createHmac('sha256', SECRETO()).update(id).digest('base64url')
}

function tokenVendedor(id: string): string {
  return `${id}.${firmar(id)}`
}

function vendedorDesdeToken(token: string | undefined): string | null {
  if (!token) return null
  const i = token.indexOf('.')
  if (i < 1) return null
  const id = token.slice(0, i)
  const firma = token.slice(i + 1)
  const esperada = firmar(id)
  if (firma.length !== esperada.length) return null
  return timingSafeEqual(Buffer.from(firma), Buffer.from(esperada)) ? id : null
}

function esAdmin(p: Peticion): boolean {
  const clave = p.query.get('clave') ?? p.cabecera('x-caserita-clave')
  return Boolean(clave) && clave === SECRETO()
}

function cuerpoObj(p: Peticion): Record<string, unknown> {
  return p.cuerpo && typeof p.cuerpo === 'object' ? (p.cuerpo as Record<string, unknown>) : {}
}

// ----------------------------------------------------------------- armado

interface FilaBolsa extends Fila {
  id: string
  vendedor_id: string
  titulo: string
  descripcion: string
  categoria: string
  precio_viejo: number
  precio_nuevo: number
  recojo_inicio: string
  recojo_fin: string
  cantidad: number
  disponibles: number
  imagen: string
  kg_comida: number
  kg_co2: number
  sorpresa: boolean
  creada_en: number | string
  v_nombre: string
  v_tipo: string
  v_direccion: string
  v_rating_base: number
  v_lat: number
  v_lng: number
  v_rating: number | null
  v_opiniones: number | string
}

const SQL_BOLSAS = `
  SELECT b.*, v.nombre AS v_nombre, v.tipo AS v_tipo, v.direccion AS v_direccion,
         v.rating_base AS v_rating_base, v.lat AS v_lat, v.lng AS v_lng,
         (SELECT ROUND(AVG(estrellas)::numeric, 1) FROM calificaciones c WHERE c.vendedor_id = v.id) AS v_rating,
         (SELECT COUNT(*) FROM calificaciones c WHERE c.vendedor_id = v.id) AS v_opiniones
  FROM bolsas b JOIN vendedores v ON v.id = b.vendedor_id`

function armarBolsa(f: FilaBolsa, origen: [number, number]) {
  const opiniones = Number(f.v_opiniones)
  return {
    id: f.id,
    vendedorId: f.vendedor_id,
    titulo: f.titulo,
    descripcion: f.descripcion,
    categoria: f.categoria,
    precioViejo: f.precio_viejo,
    precioNuevo: f.precio_nuevo,
    recojoInicio: f.recojo_inicio,
    recojoFin: f.recojo_fin,
    disponibles: f.disponibles,
    imagen: f.imagen,
    kgComida: f.kg_comida,
    kgCO2: f.kg_co2,
    sorpresa: Boolean(f.sorpresa),
    distanciaKm: distanciaKm(origen, [f.v_lat, f.v_lng]),
    vendedor: {
      id: f.vendedor_id,
      nombre: f.v_nombre,
      tipo: f.v_tipo,
      direccion: f.v_direccion,
      rating: opiniones > 0 && f.v_rating != null ? Number(f.v_rating) : Number(f.v_rating_base),
      opiniones,
      lat: f.v_lat,
      lng: f.v_lng,
    },
  }
}

interface FilaReserva extends Fila {
  id: string
  bolsa_id: string
  vendedor_id: string
  cliente_id: string
  codigo: string
  estado: string
  total: number
  metodo_pago: string
  estado_pago: string
  referencia_pago: string | null
  tg_message_id: number | string | null
  nota: string | null
  creada_en: number | string
  entregada_en: number | string | null
  c_nombre?: string
  c_telefono?: string
  estrellas?: number | null
  comentario?: string | null
}

const SQL_RESERVAS = `
  SELECT r.*, cl.nombre AS c_nombre, cl.telefono AS c_telefono, ca.estrellas, ca.comentario
  FROM reservas r
  JOIN clientes cl ON cl.id = r.cliente_id
  LEFT JOIN calificaciones ca ON ca.reserva_id = r.id`

async function armarReserva(r: FilaReserva, origen: [number, number], conCliente = false) {
  const b = await uno<FilaBolsa>(`${SQL_BOLSAS} WHERE b.id = $1`, [r.bolsa_id])
  return {
    id: r.id,
    bolsaId: r.bolsa_id,
    codigo: r.codigo,
    estado: r.estado,
    fecha: fechaCorta(Number(r.creada_en)),
    creadaEn: Number(r.creada_en),
    total: r.total,
    metodoPago: r.metodo_pago,
    estadoPago: r.estado_pago,
    referenciaPago: r.referencia_pago ?? undefined,
    nota: r.nota ?? undefined,
    calificacion:
      r.estrellas != null ? { estrellas: Number(r.estrellas), comentario: r.comentario ?? '' } : undefined,
    cliente: conCliente ? { nombre: r.c_nombre ?? '', telefono: r.c_telefono ?? '' } : undefined,
    bolsa: b ? armarBolsa(b, origen) : undefined,
  }
}

function origenDe(p: Peticion): [number, number] {
  const lat = Number(p.query.get('lat'))
  const lng = Number(p.query.get('lng'))
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 ? [lat, lng] : UBICACION_USUARIO
}

// ---------------------------------------------------------------- clientes

async function clienteDe(p: Peticion, datos?: { nombre?: unknown; telefono?: unknown }) {
  const id = (p.cabecera('x-cliente-id') ?? '').trim()
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) throw new ErrorHttp(400, 'Falta identificar al cliente')
  const nombre = typeof datos?.nombre === 'string' ? datos.nombre.trim().slice(0, 60) : null
  const telefono = typeof datos?.telefono === 'string' ? datos.telefono.trim().slice(0, 30) : null
  await q(
    `INSERT INTO clientes (id, nombre, telefono, creado_en) VALUES ($1, COALESCE($2,''), COALESCE($3,''), $4)
     ON CONFLICT (id) DO UPDATE SET
       nombre = CASE WHEN $2 IS NULL THEN clientes.nombre ELSE $2 END,
       telefono = CASE WHEN $3 IS NULL THEN clientes.telefono ELSE $3 END`,
    [id, nombre, telefono, Date.now()],
  )
  return id
}

async function impacto(clienteId: string) {
  const f = await uno<{ n: number | string; mes: number | string; kg: number | string | null; bs: number | string | null }>(
    `SELECT COUNT(*) AS n,
            COUNT(*) FILTER (WHERE to_timestamp(r.creada_en/1000) AT TIME ZONE 'America/La_Paz' >= date_trunc('month', now() AT TIME ZONE 'America/La_Paz')) AS mes,
            SUM(b.kg_co2) AS kg, SUM(b.precio_viejo - b.precio_nuevo) AS bs
     FROM reservas r JOIN bolsas b ON b.id = r.bolsa_id
     WHERE r.cliente_id = $1 AND r.estado IN ('activa','entregada')`,
    [clienteId],
  )
  const c = await uno<{ nombre: string; telefono: string }>('SELECT nombre, telefono FROM clientes WHERE id = $1', [clienteId])
  return {
    id: clienteId,
    nombre: c?.nombre ?? '',
    ciudad: 'Santa Cruz de la Sierra',
    telefono: c?.telefono ?? '',
    comidasRescatadas: Number(f?.n ?? 0),
    comidasEsteMes: Number(f?.mes ?? 0),
    kgCO2Evitado: Math.round(Number(f?.kg ?? 0) * 10) / 10,
    bsAhorrados: Number(f?.bs ?? 0),
  }
}

// ---------------------------------------------------------------- reservas

async function reservaDelCliente(id: string, clienteId: string): Promise<FilaReserva> {
  const r = await uno<FilaReserva>(`${SQL_RESERVAS} WHERE r.id = $1 AND r.cliente_id = $2`, [id, clienteId])
  if (!r) throw new ErrorHttp(404, 'Reserva no encontrada')
  return r
}

async function textoPedido(r: FilaReserva): Promise<string> {
  const b = await uno<FilaBolsa>(`${SQL_BOLSAS} WHERE b.id = $1`, [r.bolsa_id])
  return (
    `Pedido: <code>${r.id}</code> · Código de retiro: <b>${r.codigo}</b>\n` +
    `Puesto: <b>${b?.v_nombre ?? '?'}</b>\n` +
    `Producto: ${b?.titulo ?? '?'}\n` +
    `Total: <b>Bs ${r.total}</b> · ${r.metodo_pago === 'qr' ? 'QR' : 'Efectivo al recoger'}\n` +
    `Cliente: ${r.c_nombre || 'sin nombre'} ${r.c_telefono ? '· ' + r.c_telefono : ''}\n` +
    `Recojo: ${b?.recojo_inicio ?? ''} a ${b?.recojo_fin ?? ''}\n` +
    `${tg.hora(Number(r.creada_en))}`
  )
}

async function crearReserva(p: Peticion): Promise<Respuesta> {
  const datos = cuerpoObj(p)
  const bolsaId = String(datos.bolsaId ?? '')
  const metodo = datos.metodoPago === 'qr' ? 'qr' : 'efectivo'
  const nota = typeof datos.nota === 'string' ? datos.nota.trim().slice(0, 200) : null
  if (!bolsaId) throw new ErrorHttp(400, 'Falta bolsaId')
  const clienteId = await clienteDe(p, datos)

  const b = await uno<FilaBolsa>('SELECT * FROM bolsas WHERE id = $1', [bolsaId])
  if (!b) throw new ErrorHttp(404, 'Bolsa no encontrada')

  // Descontar stock de forma atómica: si dos vecinos reservan la última a la
  // vez, solo una fila cambia y la otra persona recibe "agotada".
  const bajada = await q('UPDATE bolsas SET disponibles = disponibles - 1 WHERE id = $1 AND disponibles > 0 RETURNING id', [bolsaId])
  if (bajada.length === 0) throw new ErrorHttp(409, 'Se agotó mientras reservabas')

  const ahora = Date.now()
  const id = `r${ahora.toString(36)}${Math.random().toString(36).slice(2, 5)}`
  await q(
    `INSERT INTO reservas (id, bolsa_id, vendedor_id, cliente_id, codigo, estado, total, metodo_pago, estado_pago, nota, creada_en, actualizada_en)
     VALUES ($1,$2,$3,$4,$5,'activa',$6,$7,'pendiente',$8,$9,$9)`,
    [id, bolsaId, b.vendedor_id, clienteId, nuevoCodigo(), b.precio_nuevo, metodo, nota, ahora],
  )
  const r = await reservaDelCliente(id, clienteId)

  if (metodo === 'efectivo') {
    // Se avisa igual, para que sepamos que hay un pedido aunque no haya que verificar nada.
    const mid = await tg.enviarMensaje(`🧾 <b>PEDIDO EN EFECTIVO</b>\n\n${await textoPedido(r)}`)
    if (mid) await q('UPDATE reservas SET tg_message_id = $1 WHERE id = $2', [mid, id])
  }
  return ok(await armarReserva(r, origenDe(p)), 201)
}

function decodificarImagen(dataUrl: unknown): { bytes: Uint8Array; mime: string; ext: string } {
  if (typeof dataUrl !== 'string') throw new ErrorHttp(400, 'Falta la imagen del comprobante')
  const m = /^data:(image\/(jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!m) throw new ErrorHttp(400, 'El comprobante debe ser una imagen JPG, PNG o WebP')
  const bytes = new Uint8Array(Buffer.from(m[3], 'base64'))
  if (bytes.byteLength < 2_000) throw new ErrorHttp(400, 'La imagen llegó vacía')
  if (bytes.byteLength > 3_500_000) throw new ErrorHttp(413, 'La imagen es muy pesada; intenta con una captura más chica')
  const ext = m[2] === 'jpeg' ? 'jpg' : m[2]
  return { bytes, mime: m[1], ext }
}

async function subirComprobante(p: Peticion, id: string): Promise<Respuesta> {
  const clienteId = await clienteDe(p)
  const r = await reservaDelCliente(id, clienteId)
  if (r.estado !== 'activa') throw new ErrorHttp(409, 'Esta reserva ya no está activa')
  if (r.estado_pago === 'pagado') throw new ErrorHttp(409, 'Este pedido ya está pagado')
  const { bytes, mime, ext } = decodificarImagen(cuerpoObj(p).imagen)

  const botones: tg.Botones = {
    inline_keyboard: [
      [
        { text: '✅ Aceptar pago', callback_data: `ok_${id}` },
        { text: '❌ Rechazar', callback_data: `no_${id}` },
      ],
    ],
  }
  const { messageId, fileId } = await tg.enviarFoto(
    bytes,
    mime,
    `comprobante-${id}.${ext}`,
    `📸 <b>COMPROBANTE DE PAGO</b>\n\n${await textoPedido(r)}`,
    botones,
  )
  if (tg.telegramConfigurado() && !messageId) throw new ErrorHttp(502, `No pudimos enviar el comprobante; intenta de nuevo (${tg.ultimoError || 'sin detalle'})`)

  await q(
    `UPDATE reservas SET metodo_pago = 'qr', estado_pago = 'verificando', comprobante_file_id = $1,
            tg_message_id = COALESCE($2, tg_message_id), actualizada_en = $3 WHERE id = $4`,
    [fileId, messageId, Date.now(), id],
  )
  // Sin bot configurado (desarrollo local) el pago se acepta solo, para poder probar el flujo completo.
  if (!tg.telegramConfigurado()) await resolverPago(id, true, 'LOCAL')
  return ok(await armarReserva(await reservaDelCliente(id, clienteId), origenDe(p)))
}

async function resolverPago(id: string, aceptar: boolean, referencia: string): Promise<FilaReserva | undefined> {
  const r = await uno<FilaReserva>('SELECT * FROM reservas WHERE id = $1', [id])
  if (!r) return undefined
  if (aceptar) {
    await q(
      `UPDATE reservas SET estado_pago = 'pagado', referencia_pago = $1, actualizada_en = $2 WHERE id = $3`,
      [referencia, Date.now(), id],
    )
  } else {
    await q(`UPDATE reservas SET estado_pago = 'rechazado', actualizada_en = $1 WHERE id = $2`, [Date.now(), id])
  }
  return uno<FilaReserva>(`${SQL_RESERVAS} WHERE r.id = $1`, [id])
}

async function pagarAlRecoger(p: Peticion, id: string): Promise<Respuesta> {
  const clienteId = await clienteDe(p)
  const r = await reservaDelCliente(id, clienteId)
  if (r.estado_pago === 'pagado') throw new ErrorHttp(409, 'Este pedido ya está pagado')
  await q(`UPDATE reservas SET metodo_pago = 'efectivo', estado_pago = 'pendiente', actualizada_en = $1 WHERE id = $2`, [Date.now(), id])
  if (!r.tg_message_id) {
    const mid = await tg.enviarMensaje(`🧾 <b>PEDIDO EN EFECTIVO</b>\n\n${await textoPedido(r)}`)
    if (mid) await q('UPDATE reservas SET tg_message_id = $1 WHERE id = $2', [mid, id])
  }
  return ok(await armarReserva(await reservaDelCliente(id, clienteId), origenDe(p)))
}

async function cancelarReserva(p: Peticion, id: string): Promise<Respuesta> {
  const clienteId = await clienteDe(p)
  const r = await reservaDelCliente(id, clienteId)
  if (r.estado !== 'activa') throw new ErrorHttp(409, 'Esta reserva ya no se puede cancelar')
  if (r.estado_pago === 'pagado') throw new ErrorHttp(409, 'Ya está pagada: escríbenos por WhatsApp para devolverte el dinero')
  await q(`UPDATE reservas SET estado = 'cancelada', actualizada_en = $1 WHERE id = $2`, [Date.now(), id])
  await q('UPDATE bolsas SET disponibles = disponibles + 1 WHERE id = $1', [r.bolsa_id])
  if (r.estado_pago === 'verificando') await tg.enviarMensaje(`↩️ El cliente canceló el pedido <code>${id}</code> antes de la verificación.`)
  return { status: 204, cuerpo: undefined }
}

async function marcarEntregada(id: string): Promise<void> {
  const ahora = Date.now()
  await q(
    `UPDATE reservas SET estado = 'entregada', entregada_en = $1, actualizada_en = $1,
            estado_pago = CASE WHEN metodo_pago = 'efectivo' AND estado_pago <> 'pagado' THEN 'pagado' ELSE estado_pago END,
            referencia_pago = CASE WHEN metodo_pago = 'efectivo' AND referencia_pago IS NULL THEN 'EFECTIVO' ELSE referencia_pago END
     WHERE id = $2 AND estado = 'activa'`,
    [ahora, id],
  )
}

async function calificar(p: Peticion, id: string): Promise<Respuesta> {
  const clienteId = await clienteDe(p)
  const r = await reservaDelCliente(id, clienteId)
  if (r.estado !== 'entregada') throw new ErrorHttp(409, 'Podrás calificar cuando recojas tu pedido')
  const datos = cuerpoObj(p)
  const estrellas = Math.round(Number(datos.estrellas))
  if (!(estrellas >= 1 && estrellas <= 5)) throw new ErrorHttp(400, 'Elige de 1 a 5 estrellas')
  const comentario = typeof datos.comentario === 'string' ? datos.comentario.trim().slice(0, 300) : ''
  await q(
    `INSERT INTO calificaciones (id, reserva_id, vendedor_id, cliente_id, estrellas, comentario, creada_en)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (reserva_id) DO UPDATE SET estrellas = $5, comentario = $6`,
    [randomUUID(), id, r.vendedor_id, clienteId, estrellas, comentario, Date.now()],
  )
  return ok(await armarReserva(await reservaDelCliente(id, clienteId), origenDe(p)))
}

// --------------------------------------------------------------- vendedora

async function entrarVendedor(p: Peticion): Promise<Respuesta> {
  const pin = String(cuerpoObj(p).pin ?? '').trim()
  if (!/^\d{4,8}$/.test(pin)) throw new ErrorHttp(400, 'El código del puesto tiene 4 números')
  const v = await uno<{ id: string; nombre: string; tipo: string; direccion: string }>(
    'SELECT id, nombre, tipo, direccion FROM vendedores WHERE pin = $1',
    [pin],
  )
  if (!v) throw new ErrorHttp(401, 'Ese código no corresponde a ningún puesto')
  return ok({ vendedor: v, token: tokenVendedor(v.id) })
}

function vendedorDe(p: Peticion): string {
  const id = vendedorDesdeToken(p.cabecera('x-vendedor-token'))
  if (!id) throw new ErrorHttp(401, 'Entra con el código de tu puesto')
  return id
}

async function publicacionesDe(vendedorId: string) {
  const filas = await q<FilaBolsa & { vendidas: number | string }>(
    `SELECT b.*, (SELECT COUNT(*) FROM reservas r WHERE r.bolsa_id = b.id AND r.estado IN ('activa','entregada')) AS vendidas
     FROM bolsas b WHERE b.vendedor_id = $1 ORDER BY b.creada_en DESC`,
    [vendedorId],
  )
  return filas.map((b) => ({
    id: b.id,
    bolsaId: b.id,
    categoria: b.categoria,
    cantidad: b.cantidad,
    precio: b.precio_nuevo,
    horario: `${b.recojo_inicio}-${b.recojo_fin}`,
    vendidas: Number(b.vendidas),
    titulo: b.titulo,
    descripcion: b.descripcion,
    imagen: b.imagen,
    sorpresa: Boolean(b.sorpresa),
    estado: b.disponibles > 0 ? 'activa' : 'agotada',
  }))
}

async function crearPublicacion(p: Peticion): Promise<Respuesta> {
  const vendedorId = vendedorDe(p)
  const d = cuerpoObj(p)
  const categoria = String(d.categoria ?? '')
  const plantilla = (PLANTILLA_POR_CATEGORIA as Record<string, { titulo: string; descripcion: string; imagen: string; kgComida: number; kgCO2: number }>)[categoria]
  if (!plantilla) throw new ErrorHttp(400, 'Categoría desconocida')
  const cantidad = Number(d.cantidad)
  const precio = Number(d.precio)
  if (!Number.isFinite(cantidad) || cantidad < 1 || cantidad > 200) throw new ErrorHttp(400, 'Cantidad inválida')
  if (!Number.isFinite(precio) || precio < 1 || precio > 500) throw new ErrorHttp(400, 'Precio inválido')
  const [inicio, fin] = String(d.horario ?? '18:00-19:00').split(/\s*[-–]\s*/)
  const sorpresa = Boolean(d.sorpresa)
  const titulo = (typeof d.titulo === 'string' && d.titulo.trim()) || plantilla.titulo
  const descripcion = sorpresa ? '' : (typeof d.descripcion === 'string' && d.descripcion.trim()) || plantilla.descripcion
  const imagen = typeof d.imagen === 'string' && d.imagen.startsWith('/img/') ? d.imagen : plantilla.imagen
  const ahora = Date.now()
  const id = `b-${ahora.toString(36)}${Math.random().toString(36).slice(2, 5)}`
  await q(
    `INSERT INTO bolsas (id, vendedor_id, titulo, descripcion, categoria, precio_viejo, precio_nuevo, recojo_inicio, recojo_fin,
                         cantidad, disponibles, imagen, kg_comida, kg_co2, sorpresa, creada_en)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11,$12,$13,$14,$15)`,
    [id, vendedorId, titulo.slice(0, 80), descripcion.slice(0, 240), categoria, Math.round(precio * 2.6), Math.round(precio),
      inicio ?? '18:00', fin ?? '19:00', Math.round(cantidad), imagen, plantilla.kgComida, plantilla.kgCO2, sorpresa, ahora],
  )
  const pubs = await publicacionesDe(vendedorId)
  return ok(pubs.find((x) => x.id === id), 201)
}

async function pedidosVendedor(p: Peticion): Promise<Respuesta> {
  const vendedorId = vendedorDe(p)
  const desde = Date.now() - 3 * 86_400_000
  const filas = await q<FilaReserva>(
    `${SQL_RESERVAS} WHERE r.vendedor_id = $1 AND (r.estado = 'activa' OR r.actualizada_en > $2) ORDER BY r.creada_en DESC`,
    [vendedorId, desde],
  )
  const salida = []
  for (const f of filas) salida.push(await armarReserva(f, UBICACION_USUARIO, true))
  return ok(salida)
}

async function entregarVendedor(p: Peticion, id: string): Promise<Respuesta> {
  const vendedorId = vendedorDe(p)
  const r = await uno<FilaReserva>('SELECT * FROM reservas WHERE id = $1 AND vendedor_id = $2', [id, vendedorId])
  if (!r) throw new ErrorHttp(404, 'Pedido no encontrado')
  if (r.estado !== 'activa') throw new ErrorHttp(409, 'Este pedido ya fue cerrado')
  await marcarEntregada(id)
  await tg.enviarMensaje(`📦 <b>ENTREGADO</b> por la casera · pedido <code>${id}</code> · código ${r.codigo} · Bs ${r.total}`)
  const f = await uno<FilaReserva>(`${SQL_RESERVAS} WHERE r.id = $1`, [id])
  return ok(await armarReserva(f!, UBICACION_USUARIO, true))
}

async function opiniones(vendedorId: string): Promise<Respuesta> {
  const filas = await q<{ estrellas: number; comentario: string; creada_en: number | string; nombre: string }>(
    `SELECT c.estrellas, c.comentario, c.creada_en, cl.nombre
     FROM calificaciones c JOIN clientes cl ON cl.id = c.cliente_id
     WHERE c.vendedor_id = $1 ORDER BY c.creada_en DESC LIMIT 30`,
    [vendedorId],
  )
  return ok(
    filas.map((f) => ({
      estrellas: Number(f.estrellas),
      comentario: f.comentario,
      fecha: fechaCorta(Number(f.creada_en)),
      nombre: f.nombre ? f.nombre.split(' ')[0] : 'Vecino',
    })),
  )
}

// ---------------------------------------------------------------- telegram

async function webhookTelegram(p: Peticion): Promise<Respuesta> {
  const secreto = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secreto && p.cabecera('x-telegram-bot-api-secret-token') !== secreto) throw new ErrorHttp(401, 'Secreto inválido')
  const u = cuerpoObj(p) as {
    callback_query?: { id: string; data?: string; message?: { message_id: number; chat: { id: number } } }
    message?: { text?: string; chat: { id: number } }
  }

  if (u.message?.text?.startsWith('/start') || u.message?.text?.startsWith('/id')) {
    // Para saber el chat id al configurar el bot por primera vez.
    const chat = u.message.chat.id
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: `Caserita bot listo. Tu chat id es ${chat}` }),
    }).catch(() => undefined)
    return ok({ ok: true })
  }

  const cb = u.callback_query
  if (!cb?.data) return ok({ ok: true })
  const [accion, ...resto] = cb.data.split('_')
  const id = resto.join('_')
  if (accion !== 'ok' && accion !== 'no') return ok({ ok: true })

  const r = await resolverPago(id, accion === 'ok', `TG-${cb.message?.message_id ?? 0}`)
  if (!r) {
    await tg.responderCallback(cb.id, 'Pedido no encontrado')
    return ok({ ok: true })
  }
  if (cb.message) await tg.quitarBotones(cb.message.chat.id, cb.message.message_id)
  await tg.responderCallback(cb.id, accion === 'ok' ? 'Pago aceptado' : 'Pago rechazado')
  await tg.enviarMensaje(
    accion === 'ok'
      ? `✅ <b>PAGO ACEPTADO</b>\n\n${await textoPedido(r)}\n\nLa casera ya lo ve en su panel y el vecino recibe su confirmación.`
      : `❌ <b>PAGO RECHAZADO</b>\n\nPedido <code>${id}</code>. El vecino verá que debe volver a subir el comprobante o pagar al recoger.`,
  )
  return ok({ ok: true })
}

// ------------------------------------------------------------------- admin

async function reservasAdmin(): Promise<Respuesta> {
  const filas = await q<FilaReserva>(`${SQL_RESERVAS} ORDER BY r.creada_en DESC LIMIT 200`)
  const salida = []
  for (const f of filas) salida.push(await armarReserva(f, UBICACION_USUARIO, true))
  return ok(salida)
}

async function reiniciar(): Promise<Respuesta> {
  await q('DELETE FROM calificaciones')
  await q('DELETE FROM reservas')
  await q('DELETE FROM bolsas')
  await q('DELETE FROM clientes')
  await q('DELETE FROM vendedores')
  const { prepararEsquema } = await import('./esquema.js')
  await prepararEsquema(q)
  return ok({ ok: true })
}

// ------------------------------------------------------------------ router

export async function manejar(p: Peticion): Promise<Respuesta> {
  try {
    return await enrutar(p)
  } catch (e) {
    if (e instanceof ErrorHttp) return { status: e.status, cuerpo: { error: e.message } }
    console.error('[api]', e)
    const detalle = e instanceof Error ? e.message.slice(0, 300) : String(e)
    return { status: 500, cuerpo: { error: 'Algo salió mal en el servidor de Caserita', detalle } }
  }
}

async function enrutar(p: Peticion): Promise<Respuesta> {
  const m = p.metodo.toUpperCase()
  const partes = p.ruta.replace(/\/+$/, '').split('/').filter(Boolean)
  const [a, b, c, d] = partes
  const origen = origenDe(p)

  if (a === 'salud' && m === 'GET') {
    const base = {
      telegram: tg.telegramConfigurado(),
      db: process.env.DATABASE_URL ? 'neon' : process.env.VERCEL ? 'FALTA DATABASE_URL' : 'pglite',
      secreto: Boolean(process.env.CASERITA_SECRETO),
      webhookSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
    }
    try {
      const f = await uno<{ n: number | string }>('SELECT COUNT(*) AS n FROM bolsas')
      return ok({ ok: true, bolsas: Number(f?.n ?? 0), ...base })
    } catch (e) {
      return { status: 503, cuerpo: { ok: false, ...base, error: (e as Error).message } }
    }
  }

  if (a === 'bolsas' && m === 'GET') {
    if (b) {
      const f = await uno<FilaBolsa>(`${SQL_BOLSAS} WHERE b.id = $1`, [b])
      if (!f) throw new ErrorHttp(404, 'Bolsa no encontrada')
      return ok(armarBolsa(f, origen))
    }
    const filas = await q<FilaBolsa>(`${SQL_BOLSAS} ORDER BY b.creada_en DESC`)
    return ok(filas.map((f) => armarBolsa(f, origen)))
  }

  if (a === 'vendedores' && b && c === 'opiniones' && m === 'GET') return opiniones(b)

  if (a === 'usuario') {
    const clienteId = await clienteDe(p, m === 'PUT' ? cuerpoObj(p) : undefined)
    return ok(await impacto(clienteId))
  }

  if (a === 'reservas') {
    if (!b && m === 'GET') {
      const clienteId = await clienteDe(p)
      const filas = await q<FilaReserva>(`${SQL_RESERVAS} WHERE r.cliente_id = $1 ORDER BY r.creada_en DESC LIMIT 100`, [clienteId])
      const salida = []
      for (const f of filas) salida.push(await armarReserva(f, origen))
      return ok(salida)
    }
    if (!b && m === 'POST') return crearReserva(p)
    if (b && !c && m === 'GET') return ok(await armarReserva(await reservaDelCliente(b, await clienteDe(p)), origen))
    if (b && !c && m === 'DELETE') return cancelarReserva(p, b)
    if (b && c === 'comprobante' && m === 'POST') return subirComprobante(p, b)
    if (b && c === 'efectivo' && m === 'PATCH') return pagarAlRecoger(p, b)
    if (b && c === 'calificar' && m === 'POST') return calificar(p, b)
    if (b && c === 'recogida' && m === 'PATCH') {
      const clienteId = await clienteDe(p)
      const r = await reservaDelCliente(b, clienteId)
      if (r.estado !== 'activa') throw new ErrorHttp(409, 'Esta reserva ya no está activa')
      await marcarEntregada(b)
      return ok(await armarReserva(await reservaDelCliente(b, clienteId), origen))
    }
  }

  if (a === 'publicaciones') {
    if (m === 'GET') return ok(await publicacionesDe(vendedorDe(p)))
    if (m === 'POST') return crearPublicacion(p)
  }

  if (a === 'vendedor') {
    if (b === 'entrar' && m === 'POST') return entrarVendedor(p)
    if (b === 'pedidos' && !c && m === 'GET') return pedidosVendedor(p)
    if (b === 'pedidos' && c && d === 'entregar' && m === 'PATCH') return entregarVendedor(p, c)
  }

  if (a === 'telegram') {
    if (b === 'webhook' && m === 'POST') return webhookTelegram(p)
    if (b === 'configurar' && m === 'GET') {
      if (!esAdmin(p)) throw new ErrorHttp(401, 'Clave inválida')
      const url = `${APP_URL()}/api/telegram/webhook`
      const r = await tg.registrarWebhook(url, process.env.TELEGRAM_WEBHOOK_SECRET ?? '')
      return ok({ url, resultado: r, info: await tg.infoWebhook() })
    }
  }

  if (a === 'admin' && esAdmin(p)) {
    if (b === 'reservas' && m === 'GET') return reservasAdmin()
    if (b === 'reiniciar' && m === 'POST') return reiniciar()
  }
  if (a === 'reiniciar' && m === 'POST') {
    if (process.env.DATABASE_URL && !esAdmin(p)) throw new ErrorHttp(401, 'Solo el administrador puede reiniciar')
    return reiniciar()
  }

  throw new ErrorHttp(404, 'Ruta no encontrada')
}
