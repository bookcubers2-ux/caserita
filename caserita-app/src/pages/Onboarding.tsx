import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HandCoins, ShoppingBasket, Store } from 'lucide-react'
import { useStore } from '../store'
import { useTitulo } from '../lib/useTitulo'
import Logotipo from '../components/Logotipo'
import { Button, GhostButton } from '../components/ui'

const PASOS = [
  {
    Icon: ShoppingBasket,
    titulo: 'Rescata comida buena',
    texto:
      'Panaderías, pensiones y cafés de Santa Cruz publican lo que les sobró en buen estado al final del día.',
  },
  {
    Icon: HandCoins,
    titulo: 'A mitad de precio',
    texto:
      'Comida del día desde Bs 7. Ves qué es antes de reservar y pagás al recoger, en efectivo o con QR Simple.',
  },
  {
    Icon: Store,
    titulo: 'Publica en un toque',
    texto: '¿Tienes un negocio? Publica tu excedente en segundos o mándanos un WhatsApp.',
  },
]

export default function Onboarding() {
  const [i, setI] = useState(0)
  const navigate = useNavigate()
  const { marcarOnboardingVisto } = useStore()
  const { Icon, titulo, texto } = PASOS[i]
  const ultimo = i === PASOS.length - 1

  useTitulo(
    'Bienvenido a Caserita · Comida rescatada en Santa Cruz',
    'Rescata comida buena, paga la mitad y publica tu excedente en un toque.',
  )

  const entrar = () => {
    marcarOnboardingVisto()
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-6 pb-10 pt-16 shadow-card lg:max-w-xl lg:justify-center lg:px-14">
      {/* Franja aguayo de la identidad: verde · naranja · amarillo · rosa. */}
      <div className="mb-6 flex h-1.5 overflow-hidden rounded-full" aria-hidden>
        <span className="flex-1 bg-brand" />
        <span className="flex-1 bg-naranja" />
        <span className="flex-1 bg-ambar" />
        <span className="flex-1 bg-rosa" />
      </div>

      <Logotipo className="text-2xl text-brand" />

      <div key={i} className="animate-rise mt-10 flex-1">
        <div className="grid size-20 place-items-center rounded-3xl bg-brand-soft text-brand-dark">
          <Icon className="size-10" aria-hidden />
        </div>
        <h1 className="mt-8 text-3xl font-extrabold leading-tight text-ink">{titulo}</h1>
        <p className="mt-3 text-base text-muted-foreground">{texto}</p>
      </div>

      <div className="mb-6 flex gap-2" aria-hidden>
        {PASOS.map((p, n) => (
          <span
            key={p.titulo}
            className={`h-1.5 flex-1 rounded-full ${n <= i ? 'bg-brand' : 'bg-border'}`}
          />
        ))}
      </div>

      <div className="space-y-3">
        <Button full onClick={() => (ultimo ? entrar() : setI(i + 1))}>
          {ultimo ? 'Empezar' : 'Siguiente'}
        </Button>
        {!ultimo && (
          <GhostButton full onClick={entrar}>
            Saltar
          </GhostButton>
        )}
        {/* La frase de marca, igual que en el cierre del pitch. */}
        <p className="pt-2 text-center text-xs font-semibold text-muted-foreground">
          La comida que hoy se bota, mañana es un mercado.
        </p>
      </div>
    </div>
  )
}
