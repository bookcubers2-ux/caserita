import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Clock, Leaf, Phone, QrCode, Star, UserRound } from 'lucide-react'
import type { MetodoPago, Opinion } from '../types'
import { useStore } from '../store'
import { datosCliente } from '../lib/cliente'
import { getOpiniones } from '../services/api'
import { useTitulo } from '../lib/useTitulo'
import { ventanaDeRecojo } from '../lib/horarios'
import { TEXTO_SORPRESA } from '../data/seed'
import Foto from '../components/Foto'
import { descuento } from '../components/BolsaCard'
import { BackButton, Button, EtiquetaSorpresa, Rating, Skeleton } from '../components/ui'
import NoEncontrado from './NoEncontrado'

export default function Detalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { bolsaPorId, reservar: crear, cargando, mostrarToast } = useStore()
  const [metodo, setMetodo] = useState<MetodoPago>('qr')
  const [enviando, setEnviando] = useState(false)
  const [datos] = useState(() => datosCliente())
  const [nombre, setNombre] = useState(datos.nombre)
  const [telefono, setTelefono] = useState(datos.telefono)
  const [opiniones, setOpiniones] = useState<Opinion[] | null>(null)

  const bolsa = id ? bolsaPorId(id) : undefined
  const vendedorId = bolsa?.vendedorId

  useEffect(() => {
    if (!vendedorId) return
    let vivo = true
    getOpiniones(vendedorId)
      .then((o) => vivo && setOpiniones(o))
      .catch(() => vivo && setOpiniones([]))
    return () => {
      vivo = false
    }
  }, [vendedorId])

  useTitulo(
    bolsa
      ? `${bolsa.vendedor.nombre} · ${bolsa.titulo} · Caserita`
      : cargando
        ? 'Cargando bolsa · Caserita'
        : 'Página no encontrada · Caserita',
    // Con una bolsa sorpresa el contenido tampoco se filtra por la meta.
    bolsa?.sorpresa ? TEXTO_SORPRESA : bolsa?.descripcion,
  )

  if (cargando) {
    return (
      <div className="pagina space-y-4 px-4 py-8">
        <Skeleton className="h-64 rounded-3xl lg:h-[440px]" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    )
  }

  if (!bolsa) return <NoEncontrado />

  const agotada = bolsa.disponibles <= 0
  const ventana = ventanaDeRecojo(bolsa.recojoInicio, bolsa.recojoFin)

  const faltanDatos = !nombre.trim()

  const reservar = async () => {
    if (faltanDatos) {
      mostrarToast('Dinos tu nombre para que la casera sepa a quién entregar')
      document.getElementById('nombre-cliente')?.focus()
      return
    }
    setEnviando(true)
    try {
      const reserva = await crear(bolsa.id, metodo, { nombre: nombre.trim(), telefono: telefono.trim() })
      navigate(metodo === 'qr' ? `/pago/${reserva.id}` : `/reserva/${reserva.id}`)
    } finally {
      setEnviando(false)
    }
  }

  const etiquetaBoton = agotada
    ? 'Agotada por hoy'
    : enviando
      ? 'Reservando…'
      : `Reservar · Bs ${bolsa.precioNuevo}`

  return (
    // Sin animacion en la raiz: su transform desplazaria la barra fija de abajo.
    <div className="pagina pb-28 lg:pb-12">
      <Link
        to="/"
        className="mb-6 hidden items-center gap-2 text-sm font-bold text-muted-foreground hover:text-ink lg:inline-flex"
      >
        <ArrowLeft className="size-4" aria-hidden /> Volver a las bolsas
      </Link>

      <div className="animate-rise lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10">
        <div className="relative lg:sticky lg:top-8">
          <Foto
            src={bolsa.imagen}
            alt={`${bolsa.titulo} de ${bolsa.vendedor.nombre}`}
            eager
            className={`h-64 w-full object-cover lg:h-[440px] lg:rounded-3xl ${
              agotada ? 'grayscale' : ''
            }`}
          />
          <div className="absolute left-3 top-4 lg:hidden">
            <BackButton to="/" />
          </div>
          <span className="absolute right-3 top-4 rounded-full bg-naranja px-3 py-1.5 text-sm font-extrabold text-ink lg:right-4">
            -{descuento(bolsa)}%
          </span>
          <span
            className={`absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-sm font-bold backdrop-blur ${
              agotada ? 'bg-ink/85 text-background' : 'bg-card/90 text-ink'
            }`}
          >
            {agotada ? 'Agotada por hoy' : `${bolsa.disponibles} disponibles`}
          </span>
        </div>

        <div className="space-y-4 px-4 pt-5 lg:px-0 lg:pt-0">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold text-ink lg:text-3xl">
                {bolsa.vendedor.nombre}
              </h1>
              <p className="text-sm text-muted-foreground">
                {bolsa.vendedor.tipo} · {bolsa.distanciaKm} km · {bolsa.vendedor.direccion}
              </p>
            </div>
            <div className="text-right">
              <Rating value={bolsa.vendedor.rating} />
              <p className="text-[11px] text-muted-foreground">
                {bolsa.vendedor.opiniones ? `${bolsa.vendedor.opiniones} ${bolsa.vendedor.opiniones === 1 ? 'opinión' : 'opiniones'}` : 'puesto nuevo'}
              </p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-ink lg:text-lg">{bolsa.titulo}</h2>
              {bolsa.sorpresa && <EtiquetaSorpresa />}
            </div>
            <p className="mt-1 text-sm text-muted-foreground lg:text-base">
              {bolsa.sorpresa ? TEXTO_SORPRESA : bolsa.descripcion}
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-base text-muted-foreground line-through">
              Bs {bolsa.precioViejo}
            </span>
            <span className="text-3xl font-extrabold text-brand lg:text-4xl">
              Bs {bolsa.precioNuevo}
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 lg:bg-card">
            <Clock className="size-5 shrink-0 text-brand-dark" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">
                Recoge {ventana.etiqueta.toLowerCase()}
              </p>
              <p className="text-xs text-muted-foreground">Llega dentro de la ventana de recojo</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4">
            <Leaf className="size-5 shrink-0 text-brand-dark" aria-hidden />
            <p className="text-sm font-semibold text-brand-dark">
              Salvas ~{bolsa.kgComida} kg de comida y evitas {bolsa.kgCO2} kg de CO₂
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-ink">¿Cómo quieres pagar?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                aria-pressed={metodo === 'qr'}
                onClick={() => setMetodo('qr')}
                className={`tap flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors ${
                  metodo === 'qr'
                    ? 'border-brand bg-brand-soft'
                    : 'border-border bg-card hover:bg-surface'
                }`}
              >
                <QrCode className="size-6 text-brand-dark" aria-hidden />
                <span className="text-sm font-bold text-ink">QR</span>
                <span className="text-xs text-muted-foreground">Pagas desde tu banco y subes la captura</span>
              </button>
              <button
                type="button"
                aria-pressed={metodo === 'efectivo'}
                onClick={() => setMetodo('efectivo')}
                className={`tap flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors ${
                  metodo === 'efectivo'
                    ? 'border-brand bg-brand-soft'
                    : 'border-border bg-card hover:bg-surface'
                }`}
              >
                <Banknote className="size-6 text-brand-dark" aria-hidden />
                <span className="text-sm font-bold text-ink">Efectivo</span>
                <span className="text-xs text-muted-foreground">Pagas cuando recoges</span>
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-ink">¿A nombre de quién?</h2>
            <p className="text-xs text-muted-foreground">La casera lo ve para saber a quién entregar. Se guarda en tu celular.</p>
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4">
              <UserRound className="size-5 shrink-0 text-brand-dark" aria-hidden />
              <input
                id="nombre-cliente"
                value={nombre}
                onChange={(e) => setNombre(e.target.value.slice(0, 60))}
                placeholder="Tu nombre"
                autoComplete="name"
                className="min-h-12 w-full bg-transparent text-sm font-semibold text-ink placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4">
              <Phone className="size-5 shrink-0 text-brand-dark" aria-hidden />
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.slice(0, 30))}
                placeholder="Tu celular (opcional)"
                inputMode="tel"
                autoComplete="tel"
                className="min-h-12 w-full bg-transparent text-sm font-semibold text-ink placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-ink">Lo que dicen los vecinos</h2>
            {opiniones === null && <p className="text-xs text-muted-foreground">Cargando opiniones…</p>}
            {opiniones?.length === 0 && (
              <p className="text-sm text-muted-foreground">Todavía nadie calificó este puesto. Sé el primero cuando recojas tu pedido.</p>
            )}
            {opiniones && opiniones.length > 0 && (
              <ul className="space-y-2">
                {opiniones.slice(0, 5).map((o, i) => (
                  <li key={i} className="rounded-2xl border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-ink">{o.nombre}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-ambar-ink">
                        <Star className="size-3.5 fill-ambar text-ambar" aria-hidden /> {o.estrellas}/5 · {o.fecha}
                      </span>
                    </div>
                    {o.comentario && <p className="mt-1 text-sm text-muted-foreground">{o.comentario}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Escritorio: el boton va en la columna, no flotando. */}
          <div className="hidden pt-2 lg:block">
            <Button full onClick={reservar} disabled={enviando || agotada}>
              {etiquetaBoton}
            </Button>
          </div>
        </div>
      </div>

      {/* Telefono: barra fija abajo. */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-card/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <Button full onClick={reservar} disabled={enviando || agotada}>
          {etiquetaBoton}
        </Button>
      </div>
    </div>
  )
}
