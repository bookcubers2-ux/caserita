import { useState } from 'react'
import { Check, Loader, PackageCheck, QrCode, Star, X } from 'lucide-react'
import type { EstadoPago, ReservaConBolsa } from '../types'
import { useSondeo, useStore, useUsuario } from '../store'
import { useTitulo } from '../lib/useTitulo'
import { ETIQUETA_ESTADO, INTERVALO_SONDEO_MS } from '../services/pago'
import ModalPagoQr from '../components/ModalPagoQr'
import Calificar from '../components/Calificar'
import Foto from '../components/Foto'
import { LinkButton } from '../components/ui'

const CHIP_PAGO: Record<EstadoPago, string> = {
  pendiente: 'bg-card text-muted-foreground ring-1 ring-border',
  verificando: 'bg-ambar-soft text-ambar-ink',
  pagado: 'bg-brand-soft text-brand-dark',
  rechazado: 'bg-card text-destructive ring-1 ring-border',
}

const ESTADO: Record<string, { texto: string; clase: string }> = {
  activa: { texto: 'Por recoger', clase: 'bg-brand text-primary-foreground' },
  entregada: { texto: 'Entregado', clase: 'bg-surface text-muted-foreground' },
  cancelada: { texto: 'Cancelado', clase: 'bg-surface text-muted-foreground' },
}

interface Acciones {
  onPagar: (r: ReservaConBolsa) => void
  onCancelar: (r: ReservaConBolsa) => void
  onRecogida: (r: ReservaConBolsa) => void
  onCalificar: (r: ReservaConBolsa) => void
}

function Fila({ reserva, onPagar, onCancelar, onRecogida, onCalificar }: { reserva: ReservaConBolsa } & Acciones) {
  if (!reserva.bolsa) return null
  const activa = reserva.estado === 'activa'
  const entregada = reserva.estado === 'entregada'
  const pagado = reserva.estadoPago === 'pagado'
  const verificando = reserva.estadoPago === 'verificando'
  const estado = ESTADO[reserva.estado] ?? ESTADO.activa

  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
      <Foto src={reserva.bolsa.imagen} alt={reserva.bolsa.titulo} className="size-16 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-bold text-ink">{reserva.bolsa.vendedor.nombre}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${estado.clase}`}>{estado.texto}</span>
        </div>

        <p className="truncate text-xs text-muted-foreground">
          {reserva.bolsa.titulo} · {reserva.fecha} · Bs {reserva.total}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-extrabold tracking-widest text-brand-dark">{reserva.codigo}</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${CHIP_PAGO[reserva.estadoPago]}`}>
            {pagado && <Check className="size-3" aria-hidden />}
            {verificando && <Loader className="size-3 animate-spin" aria-hidden />}
            {reserva.metodoPago === 'efectivo' && reserva.estadoPago === 'pendiente' ? 'Pagas al recoger' : ETIQUETA_ESTADO[reserva.estadoPago]}
          </span>
          {reserva.calificacion && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ambar-ink">
              <Star className="size-3 fill-ambar text-ambar" aria-hidden /> {reserva.calificacion.estrellas}/5
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {activa && !pagado && (
            <button
              type="button"
              onClick={() => onPagar(reserva)}
              className="tap inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-primary-foreground transition-transform active:scale-95"
            >
              {verificando ? <Loader className="size-3.5 animate-spin" aria-hidden /> : <QrCode className="size-3.5" aria-hidden />}
              {verificando ? 'Ver pago' : reserva.estadoPago === 'rechazado' ? 'Volver a subir comprobante' : 'Pagar con QR'}
            </button>
          )}
          {activa && (
            <>
              <button
                type="button"
                onClick={() => onRecogida(reserva)}
                className="tap inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-bold text-ink underline underline-offset-4"
              >
                <PackageCheck className="size-3.5" aria-hidden /> Ya lo recogí
              </button>
              {!pagado && (
                <button
                  type="button"
                  onClick={() => onCancelar(reserva)}
                  className="tap inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-bold text-muted-foreground underline underline-offset-4 hover:text-destructive"
                >
                  <X className="size-3.5" aria-hidden /> Cancelar
                </button>
              )}
            </>
          )}
          {entregada && (
            <button
              type="button"
              onClick={() => onCalificar(reserva)}
              className="tap inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ambar-soft px-3 py-1.5 text-xs font-bold text-ambar-ink transition-transform active:scale-95"
            >
              <Star className="size-3.5" aria-hidden /> {reserva.calificacion ? 'Cambiar calificación' : 'Calificar a la casera'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Pedidos() {
  const { reservas, cancelarReserva, marcarRecogida, mostrarToast } = useStore()
  const usuario = useUsuario()
  const [pagando, setPagando] = useState<ReservaConBolsa | null>(null)
  const [calificando, setCalificando] = useState<ReservaConBolsa | null>(null)
  const activas = reservas.filter((r) => r.estado === 'activa')
  const historial = reservas.filter((r) => r.estado !== 'activa')

  useTitulo('Mis pedidos e impacto · Caserita', 'Revisa tus pedidos por recoger, tu historial y el impacto que llevas acumulado.')

  // Con pedidos activos, la lista se refresca sola (por si aceptan un pago o la casera entrega).
  useSondeo(activas.length > 0, INTERVALO_SONDEO_MS * 2)

  const acciones: Acciones = {
    onPagar: setPagando,
    onCancelar: async (r) => {
      await cancelarReserva(r.id)
      mostrarToast(`Pedido ${r.codigo} cancelado`)
    },
    onRecogida: async (r) => {
      await marcarRecogida(r.id)
      mostrarToast(`¡Buen provecho! Ahora puedes calificar a ${r.bolsa?.vendedor.nombre ?? 'tu casera'}`)
    },
    onCalificar: setCalificando,
  }

  const enModal = pagando ? (reservas.find((r) => r.id === pagando.id) ?? pagando) : null
  const enCalificar = calificando ? (reservas.find((r) => r.id === calificando.id) ?? calificando) : null

  return (
    <div className="animate-rise pagina space-y-6 px-4 pb-6 pt-5">
      <h1 className="text-xl font-extrabold text-ink lg:text-3xl">Mis pedidos</h1>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-brand-soft p-4 text-center lg:max-w-2xl lg:gap-6 lg:p-6">
        <div>
          <p className="text-lg font-extrabold text-brand-dark lg:text-2xl">{usuario.comidasRescatadas}</p>
          <p className="text-xs text-brand-dark">comidas</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-brand-dark lg:text-2xl">{usuario.kgCO2Evitado} kg</p>
          <p className="text-xs text-brand-dark">CO₂ evitado</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-brand-dark lg:text-2xl">Bs {usuario.bsAhorrados}</p>
          <p className="text-xs text-brand-dark">ahorrados</p>
        </div>
      </div>

      {reservas.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <p className="text-sm font-bold text-ink">Todavía no reservaste nada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando reserves algo vas a ver aquí tu código de retiro y el estado del pago.
          </p>
          <div className="mx-auto mt-4 max-w-xs">
            <LinkButton to="/" variant="brand">
              Ver qué hay cerca
            </LinkButton>
          </div>
        </div>
      )}

      {activas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink lg:text-lg">Por recoger</h2>
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
      {enCalificar && <Calificar reserva={enCalificar} onCerrar={() => setCalificando(null)} />}
    </div>
  )
}
