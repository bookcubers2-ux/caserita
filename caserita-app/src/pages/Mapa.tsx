import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, MapPin } from 'lucide-react'
import type { BolsaConVendedor } from '../types'
import { useStore } from '../store'
import { useTitulo } from '../lib/useTitulo'
import { useEsEscritorio } from '../lib/useMedia'
import { ventanaDeRecojo } from '../lib/horarios'
import MapaReal from '../components/MapaReal'
import Foto from '../components/Foto'
import { Rating, Skeleton } from '../components/ui'

/** Fila de la lista lateral de escritorio. */
function FilaLista({
  bolsa,
  activa,
  onElegir,
}: {
  bolsa: BolsaConVendedor
  activa: boolean
  onElegir: () => void
}) {
  return (
    <button
      type="button"
      onClick={onElegir}
      aria-pressed={activa}
      className={`tap flex w-full gap-3 rounded-2xl border p-2.5 text-left transition-colors ${
        activa ? 'border-brand bg-brand-soft' : 'border-border bg-card hover:bg-surface'
      }`}
    >
      <Foto src={bolsa.imagen} alt={bolsa.titulo} className="size-16 shrink-0 rounded-xl object-cover" />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-bold text-ink">
            {bolsa.vendedor.nombre}
          </span>
          <span className="shrink-0 text-sm font-extrabold text-brand">Bs {bolsa.precioNuevo}</span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {bolsa.vendedor.direccion}
        </span>
        <span className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden /> {bolsa.recojoInicio}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden /> {bolsa.distanciaKm} km
          </span>
        </span>
      </span>
    </button>
  )
}

export default function Mapa() {
  const { bolsas, mostrarToast } = useStore()
  const [elegidaId, setElegidaId] = useState<string | undefined>()

  useTitulo(
    'Mapa de bolsas en Santa Cruz · Caserita',
    'Mira en el mapa las bolsas sorpresa disponibles cerca de ti en Santa Cruz.',
  )

  const seleccionadaId = elegidaId ?? bolsas[0]?.id
  const seleccionada = bolsas.find((b) => b.id === seleccionadaId)
  const esEscritorio = useEsEscritorio()

  // Se monta UNA sola versión: esconder la otra con CSS crearía un segundo
  // mapa de Leaflet descargando tiles en paralelo.
  if (esEscritorio) {
    return (
      /* A sangre: sin márgenes ni tarjeta. El mapa ocupa todo el alto de la
         ventana y la lista va pegada al costado, como en las apps de reparto. */
      <div className="flex h-dvh overflow-hidden">
        <div className="flex w-[380px] shrink-0 flex-col border-r border-border bg-background">
          <div className="px-6 pb-4 pt-7">
            <h1 className="text-2xl font-extrabold text-ink">Bolsas en el mapa</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Toca un pin o elige de la lista. El punto azul eres tú.
            </p>
          </div>
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pb-6">
            {bolsas.length === 0
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[88px] rounded-2xl" />)
              : bolsas.map((b) => (
                  <FilaLista
                    key={b.id}
                    bolsa={b}
                    activa={b.id === seleccionadaId}
                    onElegir={() => setElegidaId(b.id)}
                  />
                ))}
          </div>
        </div>

        {/* Columna flexible: el mapa toma el alto sobrante con flex-1, no con
            un 100% que sobre un padre sin altura propia daría cero. */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {bolsas.length === 0 ? (
            <Skeleton className="min-h-0 flex-1 rounded-none" />
          ) : (
            <MapaReal
              bolsas={bolsas}
              seleccionadaId={seleccionadaId}
              onSeleccionar={setElegidaId}
              className="min-h-0 flex-1"
              enmarcado={false}
              onAviso={mostrarToast}
            />
          )}

          {/* La bolsa marcada flota sobre el mapa en vez de robarle alto. */}
          {seleccionada && (
            <Link
              to={`/bolsa/${seleccionada.id}`}
              className="animate-rise absolute bottom-6 left-6 z-[500] flex w-[420px] max-w-[calc(100%-8rem)] items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-lift hover:bg-surface"
            >
              <Foto
                src={seleccionada.imagen}
                alt={seleccionada.titulo}
                className="size-16 shrink-0 rounded-xl object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-bold text-ink">
                    {seleccionada.vendedor.nombre}
                  </span>
                  <Rating value={seleccionada.vendedor.rating} />
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {ventanaDeRecojo(seleccionada.recojoInicio, seleccionada.recojoFin).etiqueta} ·{' '}
                  {seleccionada.vendedor.direccion}
                </span>
                <span className="mt-1 flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground line-through">
                    Bs {seleccionada.precioViejo}
                  </span>
                  <span className="text-base font-extrabold text-brand">
                    Bs {seleccionada.precioNuevo}
                  </span>
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 self-center rounded-full bg-brand px-3 py-2 text-xs font-bold text-primary-foreground">
                Ver <ArrowRight className="size-3.5" aria-hidden />
              </span>
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise px-4 pb-6 pt-5">
        <h1 className="text-xl font-extrabold text-ink">Bolsas en el mapa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Toca un pin para ver la bolsa. El punto azul eres tú.
        </p>

        <div className="mt-4">
          {bolsas.length === 0 ? (
            <Skeleton className="h-[420px] rounded-3xl" />
          ) : (
            <MapaReal
              bolsas={bolsas}
              seleccionadaId={seleccionadaId}
              onSeleccionar={setElegidaId}
              className="h-[420px]"
              onAviso={mostrarToast}
            />
          )}
        </div>

        {seleccionada && (
          <Link
            to={`/bolsa/${seleccionada.id}`}
            className="animate-rise mt-4 flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-card"
          >
            <Foto
              src={seleccionada.imagen}
              alt={seleccionada.titulo}
              className="size-20 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 truncate text-sm font-bold text-ink">
                  {seleccionada.vendedor.nombre}
                </h2>
                <Rating value={seleccionada.vendedor.rating} />
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {seleccionada.vendedor.direccion}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground line-through">
                    Bs {seleccionada.precioViejo}
                  </span>
                  <span className="text-base font-extrabold text-brand">
                    Bs {seleccionada.precioNuevo}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden /> {seleccionada.recojoInicio}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden /> {seleccionada.distanciaKm} km
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}
    </div>
  )
}
