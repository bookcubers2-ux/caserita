import { useRef, useState } from 'react'
import { Check, Clock, Loader, RefreshCw, ShieldCheck, Upload, X } from 'lucide-react'
import type { ReservaConBolsa } from '../types'
import { ETIQUETA_ESTADO, INTERVALO_SONDEO_MS, QR_COBRO_URL, glosaDePago } from '../services/pago'
import { useSondeo, useStore } from '../store'
import { comprimirImagen } from '../lib/imagen'
import { Button, GhostButton } from './ui'

/**
 * Pago con QR, como funciona hoy en el piloto:
 * el vecino escanea el QR de cobro de Caserita, paga el monto exacto desde su
 * banco, sube la captura del comprobante y nosotros la verificamos desde
 * Telegram. Mientras tanto la app pregunta cada pocos segundos si ya se
 * aceptó. Nada se marca como pagado sin que una persona lo haya revisado.
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
  const { subirComprobante, pagarAlRecoger, mostrarToast } = useStore()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [vista, setVista] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [qrRoto, setQrRoto] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)

  const estado = reserva.estadoPago
  const verificando = estado === 'verificando'
  const pagado = estado === 'pagado'

  // Mientras revisamos el comprobante, la app pregunta sola si ya se aceptó.
  useSondeo(verificando, INTERVALO_SONDEO_MS)

  const elegir = (f: File | undefined) => {
    if (!f) return
    if (!f.type.startsWith('image/')) {
      mostrarToast('Sube una imagen: la captura de pantalla de tu pago')
      return
    }
    setArchivo(f)
    setVista(URL.createObjectURL(f))
  }

  const quitar = () => {
    if (vista) URL.revokeObjectURL(vista)
    setArchivo(null)
    setVista(null)
    if (entrada.current) entrada.current.value = ''
  }

  const enviar = async () => {
    if (!archivo) return
    setEnviando(true)
    try {
      const imagen = await comprimirImagen(archivo)
      await subirComprobante(reserva.id, imagen)
      quitar()
      mostrarToast('Recibimos tu comprobante. Lo revisamos en un momento')
    } catch (e) {
      if (!(e instanceof Error && 'status' in e)) mostrarToast('No pudimos procesar la imagen')
    } finally {
      setEnviando(false)
    }
  }

  const alRecoger = async () => {
    await pagarAlRecoger(reserva.id)
    mostrarToast('Listo: pagas en efectivo cuando recojas')
    onPagarAlRecoger?.()
  }

  const chip =
    pagado
      ? 'bg-brand text-primary-foreground'
      : verificando
        ? 'bg-ambar-soft text-ambar-ink'
        : estado === 'rechazado'
          ? 'bg-card text-destructive ring-1 ring-border'
          : 'bg-card text-muted-foreground ring-1 ring-border'

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Paga con QR</p>
            <p className="mt-0.5 truncate text-sm font-bold text-ink">{reserva.bolsa?.vendedor.nombre}</p>
          </div>
          <span aria-live="polite" className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${chip}`}>
            {verificando && <Loader className="size-3.5 animate-spin" aria-hidden />}
            {pagado && <Check className="size-3.5" aria-hidden />}
            {ETIQUETA_ESTADO[estado]}
          </span>
        </div>

        {/* El QR de cobro de Caserita: el mismo para todos los pedidos. */}
        <div className="relative mt-4 grid place-items-center rounded-2xl bg-brand-soft p-4">
          {!qrRoto ? (
            <img
              src={QR_COBRO_URL}
              alt="QR de cobro de Caserita"
              onError={() => setQrRoto(true)}
              className={`w-full max-w-[260px] rounded-xl bg-white p-2 ${pagado || verificando ? 'opacity-30' : ''}`}
            />
          ) : (
            <p className="p-6 text-center text-sm font-semibold text-brand-dark">
              Pídenos el QR por WhatsApp y paga el monto exacto.
            </p>
          )}
          {pagado && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="animate-pop grid size-16 place-items-center rounded-full bg-brand text-primary-foreground">
                  <Check className="size-9" strokeWidth={3} aria-hidden />
                </span>
                <p className="text-sm font-extrabold text-brand-dark">¡Pago confirmado!</p>
              </div>
            </div>
          )}
          {verificando && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-card/90 p-4 text-center">
                <Loader className="size-8 animate-spin text-brand-dark" aria-hidden />
                <p className="text-sm font-bold text-ink">Estamos revisando tu pago</p>
                <p className="text-xs text-muted-foreground">Tarda unos minutos. Puedes cerrar esta pantalla.</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">Monto exacto</span>
          <span className="text-2xl font-extrabold text-brand">Bs {reserva.total}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">Glosa o detalle</span>
          <span className="font-mono text-sm font-extrabold text-ink">{glosaDePago(reserva.codigo)}</span>
        </div>
      </div>

      {!pagado && !verificando && (
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand-dark">
              <Upload className="size-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink">
                {estado === 'rechazado' ? 'Vuelve a subir tu comprobante' : 'Sube tu comprobante'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {estado === 'rechazado'
                  ? 'La captura anterior no coincidía. Revisa el monto y la glosa.'
                  : 'Después de pagar, la captura de pantalla de tu banco.'}
              </p>
            </div>
          </div>

          <input
            ref={entrada}
            type="file"
            accept="image/*"
            className="sr-only"
            id={`comprobante-${reserva.id}`}
            onChange={(e) => elegir(e.target.files?.[0])}
          />

          {vista ? (
            <div className="relative mt-4">
              <img src={vista} alt="Tu comprobante" className="max-h-72 w-full rounded-2xl border border-border bg-surface object-contain" />
              <button
                type="button"
                onClick={quitar}
                aria-label="Quitar imagen"
                className="tap absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-card text-ink shadow-card"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <label
              htmlFor={`comprobante-${reserva.id}`}
              className="tap mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface text-sm font-bold text-muted-foreground hover:border-brand hover:text-brand-dark"
            >
              <Upload className="size-6" aria-hidden /> Elegir la captura
            </label>
          )}

          <div className="mt-4 space-y-3">
            <Button full onClick={enviar} disabled={!archivo || enviando}>
              {enviando ? (
                <>
                  <Loader className="size-5 animate-spin" aria-hidden /> Enviando…
                </>
              ) : (
                'Enviar comprobante'
              )}
            </Button>
            <GhostButton full onClick={alRecoger}>
              Prefiero pagar en efectivo al recoger
            </GhostButton>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4">
        <ShieldCheck className="size-5 shrink-0 text-brand-dark" aria-hidden />
        <p className="text-sm font-semibold text-brand-dark">
          Tu pedido queda reservado con el código {reserva.codigo}
        </p>
      </div>

      {verificando && (
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Clock className="size-3.5" aria-hidden /> Te avisamos aquí mismo en cuanto confirmemos.
          <button type="button" onClick={() => window.location.reload()} className="tap ml-1 inline-flex items-center gap-1 underline">
            <RefreshCw className="size-3" aria-hidden /> actualizar
          </button>
        </p>
      )}

      {pagado && onPagado && (
        <Button full onClick={onPagado}>
          Listo
        </Button>
      )}
    </div>
  )
}
