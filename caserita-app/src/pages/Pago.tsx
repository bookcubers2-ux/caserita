import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { useTitulo } from '../lib/useTitulo'
import { ventanaDeRecojo } from '../lib/horarios'
import PanelPagoQr from '../components/PanelPagoQr'
import NoEncontrado from './NoEncontrado'
import { BackButton, Skeleton } from '../components/ui'

export default function Pago() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { reservaPorId, cargando } = useStore()
  const reserva = id ? reservaPorId(id) : undefined

  useTitulo(
    reserva ? 'Pagar con QR · Caserita' : 'Página no encontrada · Caserita',
    reserva ? 'Paga con el QR de Caserita y sube tu comprobante.' : undefined,
  )

  if (cargando || (reserva && !reserva.bolsa)) {
    return (
      <div className="pagina space-y-4 px-4 py-8">
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    )
  }

  if (!reserva || !reserva.bolsa) return <NoEncontrado />

  return (
    <div className="animate-rise pagina space-y-4 px-4 pb-10 pt-5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <BackButton to={`/bolsa/${reserva.bolsaId}`} />
        <h1 className="min-w-0 truncate text-xl font-extrabold text-ink lg:text-3xl">
          Pagar con QR
        </h1>
      </div>

      <div className="lg:grid lg:max-w-4xl lg:grid-cols-2 lg:items-start lg:gap-8">
        <PanelPagoQr
          reserva={reserva}
          onPagado={() => navigate(`/reserva/${reserva.id}`)}
          onPagarAlRecoger={() => navigate(`/reserva/${reserva.id}`)}
        />

        <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card lg:mt-0">
          <h2 className="text-sm font-bold text-ink">Detalle de la reserva</h2>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Puesto</span>
            <span className="min-w-0 truncate text-sm font-bold text-ink">
              {reserva.bolsa.vendedor.nombre}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Recojo</span>
            <span className="text-sm font-bold text-ink">
              {ventanaDeRecojo(reserva.bolsa.recojoInicio, reserva.bolsa.recojoFin).etiqueta}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Dirección</span>
            <span className="min-w-0 truncate text-sm font-bold text-ink">
              {reserva.bolsa.vendedor.direccion}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Código de retiro</span>
            <span className="font-mono text-sm font-extrabold tracking-widest text-brand-dark">
              {reserva.codigo}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
