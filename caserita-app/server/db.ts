/**
 * Capa de datos de Caserita.
 *
 * En producción (Vercel) habla con Postgres en Neon usando DATABASE_URL.
 * En desarrollo y en las pruebas, si no hay DATABASE_URL, usa PGlite: un
 * Postgres completo que corre dentro de Node y guarda en ./.data/caserita.
 * Las dos rutas aceptan el mismo SQL con parámetros $1, $2...
 */

export interface Fila {
  [columna: string]: unknown
}

type Consulta = (sql: string, params?: unknown[]) => Promise<Fila[]>

let consulta: Consulta | null = null
let listo: Promise<void> | null = null

async function crearConsulta(): Promise<Consulta> {
  const url = process.env.DATABASE_URL
  if (url) {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(url)
    return async (texto, params = []) => (await sql.query(texto, params)) as Fila[]
  }
  const { PGlite } = await import('@electric-sql/pglite')
  // En Vercel el disco es de solo lectura: sin DATABASE_URL se usa memoria (solo para probar).
  const ruta = process.env.CASERITA_PGLITE ?? (process.env.VERCEL ? 'memory' : './.data/caserita')
  const pg = ruta === 'memory' ? new PGlite() : new PGlite(ruta)
  return async (texto, params = []) => (await pg.query(texto, params)).rows as Fila[]
}

/** Ejecuta una consulta. La primera vez prepara la conexión y el esquema. */
export async function q<T extends Fila = Fila>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!consulta) consulta = await crearConsulta()
  if (!listo) {
    const { prepararEsquema } = await import('./esquema')
    listo = prepararEsquema(consulta)
  }
  await listo
  return (await consulta(sql, params)) as T[]
}

export async function uno<T extends Fila = Fila>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const filas = await q<T>(sql, params)
  return filas[0]
}
