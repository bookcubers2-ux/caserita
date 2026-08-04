import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { ReservaConBolsa } from '../types'
import PanelPagoQr from './PanelPagoQr'

/**
 * Modal de cobro. Se abre desde cualquier reserva pendiente.
 * En telefono sube desde abajo (hoja); en escritorio es un dialogo centrado.
 */
export default function ModalPagoQr({
  reserva,
  onCerrar,
}: {
  reserva: ReservaConBolsa
  onCerrar: () => void
}) {
  // Cerrar con Escape y bloquear el scroll de fondo.
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPresionar)
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.body.style.overflow = previo
    }
  }, [onCerrar])

  // Portal al body: si el modal viviera dentro de un contenedor animado, el
  // transform de la animacion lo convertiria en el marco de referencia de
  // "position: fixed" y la hoja quedaria descolocada.
  return createPortal(
    <div className="fixed inset-0 z-[900] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Pagar Bs ${reserva.total} con QR Simple`}
        className="animate-rise relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lift sm:rounded-3xl sm:pb-4"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-lg font-extrabold text-ink">Pagar con QR</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="tap grid size-9 shrink-0 place-items-center rounded-full bg-card text-ink shadow-card hover:bg-background"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <PanelPagoQr reserva={reserva} onPagado={onCerrar} onPagarAlRecoger={onCerrar} />
      </div>
    </div>,
    document.body,
  )
}
