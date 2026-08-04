import { MapPinOff } from 'lucide-react'
import { useTitulo } from '../lib/useTitulo'
import { LinkButton } from '../components/ui'

export default function NoEncontrado() {
  useTitulo('Página no encontrada · Caserita')

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-20 place-items-center rounded-3xl bg-brand-soft text-brand-dark">
        <MapPinOff className="size-9" aria-hidden />
      </span>
      <h1 className="text-2xl font-extrabold text-ink">Esta página no existe</h1>
      <p className="text-sm text-muted-foreground">
        El enlace que abriste no lleva a ninguna parte. Vuelve al inicio para ver las bolsas
        disponibles hoy en Santa Cruz.
      </p>
      <div className="mt-2 w-full space-y-3">
        <LinkButton to="/" variant="brand">
          Ir al inicio
        </LinkButton>
        <LinkButton to="/mapa">Ver el mapa</LinkButton>
      </div>
    </div>
  )
}
