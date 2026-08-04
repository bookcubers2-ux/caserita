import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, QrCode, Truck } from 'lucide-react'
import { useStore, useUsuario } from '../store'
import { useTitulo } from '../lib/useTitulo'
import { ventanaDeRecojo } from '../lib/horarios'
import ModalPagoQr from '../components/ModalPagoQr'
import NoEncontrado from './NoEncontrado'
import { Button, CodigoBox, EcoBadge, GhostButton, LinkButton, Skeleton } from '../components/ui'

export default function Reserva() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { reservaPorId, pedirDelivery, cargando } = useStore()
  const usuario = useUsuario()
  const [abrirPago, setAbrirPago] = useState(false)
  const reserva = id ? reservaPorId(id) : undefined

  // El título refleja lo que se está mostrando de verdad: si la reserva no
  // existe, la pestaña no puede seguir diciendo "Reserva confirmada".
  useTitulo(
    reserva ? 'Reserva confirmada · Caserita' : 'Página no encontrada · Caserita',
    reserva
      ? 'Tu bolsa está reservada: muestra tu código al recoger y paga en efectivo o QR.'
      : undefined,
  )

  const pedir = async () => {
    if (!reserva) return
    const d = await pedirDelivery(reserva.id)
    navigate(`/delivery/${d.id}`)
  }

  // Mientras carga el catálogo, esqueleto. Si la reserva no existe, es un
  // callejón sin salida: hay que mandar a la pantalla de no encontrado.
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

  return (
    <div className="animate-rise mx-auto max-w-md space-y-6 px-4 pb-10 pt-10 lg:pt-14">
      <div className="flex flex-col items-center text-center">
        <span className="animate-pop grid size-20 place-items-center rounded-full bg-brand text-primary-foreground">
          <Check className="size-10" strokeWidth={3} aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-ink">¡Reservado!</h1>
        <p className="mt-1 text-sm text-muted-foreground">Muestra este código al recoger</p>
      </div>

      <CodigoBox codigo={reserva.codigo} />

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Negocio</span>
          <span className="min-w-0 truncate text-sm font-bold text-ink">
            {reserva.bolsa.vendedor.nombre}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Recojo</span>
          <span className="text-sm font-bold text-ink">
            {ventanaDeRecojo(reserva.bolsa.recojoInicio, reserva.bolsa.recojoFin).etiqueta} ·{' '}
            {reserva.bolsa.distanciaKm} km
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Dirección</span>
          <span className="min-w-0 truncate text-sm font-bold text-ink">
            {reserva.bolsa.vendedor.direccion}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">
            {pagado ? 'Pagado con QR' : 'Pago al recoger'}
          </span>
          <span className="text-sm font-extrabold text-brand">
            Bs {reserva.total}
            {pagado ? ' · confirmado' : ' · pendiente'}
          </span>
        </div>
        {pagado && reserva.referenciaPago && (
          <p className="text-right font-mono text-xs text-muted-foreground">
            {reserva.referenciaPago}
          </p>
        )}
      </div>

      <EcoBadge texto={`Llevas ${usuario.comidasEsteMes} comidas rescatadas este mes`} />

      <div className="space-y-3">
        {!pagado && (
          <Button full onClick={() => setAbrirPago(true)}>
            <QrCode className="size-5" aria-hidden /> Pagar con QR ahora
          </Button>
        )}
        <GhostButton full onClick={pedir}>
          <Truck className="size-5" aria-hidden /> Pedir delivery (Bs 8)
        </GhostButton>
        <LinkButton to="/pedidos" variant={pagado ? 'brand' : 'ghost'}>
          Ver mis pedidos
        </LinkButton>
      </div>

      {abrirPago && <ModalPagoQr reserva={reserva} onCerrar={() => setAbrirPago(false)} />}
    </div>
  )
}
