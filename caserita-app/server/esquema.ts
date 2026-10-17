import type { Fila } from './db'
import { BOLSAS, VENDEDORES } from '../src/data/seed'

type Consulta = (sql: string, params?: unknown[]) => Promise<Fila[]>

/**
 * PIN de cada puesto para entrar al panel de la casera. Son fijos para que
 * Carlos pueda imprimirlos en el cartel de cada puesto; se pueden cambiar en
 * la tabla vendedores sin tocar código.
 */
export const PIN_POR_VENDEDOR: Record<string, string> = {
  v1: '1101',
  v2: '4201', // Pensión Doña Mari · La Ramada
  v3: '1103',
  v4: '1104',
  v5: '1105',
  v6: '4242', // Puesto 42 · La Ramada
  v7: '4207', // Carrito de Don Grover · La Ramada
  v8: '1108',
  v9: '1109',
}

export async function prepararEsquema(run: Consulta): Promise<void> {
  await run(`
    CREATE TABLE IF NOT EXISTS vendedores (
      id           TEXT PRIMARY KEY,
      nombre       TEXT NOT NULL,
      tipo         TEXT NOT NULL,
      direccion    TEXT NOT NULL,
      rating_base  REAL NOT NULL DEFAULT 4.5,
      lat          DOUBLE PRECISION NOT NULL,
      lng          DOUBLE PRECISION NOT NULL,
      pin          TEXT NOT NULL,
      telefono     TEXT,
      creado_en    BIGINT NOT NULL
    )`)
  await run(`
    CREATE TABLE IF NOT EXISTS bolsas (
      id            TEXT PRIMARY KEY,
      vendedor_id   TEXT NOT NULL REFERENCES vendedores(id),
      titulo        TEXT NOT NULL,
      descripcion   TEXT NOT NULL,
      categoria     TEXT NOT NULL,
      precio_viejo  INTEGER NOT NULL,
      precio_nuevo  INTEGER NOT NULL,
      recojo_inicio TEXT NOT NULL,
      recojo_fin    TEXT NOT NULL,
      cantidad      INTEGER NOT NULL,
      disponibles   INTEGER NOT NULL CHECK (disponibles >= 0),
      imagen        TEXT NOT NULL,
      kg_comida     REAL NOT NULL,
      kg_co2        REAL NOT NULL,
      sorpresa      BOOLEAN NOT NULL DEFAULT FALSE,
      creada_en     BIGINT NOT NULL
    )`)
  await run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id        TEXT PRIMARY KEY,
      nombre    TEXT NOT NULL DEFAULT '',
      telefono  TEXT NOT NULL DEFAULT '',
      creado_en BIGINT NOT NULL
    )`)
  await run(`
    CREATE TABLE IF NOT EXISTS reservas (
      id                  TEXT PRIMARY KEY,
      bolsa_id            TEXT NOT NULL REFERENCES bolsas(id),
      vendedor_id         TEXT NOT NULL REFERENCES vendedores(id),
      cliente_id          TEXT NOT NULL REFERENCES clientes(id),
      codigo              TEXT NOT NULL,
      estado              TEXT NOT NULL DEFAULT 'activa',
      total               INTEGER NOT NULL,
      metodo_pago         TEXT NOT NULL,
      estado_pago         TEXT NOT NULL DEFAULT 'pendiente',
      referencia_pago     TEXT,
      comprobante_file_id TEXT,
      tg_message_id       BIGINT,
      nota                TEXT,
      creada_en           BIGINT NOT NULL,
      actualizada_en      BIGINT NOT NULL,
      entregada_en        BIGINT
    )`)
  await run(`
    CREATE TABLE IF NOT EXISTS calificaciones (
      id          TEXT PRIMARY KEY,
      reserva_id  TEXT NOT NULL UNIQUE REFERENCES reservas(id),
      vendedor_id TEXT NOT NULL REFERENCES vendedores(id),
      cliente_id  TEXT NOT NULL REFERENCES clientes(id),
      estrellas   INTEGER NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
      comentario  TEXT NOT NULL DEFAULT '',
      creada_en   BIGINT NOT NULL
    )`)
  await run(`CREATE INDEX IF NOT EXISTS idx_reservas_cliente ON reservas(cliente_id)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_reservas_vendedor ON reservas(vendedor_id)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_bolsas_vendedor ON bolsas(vendedor_id)`)
  await sembrar(run)
}

/** Carga el catálogo inicial solo si la base está vacía. */
async function sembrar(run: Consulta): Promise<void> {
  const [{ n }] = (await run('SELECT COUNT(*)::int AS n FROM vendedores')) as { n: number }[]
  if (Number(n) > 0) return
  const ahora = Date.now()
  for (const v of VENDEDORES) {
    await run(
      `INSERT INTO vendedores (id, nombre, tipo, direccion, rating_base, lat, lng, pin, creado_en)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [v.id, v.nombre, v.tipo, v.direccion, v.rating, v.lat, v.lng, PIN_POR_VENDEDOR[v.id] ?? '0000', ahora],
    )
  }
  for (const b of BOLSAS) {
    await run(
      `INSERT INTO bolsas (id, vendedor_id, titulo, descripcion, categoria, precio_viejo, precio_nuevo,
                           recojo_inicio, recojo_fin, cantidad, disponibles, imagen, kg_comida, kg_co2, sorpresa, creada_en)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        b.id, b.vendedorId, b.titulo, b.descripcion, b.categoria, b.precioViejo, b.precioNuevo,
        b.recojoInicio, b.recojoFin, b.disponibles, b.disponibles, b.imagen, b.kgComida, b.kgCO2,
        Boolean(b.sorpresa), ahora,
      ],
    )
  }
}
