import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, CircleHelp, LogOut, MapPin, Phone, RotateCcw, Store, UserRound, Wallet } from 'lucide-react'
import { useStore, useUsuario } from '../store'
import { useTitulo } from '../lib/useTitulo'
import { modoDemo } from '../services/api'
import Logotipo from '../components/Logotipo'
import { Button, LinkButton, RoleSwitch } from '../components/ui'

const OPCIONES = [
  { Icon: Wallet, label: 'Pagos: QR de Caserita o efectivo al recoger' },
  { Icon: CircleHelp, label: 'Ayuda y contacto por WhatsApp' },
]

export default function Perfil() {
  const { rol, setRol, mostrarToast, reiniciarDemo, guardarUsuario, sesion, salirVendedor } = useStore()
  const usuario = useUsuario()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState(usuario.nombre)
  const [telefono, setTelefono] = useState(usuario.telefono)
  const [guardando, setGuardando] = useState(false)

  useTitulo('Mi perfil e impacto · Caserita', 'Tus datos para recoger, tu impacto acumulado y los ajustes de Caserita.')

  const cambiarRol = (r: 'comprador' | 'vendedor') => {
    setRol(r)
    if (r === 'vendedor') navigate('/vendedor')
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await guardarUsuario({ nombre: nombre.trim(), telefono: telefono.trim() })
      mostrarToast('Datos guardados')
    } finally {
      setGuardando(false)
    }
  }

  const sucio = nombre.trim() !== usuario.nombre || telefono.trim() !== usuario.telefono

  return (
    <div className="animate-rise pagina space-y-6 px-4 pb-6 pt-5">
      <h1 className="text-xl font-extrabold text-ink lg:text-3xl">Perfil</h1>

      <div className="lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="space-y-6 lg:rounded-3xl lg:border lg:border-border lg:bg-card lg:p-6 lg:shadow-card">
          <form onSubmit={guardar} className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand text-xl font-extrabold text-primary-foreground">
                {(nombre || 'V').charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-ink">{nombre || 'Vecino de Caserita'}</p>
                <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4 text-ubicacion" aria-hidden /> {usuario.ciudad}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tu nombre y celular los ve solo la casera, para saber a quién entrega.
            </p>
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4">
              <UserRound className="size-5 shrink-0 text-brand-dark" aria-hidden />
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value.slice(0, 60))}
                placeholder="Tu nombre"
                autoComplete="name"
                className="min-h-12 w-full bg-transparent text-sm font-semibold text-ink placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4">
              <Phone className="size-5 shrink-0 text-brand-dark" aria-hidden />
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.slice(0, 30))}
                placeholder="Tu celular"
                inputMode="tel"
                autoComplete="tel"
                className="min-h-12 w-full bg-transparent text-sm font-semibold text-ink placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
            {sucio && (
              <Button full type="submit" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar mis datos'}
              </Button>
            )}
          </form>

          <RoleSwitch rol={rol} onChange={cambiarRol} />

          {sesion && (
            <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4">
              <Store className="size-5 shrink-0 text-brand-dark" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-brand-dark">{sesion.vendedor.nombre}</p>
                <p className="text-xs text-brand-dark">Sesión de casera abierta en este celular</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  salirVendedor()
                  mostrarToast('Saliste de tu puesto')
                }}
                className="tap inline-flex items-center gap-1 text-xs font-bold text-brand-dark underline underline-offset-4"
              >
                <LogOut className="size-3.5" aria-hidden /> Salir
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-6 lg:mt-0">
          <section className="rounded-2xl bg-brand-soft p-4 lg:p-6">
            <h2 className="text-sm font-bold text-brand-dark lg:text-base">Tu impacto</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center lg:mt-5 lg:gap-6">
              <div>
                <p className="text-xl font-extrabold text-brand-dark lg:text-3xl">{usuario.comidasRescatadas}</p>
                <p className="text-xs text-brand-dark">comidas rescatadas</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-brand-dark lg:text-3xl">{usuario.kgCO2Evitado} kg</p>
                <p className="text-xs text-brand-dark">CO₂ evitado</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-brand-dark lg:text-3xl">Bs {usuario.bsAhorrados}</p>
                <p className="text-xs text-brand-dark">ahorrados</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {OPCIONES.map(({ Icon, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => mostrarToast('Escríbenos por WhatsApp y te ayudamos')}
                className="tap flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-b-0 hover:bg-surface"
              >
                <Icon className="size-5 shrink-0 text-brand-dark" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{label}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            ))}
          </section>

          <div className="space-y-3 lg:max-w-sm">
            <LinkButton to="/vendedor/pedidos">Soy casera: ver los pedidos de mi puesto</LinkButton>
            <LinkButton to="/onboarding">Ver el tour de Caserita otra vez</LinkButton>
            {modoDemo && (
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
            )}
          </div>

          <div className="pt-2 text-center">
            <Logotipo conSimbolo className="text-lg text-brand" />
            <p className="mt-1 text-xs font-semibold text-muted-foreground">Comida buena, barata y sin desperdicio.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
