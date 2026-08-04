import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Loader, PackageCheck, QrCode, Truck, X } from 'lucide-react'
import type { EstadoPago, ReservaConBolsa } from '../types'
import { useStore, useUsuario } from '../store'
import { useTitulo } from '../lib/useTitulo'
import ModalPagoQr from '../components/ModalPagoQr'
import Foto from '../components/Foto'
import { LinkButton } from '../components/ui'

// Fondo blanco en los chips grises: sobre `surface` el texto quedaba por
// debajo del contraste AA.
const CHIP_PAGO: Record<EstadoPago, string> = {
  pendiente: 'bg-card text-muted-foreground ring-1 ring-border',
  esperando: 'bg-brand-soft text-brand-dark',
  procesando: 'bg-ambar-soft text-ambar-ink',
  pagado: 'bg-brand-soft text-brand-dark',
  expirado: 'bg-card text-destructive ring-1 ring-border',
}

const TEXTO_PAGO: Record<EstadoPago, string> = {
  pendiente: 'Por pagar',
  esperando: 'Esperando pago',
  procesando: 'Procesando',
  pagado: 'Pagado',
  expirado: 'QR vencido',
}

interface AccionesFila {
  onPagar: (r: ReservaConBolsa) => void
  onDelivery: (r: ReservaConBolsa) => void
  onCancelar: (r: ReservaConBolsa) => void
  onRecogida: (r: ReservaConBolsa) => void
}

function Fila({
  reserva,
  onPagar,
  onDelivery,
  onCancelar,
  onRecogida,
}: { reserva: ReservaConBolsa } & AccionesFila) {
  if (!reserva.bolsa) return null
  const activa = reserva.estado === 'activa'
  const pagado = reserva.estadoPago === 'pagado'

  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
      <Foto
        src={reserva.bolsa.imagen}
        alt={reserva.bolsa.titulo}
        className="size-16 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-bold text-ink">
            {reserva.bolsa.vendedor.nombre}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
              activa ? 'bg-brand text-primary-foreground' : 'bg-surface text-muted-foreground'
            }`}
          >
            {activa ? 'Activa' : 'Recogida'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          {reserva.fecha} · Bs {reserva.total} ·{' '}
          {reserva.metodoPago === 'qr' ? 'QR Simple' : 'Efectivo'}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-extrabold tracking-widest text-brand-dark">
            {reserva.codigo}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              CHIP_PAGO[reserva.estadoPago]
            }`}
          >
            {reserva.estadoPago === 'pagado' && <Check className="size-3" aria-hidden />}
            {reserva.estadoPago === 'procesando' && (
              <Loader className="size-3 animate-spin" aria-hidden />
            )}
            {TEXTO_PAGO[reserva.estadoPago]}
          </span>
        </div>

        {pagado && reserva.referenciaPago && (
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {reserva.referenciaPago}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {!pagado && (
            <button
              type="button"
              onClick={() => onPagar(reserva)}
              className="tap inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-primary-foreground transition-transform active:scale-95"
            >
              <QrCode className="size-3.5" aria-hidden /> Pagar con QR
            </button>
          )}
          {activa && (
            <>
              <button
                type="button"
                onClick={() => onDelivery(reserva)}
                className="tap inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-bold text-brand underline underline-offset-4"
              >
                <Truck className="size-3.5" aria-hidden /> Seguir delivery
              </button>
              <button
                type="button"
                onClick={() => onRecogida(reserva)}
                className="tap inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-bold text-ink underline underline-offset-4"
              >
                <PackageCheck className="size-3.5" aria-hidden /> Ya la recogí
              </button>
              <button
                type="button"
                onClick={() => onCancelar(reserva)}
                className="tap inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-bold text-muted-foreground underline underline-offset-4 hover:text-destructive"
              >
                <X className="size-3.5" aria-hidden /> Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Pedidos() {
  const { reservas, pedirDelivery, cancelarReserva, marcarRecogida, mostrarToast } = useStore()
  const usuario = useUsuario()
  const navigate = useNavigate()
  const [pagando, setPagando] = useState<ReservaConBolsa | null>(null)
  const activas = reservas.filter((r) => r.estado === 'activa')
  const historial = reservas.filter((r) => r.estado !== 'activa')

  useTitulo(
    'Mis pedidos e impacto · Caserita',
    'Revisa tus reservas activas, tu historial y el impacto que llevas acumulado.',
  )

  const acciones = {
    onPagar: setPagando,
    onDelivery: async (r: ReservaConBolsa) => {
      const d = await pedirDelivery(r.id)
      navigate(`/delivery/${d.id}`)
    },
    onCancelar: async (r: ReservaConBolsa) => {
      await cancelarReserva(r.id)
      mostrarToast(`Reserva ${r.codigo} cancelada · la bolsa vuelve al stock`)
    },
    onRecogida: async (r: ReservaConBolsa) => {
      await marcarRecogida(r.id)
      mostrarToast(`¡Listo! Rescataste la bolsa de ${r.bolsa?.vendedor.nombre ?? 'tu casero'}`)
    },
  }

  // La reserva del modal se relee del store para reflejar el estado en vivo.
  const enModal = pagando ? reservas.find((r) => r.id === pagando.id) ?? pagando : null

  return (
    <div className="animate-rise pagina space-y-6 px-4 pb-6 pt-5">
      <h1 className="text-xl font-extrabold text-ink lg:text-3xl">Mis pedidos</h1>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-brand-soft p-4 text-center lg:max-w-2xl lg:gap-6 lg:p-6">
        <div>
          <p className="text-lg font-extrabold text-brand-dark lg:text-2xl">
            {usuario.comidasRescatadas}
          </p>
          <p className="text-xs text-brand-dark">comidas</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-brand-dark lg:text-2xl">
            {usuario.kgCO2Evitado} kg
          </p>
          <p className="text-xs text-brand-dark">CO₂ evitado</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-brand-dark lg:text-2xl">
            Bs {usuario.bsAhorrados}
          </p>
          <p className="text-xs text-brand-dark">ahorrados</p>
        </div>
      </div>

      {reservas.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <p className="text-sm font-bold text-ink">Todavía no reservaste nada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando reserves una bolsa vas a ver aquí tu código de retiro y el estado del pago.
          </p>
          <div className="mx-auto mt-4 max-w-xs">
            <LinkButton to="/" variant="brand">
              Ver bolsas cerca
            </LinkButton>
          </div>
        </div>
      )}

      {activas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink lg:text-lg">Activas</h2>
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {activas.map((r) => (
              <Fila key={r.id} reserva={r} {...acciones} />
            ))}
          </div>
        </section>
      )}

      {historial.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink lg:text-lg">Historial</h2>
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {historial.map((r) => (
              <Fila key={r.id} reserva={r} {...acciones} />
            ))}
          </div>
        </section>
      )}

      {enModal && <ModalPagoQr reserva={enModal} onCerrar={() => setPagando(null)} />}
    </div>
  )
}
