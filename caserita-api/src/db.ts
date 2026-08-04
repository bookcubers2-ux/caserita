import Database from 'better-sqlite3'
import { BOLSAS, PUBLICACIONES, RESERVAS_SEED, USUARIO, VENDEDORES } from './semilla.js'

/**
 * Base de datos de Caserita (SQLite).
 * Es un archivo en disco: el estado deja de vivir en cada navegador y pasa a
 * ser compartido, que es la diferencia entre una maqueta y un servicio.
 */
export const db = new Database(process.env.CASERITA_DB ?? 'caserita.db')

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS vendedores (
    id        TEXT PRIMARY KEY,
    nombre    TEXT NOT NULL,
    tipo      TEXT NOT NULL,
    direccion TEXT NOT NULL,
    rating    REAL NOT NULL,
    lat       REAL NOT NULL,
    lng       REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bolsas (
    id           TEXT PRIMARY KEY,
    vendedorId   TEXT NOT NULL REFERENCES vendedores(id),
    titulo       TEXT NOT NULL,
    descripcion  TEXT NOT NULL,
    categoria    TEXT NOT NULL,
    precioViejo  INTEGER NOT NULL,
    precioNuevo  INTEGER NOT NULL,
    recojoInicio TEXT NOT NULL,
    recojoFin    TEXT NOT NULL,
    disponibles  INTEGER NOT NULL CHECK (disponibles >= 0),
    imagen       TEXT NOT NULL,
    kgComida     REAL NOT NULL,
    kgCO2        REAL NOT NULL,
    creadaEn     INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS reservas (
    id             TEXT PRIMARY KEY,
    bolsaId        TEXT NOT NULL REFERENCES bolsas(id),
    usuarioId      TEXT NOT NULL,
    codigo         TEXT NOT NULL,
    estado         TEXT NOT NULL DEFAULT 'activa',
    fecha          TEXT NOT NULL,
    total          INTEGER NOT NULL,
    metodoPago     TEXT NOT NULL,
    estadoPago     TEXT NOT NULL DEFAULT 'pendiente',
    referenciaPago TEXT,
    creadaEn       INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS publicaciones (
    id        TEXT PRIMARY KEY,
    bolsaId   TEXT REFERENCES bolsas(id),
    categoria TEXT NOT NULL,
    cantidad  INTEGER NOT NULL,
    precio    INTEGER NOT NULL,
    horario   TEXT NOT NULL,
    vendidas  INTEGER NOT NULL DEFAULT 0,
    creadaEn  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id            TEXT PRIMARY KEY,
    reservaId     TEXT NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    costoDelivery INTEGER NOT NULL DEFAULT 8,
    creadoEn      INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id                TEXT PRIMARY KEY,
    nombre            TEXT NOT NULL,
    ciudad            TEXT NOT NULL,
    telefono          TEXT NOT NULL,
    comidasRescatadas INTEGER NOT NULL DEFAULT 0,
    comidasEsteMes    INTEGER NOT NULL DEFAULT 0,
    kgCO2Evitado      REAL NOT NULL DEFAULT 0,
    bsAhorrados       INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(usuarioId);
  CREATE INDEX IF NOT EXISTS idx_bolsas_vendedor  ON bolsas(vendedorId);
`)

/** Carga los datos iniciales solo la primera vez. */
export function sembrar(): void {
  const yaHay = db.prepare('SELECT COUNT(*) AS n FROM bolsas').get() as { n: number }
  if (yaHay.n > 0) return

  const insVendedor = db.prepare(
    `INSERT INTO vendedores (id, nombre, tipo, direccion, rating, lat, lng)
     VALUES (@id, @nombre, @tipo, @direccion, @rating, @lat, @lng)`,
  )
  const insBolsa = db.prepare(
    `INSERT INTO bolsas (id, vendedorId, titulo, descripcion, categoria, precioViejo,
                         precioNuevo, recojoInicio, recojoFin, disponibles, imagen, kgComida, kgCO2)
     VALUES (@id, @vendedorId, @titulo, @descripcion, @categoria, @precioViejo,
             @precioNuevo, @recojoInicio, @recojoFin, @disponibles, @imagen, @kgComida, @kgCO2)`,
  )
  const insReserva = db.prepare(
    `INSERT INTO reservas (id, bolsaId, usuarioId, codigo, estado, fecha, total, metodoPago, estadoPago)
     VALUES (@id, @bolsaId, @usuarioId, @codigo, @estado, @fecha, @total, @metodoPago, @estadoPago)`,
  )
  const insPublicacion = db.prepare(
    `INSERT INTO publicaciones (id, bolsaId, categoria, cantidad, precio, horario, vendidas)
     VALUES (@id, @bolsaId, @categoria, @cantidad, @precio, @horario, @vendidas)`,
  )
  const insUsuario = db.prepare(
    `INSERT INTO usuarios (id, nombre, ciudad, telefono, comidasRescatadas, comidasEsteMes, kgCO2Evitado, bsAhorrados)
     VALUES (@id, @nombre, @ciudad, @telefono, @comidasRescatadas, @comidasEsteMes, @kgCO2Evitado, @bsAhorrados)`,
  )

  db.transaction(() => {
    VENDEDORES.forEach((v) => insVendedor.run(v))
    BOLSAS.forEach((b) => insBolsa.run(b))
    insUsuario.run(USUARIO)
    RESERVAS_SEED.forEach((r) => insReserva.run({ ...r, usuarioId: USUARIO.id }))
    PUBLICACIONES.forEach((p) => insPublicacion.run(p))
  })()

  console.log('Base de datos sembrada con el catálogo inicial.')
}
