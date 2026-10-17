import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Loader, QrCode, Star } from 'lucide-react'
import { useSondeo, useStore, useUsuario } from '../store'
import { useTitulo } from '../lib/useTitulo'
import { ventanaDeRecojo } from '../lib/horarios'
import { ETIQUETA_ESTADO, INTERVALO_SONDEO_MS } from '../services/pago'
import ModalPagoQr from '../components/ModalPagoQr'
import Calificar from '../components/Calificar'
import NoEncontrado from './NoEncontrado'
import { Button, CodigoBox, EcoBadge, GhostButton, LinkButton, Skeleton } from '../components/ui'

export default function Reserva() {
  const { id } = useParams()
  const { reservaPorId, cargando } = useStore()
  const usuario = useUsuario()
  const [abrirPago, setAbrirPago] = useState(false)
  const [abrirCalificar, setAbrirCalificar] = useState(false)
  const reserva = id ? reservaPorId(id) : undefined

  useTitulo(
    reserva ? 'Reserva confirmada · Caserita' : 'Página no encontrada · Caserita',
    reserva ? 'Tu pedido está reservado: muestra tu código al recoger.' : undefined,
  )

  // Si el pago está en revisión, esta pantalla se entera sola cuando se acepte.
  useSondeo(reserva?.estadoPago === 'verificando' || reserva?.estado === 'activa', INTERVALO_SONDEO_MS * 2)

  if (cargando || (reserva && !reserva.bolsa)) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-10">
        <Skeleton className="mx-auto size-20 rounded-full" />
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    )
  }

  if (!reserva || !reserva.bolsa) return <NoEncontrado />

  const pagado = reserva.estadoPago === 'pagado'
  const verificando = reserva.estadoPago === 'verificando'
  const entregada = reserva.estado === 'entregada'
  const cancelada = reserva.estado === 'cancelada'

  const titulo = cancelada ? 'Pedido cancelado' : entregada ? '¡Buen provecho!' : verificando ? 'Revisando tu pago' : '¡Reservado!'
  const sub = cancelada
    ? 'Este pedido ya no está activo'
    : entregada
      ? 'Ya recogiste tu pedido'
      : verificando
        ? 'En cuanto confirmemos el pago te avisamos aquí'
        : 'Muestra este código al recoger'

  return (
    <div className="animate-rise mx-auto max-w-md space-y-6 px-4 pb-10 pt-10 lg:pt-14">
      <div className="flex flex-col items-center text-center">
        <span
          className={`animate-pop grid size-20 place-items-center rounded-full ${
            cancelada ? 'bg-surface text-muted-foreground' : verificando ? 'bg-ambar-soft text-ambar-ink' : 'bg-brand text-primary-foreground'
          }`}
        >
          {verificando ? <Loader className="size-10 animate-spin" aria-hidden /> : <Check className="size-10" strokeWidth={3} aria-hidden />}
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-ink">{titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      </div>

      {!cancelada && <CodigoBox codigo={reserva.codigo} />}

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Puesto</span>
          <span className="min-w-0 truncate text-sm font-bold text-ink">{reserva.bolsa.vendedor.nombre}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Qué</span>
          <span className="min-w-0 truncate text-sm font-bold text-ink">{reserva.bolsa.titulo}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Recojo</span>
          <span className="text-sm font-bold text-ink">
            {ventanaDeRecojo(reserva.bolsa.recojoInicio, reserva.bolsa.recojoFin).etiqueta} · {reserva.bolsa.distanciaKm} km
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Dónde</span>
          <span className="min-w-0 truncate text-sm font-bold text-ink">{reserva.bolsa.vendedor.direccion}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">
            {reserva.metodoPago === 'qr' ? 'Pago con QR' : 'Pago en efectivo al recoger'}
          </span>
          <span className={`text-sm font-extrabold ${pagado ? 'text-brand' : 'text-ink'}`}>
            Bs {reserva.total} · {ETIQUETA_ESTADO[reserva.estadoPago].toLowerCase()}
          </span>
        </div>
        {pagado && reserva.referenciaPago && (
          <p className="text-right font-mono text-xs text-muted-foreground">{reserva.referenciaPago}</p>
        )}
      </div>

      {!cancelada && <EcoBadge texto={`Llevas ${usuario.comidasEsteMes} comidas rescatadas este mes`} />}

      <div className="space-y-3">
        {!cancelada && !entregada && !pagado && !verificando && (
          <Button full onClick={() => setAbrirPago(true)}>
            <QrCode className="size-5" aria-hidden /> Pagar con QR ahora
          </Button>
        )}
        {verificando && (
          <GhostButton full onClick={() => setAbrirPago(true)}>
            <Loader className="size-5 animate-spin" aria-hidden /> Ver estado del pago
          </GhostButton>
        )}
        {entregada && (
          <Button full onClick={() => setAbrirCalificar(true)}>
            <Star className="size-5" aria-hidden />{' '}
            {reserva.calificacion ? `Tu calificación: ${reserva.calificacion.estrellas}/5 · cambiar` : 'Calificar a la casera'}
          </Button>
        )}
        <LinkButton to="/pedidos" variant={pagado || entregada ? 'ghost' : 'brand'}>
          Ver mis pedidos
        </LinkButton>
      </div>

      {abrirPago && <ModalPagoQr reserva={reserva} onCerrar={() => setAbrirPago(false)} />}
      {abrirCalificar && <Calificar reserva={reserva} onCerrar={() => setAbrirCalificar(false)} />}
    </div>
  )
}
