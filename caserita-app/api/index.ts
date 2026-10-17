import type { VercelRequest, VercelResponse } from '@vercel/node'
import { manejar } from '../server/app'

/**
 * Única función de Vercel: recibe todo /api/* (ver vercel.json) y se lo pasa
 * al router de server/app.ts. El cuerpo JSON ya viene parseado por Vercel.
 */
export const config = { maxDuration: 20 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? '/', 'http://caserita')
  const ruta = url.pathname.replace(/^\/api/, '') || '/'
  const r = await manejar({
    metodo: req.method ?? 'GET',
    ruta,
    query: url.searchParams,
    cabecera: (n) => {
      const v = req.headers[n.toLowerCase()]
      return Array.isArray(v) ? v[0] : v
    },
    cuerpo: req.body,
  })
  res.setHeader('Cache-Control', 'no-store')
  if (r.status === 204) return res.status(204).end()
  return res.status(r.status).json(r.cuerpo)
}
