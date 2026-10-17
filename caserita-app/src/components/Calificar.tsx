import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Star, X } from 'lucide-react'
import type { ReservaConBolsa } from '../types'
import { useStore } from '../store'
import { Button } from './ui'

/** Estrellas para elegir (1 a 5). */
export function Estrellas({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Estrellas" className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
          onClick={() => onChange(n)}
          className="tap rounded-full p-1 transition-transform active:scale-90"
        >
          <Star className={`size-9 ${n <= valor ? 'fill-ambar text-ambar' : 'text-border'}`} aria-hidden />
        </button>
      ))}
    </div>
  )
}

const TEXTO: Record<number, string> = {
  1: 'Mal, no volvería',
  2: 'Regular',
  3: 'Bien',
  4: 'Muy bien',
  5: '¡Excelente, casera!',
}

/** Hoja para calificar a la casera después de recoger el pedido. */
export default function Calificar({ reserva, onCerrar }: { reserva: ReservaConBolsa; onCerrar: () => void }) {
  const { calificar, mostrarToast } = useStore()
  const [estrellas, setEstrellas] = useState(reserva.calificacion?.estrellas ?? 0)
  const [comentario, setComentario] = useState(reserva.calificacion?.comentario ?? '')
  const [enviando, setEnviando] = useState(false)

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

  const enviar = async () => {
    if (!estrellas) {
      mostrarToast('Elige cuántas estrellas le das')
      return
    }
    setEnviando(true)
    try {
      await calificar(reserva.id, estrellas, comentario.trim())
      mostrarToast('¡Gracias! Tu opinión ayuda a otros vecinos')
      onCerrar()
    } finally {
      setEnviando(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[900] flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 bg-ink/45 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Calificar a la casera"
        className="animate-rise relative w-full max-w-md rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lift sm:rounded-3xl sm:pb-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-lg font-extrabold text-ink">¿Cómo te fue?</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="tap grid size-9 place-items-center rounded-full bg-card text-ink shadow-card">
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          {reserva.bolsa?.titulo} · <b className="text-ink">{reserva.bolsa?.vendedor.nombre}</b>
        </p>

        <div className="mt-5">
          <Estrellas valor={estrellas} onChange={setEstrellas} />
          <p className="mt-2 min-h-5 text-center text-sm font-bold text-brand-dark">{estrellas ? TEXTO[estrellas] : ' '}</p>
        </div>

        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value.slice(0, 300))}
          rows={3}
          placeholder="Cuéntale algo a la casera o a otros vecinos (opcional)"
          className="mt-3 w-full resize-none rounded-2xl border border-border bg-card p-3 text-sm text-ink placeholder:text-muted-foreground focus:border-brand focus:outline-none"
        />

        <div className="mt-4">
          <Button full onClick={enviar} disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar calificación'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
