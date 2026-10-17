import { useCallback, useEffect } from 'react'
import { Banknote, Check, Loader, PackageCheck, Phone, QrCode, Star } from 'lucide-react'
import type { ReservaConBolsa } from '../types'
import { useSondeo, useStore } from '../store'
import { useTitulo } from '../lib/useTitulo'
import EntrarPuesto from '../components/EntrarPuesto'
import Foto from '../components/Foto'
import { BackButton, Button, LinkButton } from '../components/ui'

const PAGO: Record<string, { texto: string; clase: string }> = {
  pendiente: { texto: 'Cobra en efectivo', clase: 'bg-ambar-soft text-ambar-ink' },
  verificando: { texto: 'Pago en revisión', clase: 'bg-ambar-soft text-ambar-ink' },
  pagado: { texto: 'Ya pagó', clase: 'bg-brand-soft text-brand-dark' },
  rechazado: { texto: 'Cobra en efectivo', clase: 'bg-card text-destructive ring-1 ring-border' },
}

function Pedido({ r, onEntregar }: { r: ReservaConBolsa; onEntregar: (r: ReservaConBolsa) => Promise<void> }) {
  const activa = r.estado === 'activa'
  const pago = PAGO[r.estadoPago] ?? PAGO.pendiente
  const tel = r.cliente?.telefono?.replace(/\D/g, '')
  return (
    <div className={`rounded-2xl border bg-card p-4 shadow-card ${activa ? 'border-brand/40' : 'border-border opacity-80'}`}>
      <div className="flex items-start gap-3">
        {r.bolsa && <Foto src={r.bolsa.imagen} alt="" className="size-14 shrink-0 rounded-xl object-cover" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-2xl font-extrabold tracking-widest text-brand-dark">{r.codigo}</p>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${pago.clase}`}>
              {r.estadoPago === 'verificando' && <Loader className="mr-1 inline size-3 animate-spin" aria-hidden />}
              {r.estadoPago === 'pagado' && <Check className="mr-1 inline size-3" aria-hidden />}
              {pago.texto}
            </span>
          </div>
          <p className="truncate text-sm font-bold text-ink">{r.bolsa?.titulo}</p>
          <p className="text-xs text-muted-foreground">
            {r.fecha} · Bs {r.total} · {r.metodoPago === 'qr' ? <QrCode className="inline size-3.5" aria-hidden /> : <Banknote className="inline size-3.5" aria-hidden />}{' '}
            {r.metodoPago === 'qr' ? 'QR' : 'efectivo'}
          </p>
          <p className="mt-1 text-sm text-ink">
            <b>{r.cliente?.nombre || 'Vecino sin nombre'}</b>
            {tel && (
              <a href={`tel:${tel}`} className="ml-2 inline-flex items-center gap-1 text-brand underline underline-offset-2">
                <Phone className="size-3.5" aria-hidden /> {r.cliente?.telefono}
              </a>
            )}
          </p>
          {r.nota && <p className="mt-1 text-xs italic text-muted-foreground">“{r.nota}”</p>}
          {r.calificacion && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-ambar-ink">
              <Star className="size-3.5 fill-ambar text-ambar" aria-hidden /> {r.calificacion.estrellas}/5
              {r.calificacion.comentario && <span className="font-normal text-muted-foreground"> · {r.calificacion.comentario}</span>}
            </p>
          )}
        </div>
      </div>
      {activa && (
        <div className="mt-3">
          <Button full onClick={() => onEntregar(r)}>
            <PackageCheck className="size-5" aria-hidden /> Entregado
          </Button>
        </div>
      )}
      {!activa && (
        <p className="mt-2 text-xs font-bold text-brand-dark">
          <Check className="inline size-3.5" aria-hidden /> Entregado
        </p>
      )}
    </div>
  )
}

export default function VendedorPedidos() {
  const { sesion, pedidosVendedor, cargarPedidosVendedor, entregarPedido, mostrarToast } = useStore()

  useTitulo('Pedidos de mi puesto · Caserita', 'Lo que los vecinos reservaron en tu puesto y qué falta entregar.')

  const recargar = useCallback(() => cargarPedidosVendedor(), [cargarPedidosVendedor])
  useEffect(() => {
    recargar()
  }, [recargar])
  // Mientras el panel está abierto, cada 8 s llegan los pedidos nuevos.
  useSondeo(Boolean(sesion), 8000, recargar)

  if (!sesion) {
    return (
      <div className="animate-rise pagina space-y-5 px-4 pb-10 pt-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <BackButton to="/" />
          <h1 className="text-xl font-extrabold text-ink lg:text-3xl">Pedidos de mi puesto</h1>
        </div>
        <EntrarPuesto />
      </div>
    )
  }

  const activos = pedidosVendedor.filter((r) => r.estado === 'activa')
  const cerrados = pedidosVendedor.filter((r) => r.estado !== 'activa')
  const entregar = async (r: ReservaConBolsa) => {
    await entregarPedido(r.id)
    mostrarToast(`Entregado · ${r.codigo}${r.metodoPago === 'efectivo' ? ' · cobraste Bs ' + r.total : ''}`)
  }

  return (
    <div className="animate-rise pagina space-y-5 px-4 pb-10 pt-5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <BackButton to="/vendedor" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold text-ink lg:text-3xl">Pedidos de hoy</h1>
          <p className="truncate text-sm text-muted-foreground">{sesion.vendedor.nombre}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-brand-soft p-4 text-center lg:max-w-md">
        <div>
          <p className="text-lg font-extrabold text-brand-dark">{activos.length}</p>
          <p className="text-xs text-brand-dark">por entregar</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-brand-dark">
            Bs {cerrados.filter((r) => r.fecha === 'Hoy').reduce((s, r) => s + r.total, 0)}
          </p>
          <p className="text-xs text-brand-dark">entregado hoy</p>
        </div>
      </div>

      {pedidosVendedor.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <p className="text-sm font-bold text-ink">Todavía no hay pedidos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando un vecino reserve algo tuyo, aparece aquí con su código. Esta pantalla se actualiza sola.
          </p>
        </div>
      )}

      {activos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink">Por entregar</h2>
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {activos.map((r) => (
              <Pedido key={r.id} r={r} onEntregar={entregar} />
            ))}
          </div>
        </section>
      )}

      {cerrados.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink">Entregados</h2>
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {cerrados.map((r) => (
              <Pedido key={r.id} r={r} onEntregar={entregar} />
            ))}
          </div>
        </section>
      )}

      <div className="lg:max-w-xs">
        <LinkButton to="/vendedor" variant="brand">
          Publicar lo que me sobró
        </LinkButton>
      </div>
    </div>
  )
}
