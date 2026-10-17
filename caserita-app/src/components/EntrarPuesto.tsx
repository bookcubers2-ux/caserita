import { useState } from 'react'
import { KeyRound, Store } from 'lucide-react'
import { useStore } from '../store'
import { Button } from './ui'

/**
 * Puerta del panel de la casera: entra con el código de 4 números de su
 * puesto (va impreso en su cartel). No hay usuarios ni contraseñas que
 * recordar: un puesto, un código.
 */
export default function EntrarPuesto({ onEntro }: { onEntro?: () => void }) {
  const { entrarVendedor } = useStore()
  const [pin, setPin] = useState('')
  const [enviando, setEnviando] = useState(false)

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length < 4) return
    setEnviando(true)
    try {
      await entrarVendedor(pin)
      onEntro?.()
    } catch {
      setPin('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={entrar} className="mx-auto max-w-sm space-y-5 rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-dark">
          <Store className="size-7" aria-hidden />
        </span>
        <h2 className="mt-3 text-lg font-extrabold text-ink">Entra a tu puesto</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escribe el código de 4 números que está en tu cartel de Caserita.
        </p>
      </div>

      <label className="block">
        <span className="sr-only">Código del puesto</span>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4">
          <KeyRound className="size-5 shrink-0 text-brand-dark" aria-hidden />
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="• • • •"
            className="min-h-14 w-full bg-transparent text-center font-mono text-3xl font-extrabold tracking-[0.5em] text-ink placeholder:tracking-[0.3em] placeholder:text-border focus:outline-none"
          />
        </div>
      </label>

      <Button full type="submit" disabled={pin.length < 4 || enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        ¿No tienes código? Escríbenos por WhatsApp y te registramos en tu puesto.
      </p>
    </form>
  )
}
