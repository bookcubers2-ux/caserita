import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Gift, Leaf, Star } from 'lucide-react'

const BTN_BASE =
  'tap inline-flex items-center justify-center gap-2 rounded-[14px] px-5 py-3 text-base font-bold transition-transform active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100'

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { full?: boolean }

export function Button({ full, className = '', ...rest }: BtnProps) {
  return (
    <button
      className={`${BTN_BASE} bg-brand text-primary-foreground shadow-lift hover:bg-brand-dark ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  )
}

export function GhostButton({ full, className = '', ...rest }: BtnProps) {
  return (
    <button
      className={`${BTN_BASE} border border-border bg-card font-semibold text-ink hover:bg-brand-soft ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  )
}

export function LinkButton({
  to,
  children,
  variant = 'ghost',
}: {
  to: string
  children: ReactNode
  variant?: 'brand' | 'ghost'
}) {
  const style =
    variant === 'brand'
      ? 'bg-brand text-primary-foreground shadow-lift hover:bg-brand-dark'
      : 'border border-border bg-card text-sm font-semibold text-ink hover:bg-brand-soft'
  return (
    <Link to={to} className={`${BTN_BASE} w-full ${style}`}>
      {children}
    </Link>
  )
}

export function Chip({
  activo,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { activo?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      className={`tap inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
        activo
          ? 'border-brand bg-brand text-primary-foreground'
          : 'border-border bg-card text-ink hover:bg-brand-soft'
      }`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-border/70 ${className}`} />
}

export function BackButton({ to }: { to: string }) {
  return (
    <Link
      to={to}
      aria-label="Atrás"
      className="tap inline-flex items-center justify-center rounded-full bg-card/90 p-2.5 text-ink shadow-card backdrop-blur"
    >
      <ArrowLeft className="size-5" aria-hidden />
    </Link>
  )
}

export function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
      <Star className="size-4 fill-ambar text-ambar" aria-hidden />
      {value}
      <span className="sr-only">de 5 estrellas</span>
    </span>
  )
}

/**
 * Marca la modalidad sorpresa. Va en gris y con borde, nunca en el verde de
 * marca: es la excepción del catálogo, no lo que hay que mirar primero.
 */
export function EtiquetaSorpresa() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      <Gift className="size-3.5" aria-hidden /> Sorpresa
    </span>
  )
}

export function EcoBadge({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4">
      <Leaf className="size-5 shrink-0 text-brand-dark" aria-hidden />
      <p className="text-sm font-semibold text-brand-dark">{texto}</p>
    </div>
  )
}

export function CodigoBox({ codigo }: { codigo: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-brand/40 bg-brand-soft p-6 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-dark">
        Código de retiro
      </p>
      <p className="mt-2 font-mono text-4xl font-extrabold tracking-[0.2em] text-brand-dark">
        {codigo}
      </p>
    </div>
  )
}

export function RoleSwitch({
  rol,
  onChange,
}: {
  rol: 'comprador' | 'vendedor'
  onChange: (r: 'comprador' | 'vendedor') => void
}) {
  return (
    <div
      role="group"
      aria-label="Cambiar de rol"
      className="flex rounded-full border border-border bg-surface p-1"
    >
      {(['comprador', 'vendedor'] as const).map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={rol === r}
          onClick={() => onChange(r)}
          className={`min-h-11 flex-1 rounded-full px-4 text-sm font-bold capitalize transition-colors ${
            rol === r ? 'bg-brand text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

export function Toast({ mensaje }: { mensaje: string }) {
  // El centrado va por inset + margen automatico, NO por translate: la
  // animacion "rise" gobierna la propiedad transform y borraria el -50%.
  return (
    <div
      role="status"
      className="animate-rise fixed inset-x-0 bottom-24 z-50 mx-auto w-[min(22rem,calc(100vw-2rem))] rounded-2xl bg-ink px-4 py-3 text-center text-sm font-semibold text-background shadow-lift"
    >
      {mensaje}
    </div>
  )
}
