import type { VercelRequest, VercelResponse } from '@vercel/node'
import { manejar } from '../server/app.js'

/**
 * Única función de Vercel: recibe todo /api/* (ver vercel.json) y se lo pasa
 * al router de server/app.ts. El cuerpo JSON ya viene parseado por Vercel.
 */
export const config = { maxDuration: 20 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await atender(req, res)
  } catch (e) {
    // Nunca dejar que la función muera sin decir por qué: el error llega como JSON.
    console.error('[api] fallo no controlado', e)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(500).json({ error: 'La API de Caserita falló al arrancar', detalle: e instanceof Error ? e.message.slice(0, 300) : String(e) })
  }
}

/**
 * El cuerpo se lee crudo y se decodifica como UTF-8 a mano: el parser de
 * Vercel estropeaba las tildes y las eñes ("Áñez" llegaba roto).
 */
async function leerCuerpo(req: VercelRequest): Promise<unknown> {
  try {
    const trozos: Buffer[] = []
    for await (const t of req) trozos.push(typeof t === 'string' ? Buffer.from(t) : (t as Buffer))
    if (trozos.length) {
      const texto = Buffer.concat(trozos).toString('utf8')
      try {
        return JSON.parse(texto)
      } catch {
        return texto
      }
    }
  } catch {
    // el stream ya fue consumido: caemos al body parseado por Vercel
  }
  const b = req.body
  if (typeof b === 'string') {
    try {
      return JSON.parse(b)
    } catch {
      return b
    }
  }
  if (Buffer.isBuffer(b)) {
    try {
      return JSON.parse(b.toString('utf8'))
    } catch {
      return b.toString('utf8')
    }
  }
  return b
}

async function atender(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? '/', 'http://caserita')
  if (url.pathname === '/api/eco') {
    // Diagnóstico de codificación: cómo llega el cuerpo a la función.
    const trozos: { tipo: string; hex: string }[] = []
    try {
      for await (const t of req) trozos.push({ tipo: typeof t, hex: Buffer.isBuffer(t) ? t.toString('hex').slice(0, 60) : Buffer.from(String(t)).toString('hex').slice(0, 60) })
    } catch (e) {
      trozos.push({ tipo: 'error', hex: String(e) })
    }
    const b = req.body
    const info = {
      trozos,
      bodyTipo: Buffer.isBuffer(b) ? 'buffer' : typeof b,
      bodyHex: Buffer.isBuffer(b) ? b.toString('hex').slice(0, 60) : typeof b === 'string' ? Buffer.from(b).toString('hex').slice(0, 60) : JSON.stringify(b)?.slice(0, 60),
      encabezado: req.headers['content-type'],
      node: process.version,
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(Buffer.from(JSON.stringify(info), 'utf8'))
  }
  const ruta = url.pathname.replace(/^\/api/, '') || '/'
  const r = await manejar({
    metodo: req.method ?? 'GET',
    ruta,
    query: url.searchParams,
    cabecera: (n) => {
      const v = req.headers[n.toLowerCase()]
      return Array.isArray(v) ? v[0] : v
    },
    cuerpo: await leerCuerpo(req),
  })
  res.setHeader('Cache-Control', 'no-store')
  if (r.status === 204) return res.status(204).end()
  // Respuesta escrita a mano en UTF-8 por la misma razón.
  res.statusCode = r.status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  return res.end(Buffer.from(JSON.stringify(r.cuerpo), 'utf8'))
}
