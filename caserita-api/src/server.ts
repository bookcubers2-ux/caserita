import express from 'express'
import cors from 'cors'
import { db, sembrar } from './db.js'
import { PLANTILLA_POR_CATEGORIA, UBICACION_USUARIO } from './semilla.js'

const app = express()
app.use(cors())
app.use(express.json())

sembrar()

/** Mientras no haya login, todas las peticiones son del mismo usuario. */
const USUARIO_ACTUAL = 'u1'

// ---------------------------------------------------------------- utilidades

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

interface FilaBolsa {
  id: string
  vendedorId: string
  titulo: string
  descripcion: string
  categoria: string
  precioViejo: number
  precioNuevo: number
  recojoInicio: string
  recojoFin: string
  disponibles: number
  imagen: string
  kgComida: number
  kgCO2: number
  v_nombre: string
  v_tipo: string
  v_direccion: string
  v_rating: number
  v_lat: number
  v_lng: number
}

const SQL_BOLSAS = `
  SELECT b.*, v.nombre AS v_nombre, v.tipo AS v_tipo, v.direccion AS v_direccion,
         v.rating AS v_rating, v.lat AS v_lat, v.lng AS v_lng
  FROM bolsas b JOIN vendedores v ON v.id = b.vendedorId
`

function armarBolsa(f: FilaBolsa) {
  return {
    id: f.id,
    vendedorId: f.vendedorId,
    titulo: f.titulo,
    descripcion: f.descripcion,
    categoria: f.categoria,
    precioViejo: f.precioViejo,
    precioNuevo: f.precioNuevo,
    recojoInicio: f.recojoInicio,
    recojoFin: f.recojoFin,
    disponibles: f.disponibles,
    imagen: f.imagen,
    kgComida: f.kgComida,
    kgCO2: f.kgCO2,
    distanciaKm: distanciaKm(UBICACION_USUARIO, [f.v_lat, f.v_lng]),
    vendedor: {
      id: f.vendedorId,
      nombre: f.v_nombre,
      tipo: f.v_tipo,
      direccion: f.v_direccion,
      rating: f.v_rating,
      lat: f.v_lat,
      lng: f.v_lng,
    },
  }
}

// -------------------------------------------------------------------- bolsas

app.get('/api/bolsas', (_req, res) => {
  const filas = db.prepare(`${SQL_BOLSAS} ORDER BY b.creadaEn DESC`).all() as FilaBolsa[]
  res.json(filas.map(armarBolsa))
})

app.get('/api/bolsas/:id', (req, res) => {
  const f = db.prepare(`${SQL_BOLSAS} WHERE b.id = ?`).get(req.params.id) as FilaBolsa | undefined
  if (!f) return res.status(404).json({ error: 'Bolsa no encontrada' })
  res.json(armarBolsa(f))
})

// ------------------------------------------------------------------ reservas

const SQL_RESERVAS = `SELECT * FROM reservas WHERE usuarioId = ? ORDER BY creadaEn DESC`

function reservaConBolsa(r: Record<string, unknown>) {
  const f = db.prepare(`${SQL_BOLSAS} WHERE b.id = ?`).get(r.bolsaId) as FilaBolsa | undefined
  return { ...r, bolsa: f ? armarBolsa(f) : undefined }
}

app.get('/api/reservas', (_req, res) => {
  const filas = db.prepare(SQL_RESERVAS).all(USUARIO_ACTUAL) as Record<string, unknown>[]
  res.json(filas.map(reservaConBolsa))
})

/**
 * Reservar descuenta stock DENTRO de una transacción: si dos personas tocan
 * "Reservar" a la vez sobre la última bolsa, solo una gana. Eso es justamente
 * lo que no se puede garantizar sin backend.
 */
app.post('/api/reservas', (req, res) => {
  const { bolsaId, metodoPago } = req.body ?? {}
  if (!bolsaId) return res.status(400).json({ error: 'Falta bolsaId' })

  try {
    const reserva = db.transaction(() => {
      const bolsa = db.prepare('SELECT * FROM bolsas WHERE id = ?').get(bolsaId) as
        | { disponibles: number; precioNuevo: number; precioViejo: number; kgCO2: number }
        | undefined
      if (!bolsa) throw new Error('NO_EXISTE')
      if (bolsa.disponibles <= 0) throw new Error('AGOTADA')

      db.prepare('UPDATE bolsas SET disponibles = disponibles - 1 WHERE id = ?').run(bolsaId)

      const nueva = {
        id: `r${Date.now()}`,
        bolsaId,
        usuarioId: USUARIO_ACTUAL,
        codigo: nuevoCodigo(),
        estado: 'activa',
        fecha: 'Hoy',
        total: bolsa.precioNuevo,
        metodoPago: metodoPago === 'qr' ? 'qr' : 'efectivo',
        estadoPago: 'pendiente',
      }
      db.prepare(
        `INSERT INTO reservas (id, bolsaId, usuarioId, codigo, estado, fecha, total, metodoPago, estadoPago)
         VALUES (@id, @bolsaId, @usuarioId, @codigo, @estado, @fecha, @total, @metodoPago, @estadoPago)`,
      ).run(nueva)

      db.prepare(
        `UPDATE usuarios SET comidasRescatadas = comidasRescatadas + 1,
                             comidasEsteMes = comidasEsteMes + 1,
                             kgCO2Evitado = ROUND(kgCO2Evitado + ?, 1),
                             bsAhorrados = bsAhorrados + ?
         WHERE id = ?`,
      ).run(bolsa.kgCO2, bolsa.precioViejo - bolsa.precioNuevo, USUARIO_ACTUAL)

      return nueva
    })()

    res.status(201).json(reservaConBolsa(reserva))
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'NO_EXISTE') return res.status(404).json({ error: 'Bolsa no encontrada' })
    if (msg === 'AGOTADA')
      return res.status(409).json({ error: 'Esa bolsa se agotó mientras reservabas' })
    throw e
  }
})

app.patch('/api/reservas/:id/pago', (req, res) => {
  const { estado, referencia } = req.body ?? {}
  const permitidos = ['pendiente', 'esperando', 'procesando', 'pagado', 'expirado']
  if (!permitidos.includes(estado)) return res.status(400).json({ error: 'Estado de pago inválido' })

  const info = db
    .prepare(
      `UPDATE reservas
       SET estadoPago = ?, referenciaPago = COALESCE(?, referenciaPago),
           metodoPago = CASE WHEN ? = 'pendiente' THEN 'efectivo' ELSE 'qr' END
       WHERE id = ? AND usuarioId = ?`,
    )
    .run(estado, referencia ?? null, estado, req.params.id, USUARIO_ACTUAL)

  if (info.changes === 0) return res.status(404).json({ error: 'Reserva no encontrada' })
  const r = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json(reservaConBolsa(r))
})

app.patch('/api/reservas/:id/recogida', (req, res) => {
  const info = db
    .prepare(`UPDATE reservas SET estado = 'recogida' WHERE id = ? AND usuarioId = ?`)
    .run(req.params.id, USUARIO_ACTUAL)
  if (info.changes === 0) return res.status(404).json({ error: 'Reserva no encontrada' })
  const r = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json(reservaConBolsa(r))
})

/** Cancelar devuelve la bolsa al stock y revierte el impacto acumulado. */
app.delete('/api/reservas/:id', (req, res) => {
  const hecho = db.transaction(() => {
    const r = db
      .prepare('SELECT * FROM reservas WHERE id = ? AND usuarioId = ?')
      .get(req.params.id, USUARIO_ACTUAL) as { bolsaId: string } | undefined
    if (!r) return false

    const b = db.prepare('SELECT * FROM bolsas WHERE id = ?').get(r.bolsaId) as
      | { precioViejo: number; precioNuevo: number; kgCO2: number }
      | undefined

    db.prepare('UPDATE bolsas SET disponibles = disponibles + 1 WHERE id = ?').run(r.bolsaId)
    db.prepare('DELETE FROM deliveries WHERE reservaId = ?').run(req.params.id)
    db.prepare('DELETE FROM reservas WHERE id = ?').run(req.params.id)

    if (b) {
      db.prepare(
        `UPDATE usuarios SET comidasRescatadas = MAX(0, comidasRescatadas - 1),
                             comidasEsteMes = MAX(0, comidasEsteMes - 1),
                             kgCO2Evitado = MAX(0, ROUND(kgCO2Evitado - ?, 1)),
                             bsAhorrados = MAX(0, bsAhorrados - ?)
         WHERE id = ?`,
      ).run(b.kgCO2, b.precioViejo - b.precioNuevo, USUARIO_ACTUAL)
    }
    return true
  })()

  if (!hecho) return res.status(404).json({ error: 'Reserva no encontrada' })
  res.status(204).end()
})

// ------------------------------------------------------------- publicaciones

app.get('/api/publicaciones', (_req, res) => {
  const filas = db
    .prepare(
      `SELECT p.*, COALESCE(b.disponibles, 0) AS disponibles
       FROM publicaciones p LEFT JOIN bolsas b ON b.id = p.bolsaId
       ORDER BY p.creadaEn DESC`,
    )
    .all() as (Record<string, unknown> & { disponibles: number })[]

  // El estado se DERIVA del stock real, no se guarda suelto: así el panel del
  // vendedor nunca puede contradecir la vitrina del comprador.
  res.json(filas.map((p) => ({ ...p, estado: p.disponibles > 0 ? 'activa' : 'agotada' })))
})

/** Publicar crea la publicación Y la bolsa que verá el comprador. */
app.post('/api/publicaciones', (req, res) => {
  const { categoria, cantidad, precio, horario } = req.body ?? {}
  const plantilla = PLANTILLA_POR_CATEGORIA[categoria]
  if (!plantilla) return res.status(400).json({ error: 'Categoría desconocida' })
  if (!Number.isFinite(cantidad) || cantidad < 1) return res.status(400).json({ error: 'Cantidad inválida' })
  if (!Number.isFinite(precio) || precio < 1) return res.status(400).json({ error: 'Precio inválido' })

  const [inicio, fin] = String(horario ?? '18:00-19:00').split(/\s*[-–]\s*/)
  const marca = Date.now()
  const bolsaId = `b-${marca}`

  const creada = db.transaction(() => {
    db.prepare(
      `INSERT INTO bolsas (id, vendedorId, titulo, descripcion, categoria, precioViejo, precioNuevo,
                           recojoInicio, recojoFin, disponibles, imagen, kgComida, kgCO2)
       VALUES (@id, 'v-mio', @titulo, @descripcion, @categoria, @precioViejo, @precioNuevo,
               @recojoInicio, @recojoFin, @disponibles, @imagen, @kgComida, @kgCO2)`,
    ).run({
      id: bolsaId,
      titulo: plantilla.titulo,
      descripcion: plantilla.descripcion,
      categoria,
      precioViejo: Math.round(precio * 2.6),
      precioNuevo: precio,
      recojoInicio: inicio ?? '18:00',
      recojoFin: fin ?? '19:00',
      disponibles: cantidad,
      imagen: plantilla.imagen,
      kgComida: plantilla.kgComida,
      kgCO2: plantilla.kgCO2,
    })

    const pub = {
      id: `p${marca}`,
      bolsaId,
      categoria,
      cantidad,
      precio,
      horario: `${inicio}-${fin ?? ''}`.replace(/-$/, ''),
      vendidas: 0,
    }
    db.prepare(
      `INSERT INTO publicaciones (id, bolsaId, categoria, cantidad, precio, horario, vendidas)
       VALUES (@id, @bolsaId, @categoria, @cantidad, @precio, @horario, @vendidas)`,
    ).run(pub)
    return pub
  })()

  res.status(201).json({ ...creada, estado: 'activa' })
})

// --------------------------------------------------------------- deliveries

app.post('/api/deliveries', (req, res) => {
  const { reservaId } = req.body ?? {}
  const existe = db.prepare('SELECT 1 FROM reservas WHERE id = ?').get(reservaId)
  if (!existe) return res.status(404).json({ error: 'Reserva no encontrada' })

  const LIMITE_ENTREGADO = 75_000
  const enCurso = db
    .prepare('SELECT * FROM deliveries WHERE reservaId = ? ORDER BY creadoEn DESC LIMIT 1')
    .get(reservaId) as { id: string; creadoEn: number } | undefined

  if (enCurso && Date.now() - enCurso.creadoEn < LIMITE_ENTREGADO) return res.json(enCurso)

  const nuevo = { id: `d-${reservaId}-${Date.now()}`, reservaId, costoDelivery: 8, creadoEn: Date.now() }
  db.transaction(() => {
    db.prepare('DELETE FROM deliveries WHERE reservaId = ?').run(reservaId)
    db.prepare(
      `INSERT INTO deliveries (id, reservaId, costoDelivery, creadoEn)
       VALUES (@id, @reservaId, @costoDelivery, @creadoEn)`,
    ).run(nuevo)
  })()

  res.status(201).json(nuevo)
})

app.get('/api/deliveries/:id', (req, res) => {
  const d = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)
  if (!d) return res.status(404).json({ error: 'Delivery no encontrado' })
  res.json(d)
})

// ------------------------------------------------------------------ usuario

app.get('/api/usuario', (_req, res) => {
  res.json(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(USUARIO_ACTUAL))
})

/** Vuelve a dejar la base como recién instalada. Útil entre demos. */
app.post('/api/reiniciar', (_req, res) => {
  db.transaction(() => {
    db.exec('DELETE FROM deliveries; DELETE FROM reservas; DELETE FROM publicaciones; DELETE FROM bolsas; DELETE FROM vendedores; DELETE FROM usuarios;')
  })()
  sembrar()
  res.json({ ok: true })
})

app.get('/api/salud', (_req, res) => {
  const n = db.prepare('SELECT COUNT(*) AS n FROM bolsas').get() as { n: number }
  res.json({ ok: true, bolsas: n.n })
})

const PUERTO = Number(process.env.PORT ?? 3001)
app.listen(PUERTO, () => {
  console.log(`API de Caserita escuchando en http://localhost:${PUERTO}`)
})
