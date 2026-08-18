import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, CircleHelp, MapPin, RotateCcw, Wallet } from 'lucide-react'
import { useStore, useUsuario } from '../store'
import { useTitulo } from '../lib/useTitulo'
import Logotipo from '../components/Logotipo'
import { LinkButton, RoleSwitch } from '../components/ui'

const OPCIONES = [
  { Icon: Wallet, label: 'Métodos de pago · QR Simple y efectivo' },
  { Icon: Bell, label: 'Notificaciones de bolsas cerca' },
  { Icon: CircleHelp, label: 'Ayuda y contacto' },
]

export default function Perfil() {
  const { rol, setRol, mostrarToast, reiniciarDemo } = useStore()
  const usuario = useUsuario()
  const navigate = useNavigate()

  useTitulo(
    'Mi perfil e impacto · Caserita',
    'Tu impacto acumulado, métodos de pago y ajustes de Caserita.',
  )

  const cambiarRol = (r: 'comprador' | 'vendedor') => {
    setRol(r)
    if (r === 'vendedor') navigate('/vendedor')
  }

  return (
    <div className="animate-rise pagina space-y-6 px-4 pb-6 pt-5">
      <h1 className="text-xl font-extrabold text-ink lg:text-3xl">Perfil</h1>

      <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="space-y-6 lg:rounded-3xl lg:border lg:border-border lg:bg-card lg:p-6 lg:shadow-card">
          <div className="flex items-center gap-4 lg:flex-col lg:text-center">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand text-xl font-extrabold text-primary-foreground lg:size-20 lg:text-2xl">
              {usuario.nombre.charAt(0)}
            </span>
            <div className="min-w-0 lg:w-full">
              <p className="truncate text-lg font-bold text-ink">{usuario.nombre}</p>
              <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4 text-ubicacion" aria-hidden /> {usuario.ciudad}
              </p>
              <p className="text-sm text-muted-foreground">{usuario.telefono}</p>
            </div>
          </div>

          <RoleSwitch rol={rol} onChange={cambiarRol} />
        </div>

        <div className="mt-6 space-y-6 lg:mt-0">
          <section className="rounded-2xl bg-brand-soft p-4 lg:p-6">
            <h2 className="text-sm font-bold text-brand-dark lg:text-base">Tu impacto</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center lg:mt-5 lg:gap-6">
              <div>
                <p className="text-xl font-extrabold text-brand-dark lg:text-3xl">
                  {usuario.comidasRescatadas}
                </p>
                <p className="text-xs text-brand-dark">comidas rescatadas</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-brand-dark lg:text-3xl">
                  {usuario.kgCO2Evitado} kg
                </p>
                <p className="text-xs text-brand-dark">CO₂ evitado</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-brand-dark lg:text-3xl">
                  Bs {usuario.bsAhorrados}
                </p>
                <p className="text-xs text-brand-dark">ahorrados</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {OPCIONES.map(({ Icon, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => mostrarToast('Disponible en la próxima versión')}
                className="tap flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-b-0 hover:bg-surface"
              >
                <Icon className="size-5 shrink-0 text-brand-dark" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                  {label}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            ))}
          </section>

          <div className="space-y-3 lg:max-w-sm">
            <LinkButton to="/onboarding">Ver el tour de Caserita otra vez</LinkButton>
            <button
              type="button"
              onClick={() => {
                reiniciarDemo()
                mostrarToast('Datos de la demo reiniciados')
                navigate('/')
              }}
              className="tap inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-border bg-card px-5 py-3 text-sm font-semibold text-muted-foreground transition-transform hover:bg-surface active:scale-[0.98]"
            >
              <RotateCcw className="size-4" aria-hidden /> Reiniciar datos de la demo
            </button>
          </div>

          {/* Firma de marca, la misma frase con la que cierra el pitch. */}
          <div className="pt-2 text-center">
            <Logotipo conSimbolo className="text-lg text-brand" />
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              La comida que hoy se bota, mañana es un mercado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
