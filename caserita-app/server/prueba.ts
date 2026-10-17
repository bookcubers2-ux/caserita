export {}
/**
 * Prueba de punta a punta de la API, en memoria y sin Telegram:
 * reservar → subir comprobante → (aceptación automática sin bot) → la casera
 * ve el pedido → lo entrega → el vecino califica → el rating cambia.
 * Correr con: npm run test:api
 */
process.env.CASERITA_PGLITE = 'memory'
delete process.env.DATABASE_URL
delete process.env.TELEGRAM_BOT_TOKEN
delete process.env.TELEGRAM_CHAT_ID

const { manejar } = await import('./app.ts')

const CLIENTE = 'prueba-cliente-0001'
let fallos = 0

function espera(cond: boolean, msg: string) {
  if (cond) console.log('  ok  ', msg)
  else {
    fallos++
    console.log('  FALLA', msg)
  }
}

async function api(metodo: string, ruta: string, cuerpo?: unknown, cab: Record<string, string> = {}) {
  const [path, qs] = ruta.split('?')
  const r = await manejar({
    metodo,
    ruta: path,
    query: new URLSearchParams(qs ?? ''),
    cabecera: (n) => cab[n.toLowerCase()],
    cuerpo,
  })
  return r
}

const cliente = { 'x-cliente-id': CLIENTE }

console.log('1. catálogo')
const salud = await api('GET', '/salud')
espera(salud.status === 200 && (salud.cuerpo as { ok: boolean }).ok, 'salud responde')
const bolsas = (await api('GET', '/bolsas')).cuerpo as { id: string; vendedorId: string; disponibles: number; vendedor: { rating: number; opiniones: number } }[]
espera(bolsas.length >= 9, `hay ${bolsas.length} bolsas sembradas`)
const b7 = bolsas.find((b) => b.id === 'b7')!
espera(b7.vendedorId === 'v7', 'la salchipapa es del carrito de Don Grover')

console.log('2. la casera entra con su PIN')
const malPin = await api('POST', '/vendedor/entrar', { pin: '0000' })
espera(malPin.status === 401, 'PIN equivocado rechazado')
const entrada = await api('POST', '/vendedor/entrar', { pin: '4207' })
espera(entrada.status === 200, 'PIN 4207 entra')
const token = (entrada.cuerpo as { token: string }).token
const vend = { 'x-vendedor-token': token }
const sinToken = await api('GET', '/vendedor/pedidos')
espera(sinToken.status === 401, 'sin token no se ven pedidos')

console.log('3. el vecino reserva con QR')
const sinCliente = await api('POST', '/reservas', { bolsaId: 'b7', metodoPago: 'qr' })
espera(sinCliente.status === 400, 'sin identificación no reserva')
const res = await api('POST', '/reservas', { bolsaId: 'b7', metodoPago: 'qr', nombre: 'Camila Áñez', telefono: '70012345' }, cliente)
espera(res.status === 201, 'reserva creada')
const reserva = res.cuerpo as { id: string; codigo: string; estadoPago: string; estado: string; total: number }
espera(reserva.estadoPago === 'pendiente' && reserva.estado === 'activa', 'queda activa y con pago pendiente')
const b7b = (await api('GET', '/bolsas/b7')).cuerpo as { disponibles: number }
espera(b7b.disponibles === b7.disponibles - 1, 'el stock bajó en 1')

console.log('4. sube el comprobante')
const png1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
const chico = await api('POST', `/reservas/${reserva.id}/comprobante`, { imagen: `data:image/png;base64,${png1x1}` }, cliente)
espera(chico.status === 400, 'una imagen vacía se rechaza')
const relleno = Buffer.alloc(5000, 1).toString('base64')
const sub = await api('POST', `/reservas/${reserva.id}/comprobante`, { imagen: `data:image/jpeg;base64,${relleno}` }, cliente)
espera(sub.status === 200, 'comprobante aceptado por la API')
const tras = sub.cuerpo as { estadoPago: string; referenciaPago?: string }
espera(tras.estadoPago === 'pagado' && tras.referenciaPago === 'LOCAL', 'sin bot, el pago se acepta solo (modo local)')

console.log('5. la casera lo ve y lo entrega')
const pedidos = (await api('GET', '/vendedor/pedidos', undefined, vend)).cuerpo as { id: string; cliente: { nombre: string }; estado: string }[]
const mio = pedidos.find((p) => p.id === reserva.id)
espera(Boolean(mio), 'el pedido aparece en el panel del carrito')
espera(mio?.cliente.nombre === 'Camila Áñez', 'con el nombre del cliente')
const otraCasera = (await api('POST', '/vendedor/entrar', { pin: '4242' })).cuerpo as { token: string }
const ajeno = await api('PATCH', `/vendedor/pedidos/${reserva.id}/entregar`, undefined, { 'x-vendedor-token': otraCasera.token })
espera(ajeno.status === 404, 'otra casera no puede entregar este pedido')
const antes = await api('POST', `/reservas/${reserva.id}/calificar`, { estrellas: 5 }, cliente)
espera(antes.status === 409, 'no se puede calificar antes de recoger')
const ent = await api('PATCH', `/vendedor/pedidos/${reserva.id}/entregar`, undefined, vend)
espera(ent.status === 200 && (ent.cuerpo as { estado: string }).estado === 'entregada', 'entregado')

console.log('6. el vecino califica')
const cal = await api('POST', `/reservas/${reserva.id}/calificar`, { estrellas: 4, comentario: 'Rica y calientita, gracias casera' }, cliente)
espera(cal.status === 200, 'calificación guardada')
const b7c = (await api('GET', '/bolsas/b7')).cuerpo as { vendedor: { rating: number; opiniones: number } }
espera(b7c.vendedor.rating === 4 && b7c.vendedor.opiniones === 1, `rating ahora ${b7c.vendedor.rating} con ${b7c.vendedor.opiniones} opinión`)
const ops = (await api('GET', '/vendedores/v7/opiniones')).cuerpo as { comentario: string; nombre: string }[]
espera(ops.length === 1 && ops[0].nombre === 'Camila', 'la opinión se lista con el primer nombre')
const usuario = (await api('GET', '/usuario', undefined, cliente)).cuerpo as { comidasRescatadas: number; bsAhorrados: number }
espera(usuario.comidasRescatadas === 1 && usuario.bsAhorrados === 8, `impacto: ${usuario.comidasRescatadas} comida, Bs ${usuario.bsAhorrados} ahorrados`)

console.log('7. efectivo y cancelación')
const ef = (await api('POST', '/reservas', { bolsaId: 'b1', metodoPago: 'efectivo' }, cliente)).cuerpo as { id: string }
const can = await api('DELETE', `/reservas/${ef.id}`, undefined, cliente)
espera(can.status === 204, 'reserva en efectivo cancelada')
const b1 = (await api('GET', '/bolsas/b1')).cuerpo as { disponibles: number }
espera(b1.disponibles === 4, 'el stock volvió')

console.log('8. la casera publica')
const pub = await api('POST', '/publicaciones', { categoria: 'Cena', cantidad: 3, precio: 7, horario: '20:00-21:00', titulo: 'Salchipapa de cierre', descripcion: 'Las últimas tres' }, vend)
espera(pub.status === 201, 'publicación creada')
const pubs = (await api('GET', '/publicaciones', undefined, vend)).cuerpo as { titulo: string }[]
espera(pubs.some((p) => p.titulo === 'Salchipapa de cierre'), 'aparece en su lista')

console.log('9. webhook de Telegram con acción ok')
const res2 = (await api('POST', '/reservas', { bolsaId: 'b2', metodoPago: 'qr' }, cliente)).cuerpo as { id: string }
const wh = await api('POST', '/telegram/webhook', { callback_query: { id: 'x', data: `no_${res2.id}`, message: { message_id: 1, chat: { id: 1 } } } })
espera(wh.status === 200, 'webhook responde')
const r2 = (await api('GET', `/reservas/${res2.id}`, undefined, cliente)).cuerpo as { estadoPago: string }
espera(r2.estadoPago === 'rechazado', 'el rechazo desde Telegram se refleja')

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLAS`)
process.exit(fallos === 0 ? 0 : 1)
