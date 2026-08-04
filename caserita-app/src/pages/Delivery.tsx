import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Truck } from 'lucide-react'
import type { Delivery as TDelivery, PasoDelivery } from '../types'
import { calcularEta, calcularPaso, useStore } from '../store'
import { getDelivery } from '../services/api'
import { useTitulo } from '../lib/useTitulo'
import MapaReal from '../components/MapaReal'
import { BackButton, Button, Skeleton } from '../components/ui'
import NoEncontrado from './NoEncontrado'

const PASOS: { id: PasoDelivery; label: string }[] = [
  { id: 'preparando', label: 'Preparando' },
  { id: 'en_camino', label: 'En camino' },
  { id: 'entregado', label: 'Entregado' },
]

function Tracker({ paso }: { paso: PasoDelivery }) {
  const actual = PASOS.findIndex((p) => p.id === paso)
  return (
    <ol className="flex items-start gap-2">
      {PASOS.map((p, n) => {
        const hecho = n <= actual
        return (
          <li key={p.id} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <span
                className={`h-1 flex-1 rounded-full ${
                  n === 0 ? 'bg-transparent' : hecho ? 'bg-brand' : 'bg-border'
                }`}
              />
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
                  hecho
                    ? 'bg-brand text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground'
                }`}
              >
                {hecho ? <Check className="size-4" aria-hidden /> : n + 1}
              </span>
              <span
                className={`h-1 flex-1 rounded-full ${
                  n === PASOS.length - 1 ? 'bg-transparent' : n < actual ? 'bg-brand' : 'bg-border'
                }`}
              />
            </div>
            <span
              className={`text-xs font-semibold ${hecho ? 'text-ink' : 'text-muted-foreground'}`}
            >
              {p.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function Linea({ label, valor, fuerte }: { label: string; valor: string; fuerte?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-sm ${fuerte ? 'font-bold text-ink' : 'text-muted-foreground'}`}>
        {label}
      </span>
      <span className={`text-sm ${fuerte ? 'font-extrabold text-brand' : 'font-bold text-ink'}`}>
        {valor}
      </span>
    </div>
  )
}

export default function DeliveryPage() {
  const { id } = useParams()
  const { reservaPorId, bolsas, mostrarToast } = useStore()
  const [activo, setActivo] = useState(true)
  const [, refrescar] = useState(0)
  const [delivery, setDelivery] = useState<TDelivery | null>(null)
  const [buscando, setBuscando] = useState(true)

  // El delivery vive en el servidor: se consulta por su id.
  useEffect(() => {
    if (!id) return
    let vivo = true
    setBuscando(true)
    getDelivery(id)
      .then((d) => vivo && setDelivery(d))
      .catch(() => vivo && setDelivery(null))
      .finally(() => vivo && setBuscando(false))
    return () => {
      vivo = false
    }
  }, [id])

  const reserva = delivery ? reservaPorId(delivery.reservaId) : undefined

  useTitulo(
    delivery ? 'Seguimiento de delivery · Caserita' : 'Página no encontrada · Caserita',
    delivery ? 'Sigue tu pedido en el mapa: preparando, en camino y entregado.' : undefined,
  )

  // El seguimiento avanza solo con el tiempo transcurrido, y el reloj se
  // apaga al entregar: no tiene sentido re-renderizar el mapa cada segundo
  // cuando ya no queda nada por actualizar.
  useEffect(() => {
    if (!delivery || calcularPaso(delivery.creadoEn) === 'entregado') return
    const t = window.setInterval(() => {
      refrescar((n) => n + 1)
      if (calcularPaso(delivery.creadoEn) === 'entregado') window.clearInterval(t)
    }, 1000)
    return () => window.clearInterval(t)
  }, [delivery])

  if (buscando) {
    return (
      <div className="pagina space-y-4 px-4 py-8">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    )
  }

  if (!delivery) return <NoEncontrado />

  const paso = calcularPaso(delivery.creadoEn)
  const eta = calcularEta(delivery.creadoEn)
  const entregado = paso === 'entregado'
  const bolsaDelPedido = reserva?.bolsa ?? bolsas[0]
  const bolsasMapa = bolsaDelPedido ? [bolsaDelPedido] : []
  const producto = reserva?.total ?? bolsaDelPedido?.precioNuevo ?? 0

  return (
    <div className="animate-rise pagina space-y-4 px-4 pb-10 pt-5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <BackButton to="/pedidos" />
        <h1 className="min-w-0 truncate text-xl font-extrabold text-ink lg:text-3xl">
          Tu delivery
        </h1>
        <button
          type="button"
          role="switch"
          aria-checked={activo}
          aria-label="Ver la ruta en el mapa"
          onClick={() => {
            setActivo((v) => !v)
            mostrarToast(activo ? 'Ruta oculta' : 'Ruta visible en el mapa')
          }}
          className={`tap flex w-14 items-center rounded-full p-1 transition-colors ${
            activo ? 'bg-brand' : 'bg-border'
          }`}
        >
          <span
            className={`size-6 rounded-full bg-background shadow-card transition-transform ${
              activo ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8 lg:space-y-0">
        {bolsasMapa.length > 0 ? (
          <MapaReal
            bolsas={bolsasMapa}
            seleccionadaId={bolsasMapa[0].id}
            ruta={activo}
            className="h-64 lg:h-[520px]"
            onAviso={mostrarToast}
          />
        ) : (
          <Skeleton className="h-64 rounded-3xl lg:h-[520px]" />
        )}

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <Tracker paso={paso} />
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4">
            <Truck className="size-6 shrink-0 text-brand-dark" aria-hidden />
            <div>
              <p className="text-sm font-extrabold text-brand-dark">
                {entregado ? '¡Entregado!' : `Llega en ${eta} min`}
              </p>
              <p className="text-xs text-brand-dark">
                {entregado
                  ? `Recibiste tu bolsa de ${bolsaDelPedido?.vendedor.nombre ?? 'tu casero'}`
                  : paso === 'preparando'
                    ? 'Tu casero está preparando la bolsa'
                    : 'Tu casero ya salió del negocio'}
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card">
            {bolsaDelPedido && (
              <Linea label="Negocio" valor={bolsaDelPedido.vendedor.nombre} />
            )}
            <Linea label="Producto" valor={`Bs ${producto}`} />
            <Linea label="Delivery" valor={`Bs ${delivery.costoDelivery}`} />
            <div className="border-t border-border pt-2">
              <Linea label="Total" valor={`Bs ${producto + delivery.costoDelivery}`} fuerte />
            </div>
          </div>

          <Button
            full
            onClick={() =>
              mostrarToast(entregado ? 'Pedido entregado' : 'Siguiendo el pedido en el mapa')
            }
          >
            {entregado ? 'Pedido completado' : 'Seguir en el mapa'}
          </Button>
        </div>
      </div>
    </div>
  )
}
