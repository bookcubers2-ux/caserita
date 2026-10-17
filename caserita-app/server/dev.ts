/**
 * Servidor local de la API (sin Vercel): `npm run api` y queda en :3001.
 * La app en modo dev lo usa cuando se arranca con VITE_API_URL=http://localhost:3001.
 */
import { createServer } from 'node:http'
import { manejar } from './app'

const PUERTO = Number(process.env.PORT ?? 3001)

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PUERTO}`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Cliente-Id, X-Vendedor-Token, X-Caserita-Clave')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') return res.writeHead(204).end()
  if (!url.pathname.startsWith('/api')) return res.writeHead(404).end('solo /api')

  const trozos: Buffer[] = []
  for await (const t of req) trozos.push(t as Buffer)
  const crudo = Buffer.concat(trozos).toString('utf8')
  let cuerpo: unknown = undefined
  if (crudo) {
    try {
      cuerpo = JSON.parse(crudo)
    } catch {
      cuerpo = crudo
    }
  }

  const r = await manejar({
    metodo: req.method ?? 'GET',
    ruta: url.pathname.replace(/^\/api/, '') || '/',
    query: url.searchParams,
    cabecera: (n) => {
      const v = req.headers[n.toLowerCase()]
      return Array.isArray(v) ? v[0] : v
    },
    cuerpo,
  })
  if (r.status === 204) return res.writeHead(204).end()
  res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(r.cuerpo))
}).listen(PUERTO, () => console.log(`API de Caserita en http://localhost:${PUERTO}/api/salud`))
