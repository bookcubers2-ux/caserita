import { useEffect, useRef, useState } from 'react'
import { Check, Clock, Loader, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'
import type { EstadoPago, ReservaConBolsa } from '../types'
import { ETIQUETA_ESTADO, confirmarPago } from '../services/pago'
import { useStore } from '../store'
import QrImagen from './QrImagen'
import { Button, GhostButton } from './ui'

const DURACION_QR = 300 // 5 minutos, como los QR de cobro reales

const ESTILO_CHIP: Record<EstadoPago, string> = {
  pendiente: 'bg-card text-muted-foreground ring-1 ring-border',
  esperando: 'bg-brand-soft text-brand-dark',
  procesando: 'bg-ambar-soft text-ambar-ink',
  pagado: 'bg-brand text-primary-foreground',
  expirado: 'bg-card text-destructive',
}

/**
 * Panel de cobro con QR Simple. Se usa igual dentro del modal (desde
 * cualquier reserva) y en la pantalla /pago/:id.
 *
 * El cobro NUNCA se confirma solo: avanza cuando la persona toca "Ya pagué".
 */
export default function PanelPagoQr({
  reserva,
  onPagado,
  onPagarAlRecoger,
}: {
  reserva: ReservaConBolsa
  onPagado?: () => void
  onPagarAlRecoger?: () => void
}) {
  const { marcarPago, mostrarToast } = useStore()
  const yaPagado = reserva.estadoPago === 'pagado'

  const [estado, setEstado] = useState<EstadoPago>(yaPagado ? 'pagado' : 'esperando')
  const [referencia, setReferencia] = useState<string | undefined>(reserva.referenciaPago)
  const [restante, setRestante] = useState(DURACION_QR)
  const [intento, setIntento] = useState(0)
  const confirmando = estado === 'procesando'
  const cerrado = estado === 'pagado' || estado === 'expirado'
  const estadoRef = useRef(estado)
  estadoRef.current = estado

  // Vigencia del QR. Al llegar a cero el código vence de verdad.
  useEffect(() => {
    if (cerrado) return
    const t = window.setInterval(() => {
      setRestante((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(t)
  }, [cerrado, intento])

  // El vencimiento se decide fuera del actualizador de estado, para no
  // mutar otro estado dentro de una función que React puede repetir.
  useEffect(() => {
    if (restante === 0 && estadoRef.current === 'esperando') setEstado('expirado')
  }, [restante])

  const mm = String(Math.floor(restante / 60)).padStart(2, '0')
  const ss = String(restante % 60).padStart(2, '0')

  const confirmar = async () => {
    if (estadoRef.current !== 'esperando') return
    setEstado('procesando')
    estadoRef.current = 'procesando'
    const { referencia: ref } = await confirmarPago()
    // Si mientras tanto el QR venció o se cerró el panel, no se acredita nada.
    if (estadoRef.current !== 'procesando') return
    setReferencia(ref)
    setEstado('pagado')
    marcarPago(reserva.id, 'pagado', ref)
    mostrarToast(`Pago confirmado · ${ref}`)
  }

  const regenerar = () => {
    setRestante(DURACION_QR)
    setEstado('esperando')
    setIntento((n) => n + 1)
  }

  const alRecoger = () => {
    marcarPago(reserva.id, 'pendiente')
    mostrarToast('Pagarás en efectivo al recoger')
    onPagarAlRecoger?.()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">QR Simple</p>
            <p className="mt-0.5 truncate text-sm font-bold text-ink">
              {reserva.bolsa?.vendedor.nombre}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-card px-2.5 py-1 text-xs font-bold text-muted-foreground ring-1 ring-border">
            demo
          </span>
        </div>

        <div className="relative mt-4 grid place-items-center rounded-2xl bg-brand-soft p-5">
          <QrImagen
            key={intento}
            codigo={reserva.codigo}
            negocio={reserva.bolsa?.vendedor.nombre ?? 'Caserita'}
            monto={reserva.total}
            atenuado={estado !== 'esperando'}
          />

          {estado === 'procesando' && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl">
              <div className="flex flex-col items-center gap-2 text-center">
                <Loader className="size-9 animate-spin text-brand-dark" aria-hidden />
                <p className="text-sm font-bold text-brand-dark">Acreditando el pago…</p>
              </div>
            </div>
          )}

          {estado === 'pagado' && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="animate-pop grid size-16 place-items-center rounded-full bg-brand text-primary-foreground">
                  <Check className="size-9" strokeWidth={3} aria-hidden />
                </span>
                <p className="text-sm font-extrabold text-brand-dark">¡Pago recibido!</p>
              </div>
            </div>
          )}

          {estado === 'expirado' && (
            <div role="alert" className="absolute inset-0 grid place-items-center rounded-2xl">
              <div className="flex flex-col items-center gap-2 text-center">
                <TriangleAlert className="size-9 text-destructive" aria-hidden />
                <p className="text-sm font-bold text-ink">El QR venció</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">Monto a pagar</span>
          <span className="text-2xl font-extrabold text-brand">Bs {reserva.total}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          {/* Región viva: anuncia cada cambio de estado a los lectores de pantalla. */}
          <span aria-live="polite" aria-atomic="true">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${ESTILO_CHIP[estado]}`}
            >
              {estado === 'procesando' && <Loader className="size-3.5 animate-spin" aria-hidden />}
              {estado === 'pagado' && <Check className="size-3.5" aria-hidden />}
              {estado === 'esperando' && (
                <span className="size-2 animate-pulse rounded-full bg-brand" aria-hidden />
              )}
              {ETIQUETA_ESTADO[estado]}
            </span>
          </span>

          {!cerrado ? (
            <span
              aria-hidden
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground"
            >
              <Clock className="size-3.5" /> vence en {mm}:{ss}
            </span>
          ) : (
            referencia && (
              <span className="font-mono text-xs font-bold text-muted-foreground">
                {referencia}
              </span>
            )
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Referencia {reserva.codigo} · QR de demostración, todavía sin convenio bancario
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4">
        <ShieldCheck className="size-5 shrink-0 text-brand-dark" aria-hidden />
        <p className="text-sm font-semibold text-brand-dark">
          Tu bolsa queda reservada con el código {reserva.codigo}
        </p>
      </div>

      <div className="space-y-3">
        {estado === 'expirado' ? (
          <Button full onClick={regenerar}>
            <RefreshCw className="size-5" aria-hidden /> Generar un QR nuevo
          </Button>
        ) : estado === 'pagado' ? (
          <Button full onClick={() => onPagado?.()}>
            Listo
          </Button>
        ) : (
          <>
            <Button full onClick={confirmar} disabled={confirmando}>
              {confirmando ? 'Confirmando…' : 'Ya pagué'}
            </Button>
            <GhostButton full onClick={alRecoger}>
              Prefiero pagar en efectivo al recoger
            </GhostButton>
          </>
        )}
      </div>
    </div>
  )
}
