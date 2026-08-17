import { Link, NavLink } from 'react-router-dom'
import { House, Leaf, Map, MapPin, Receipt, Store, User } from 'lucide-react'
import { useUsuario } from '../store'
import Logotipo from './Logotipo'

const ITEMS = [
  { to: '/', label: 'Inicio', Icon: House },
  { to: '/mapa', label: 'Mapa', Icon: Map },
  { to: '/pedidos', label: 'Pedidos', Icon: Receipt },
  { to: '/perfil', label: 'Perfil', Icon: User },
]

/** Navegacion de escritorio. Oculta en telefono (ahi manda BottomNav). */
export default function Sidebar() {
  const usuario = useUsuario()

  return (
    // overflow-y-auto: en laptops bajitas (1366x768 con zoom) el bloque de
    // abajo quedaba fuera de la ventana y era inalcanzable, porque el aside
    // es sticky y no acompaña el scroll de la página.
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-[264px] lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-border lg:bg-card lg:px-5 lg:py-7">
      <Link to="/" className="block">
        <Logotipo className="text-2xl text-brand" />
        <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-4 text-ubicacion" aria-hidden /> Santa Cruz
        </p>
      </Link>

      <nav aria-label="Navegación" className="mt-8 flex flex-col gap-1">
        {ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `tap flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-brand-soft text-brand-dark'
                  : 'text-muted-foreground hover:bg-surface hover:text-ink'
              }`
            }
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <Link
        to="/vendedor"
        className="tap mt-6 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-primary-foreground shadow-lift transition-transform hover:bg-brand-dark active:scale-[0.98]"
      >
        <Store className="size-4" aria-hidden /> Vender mi excedente
      </Link>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl bg-brand-soft p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark">
            <Leaf className="size-3.5" aria-hidden /> Tu impacto
          </p>
          <p className="mt-2 text-2xl font-extrabold leading-none text-brand-dark">
            {usuario.comidasRescatadas}
          </p>
          <p className="text-xs text-brand-dark">comidas rescatadas</p>
          <div className="mt-3 flex gap-4 border-t border-brand/15 pt-3 text-xs text-brand-dark">
            <span>
              <b className="block text-sm font-extrabold text-brand-dark">
                {usuario.kgCO2Evitado} kg
              </b>
              CO₂ evitado
            </span>
            <span>
              <b className="block text-sm font-extrabold text-brand-dark">
                Bs {usuario.bsAhorrados}
              </b>
              ahorrados
            </span>
          </div>
        </div>

        <Link
          to="/perfil"
          className="tap flex items-center gap-3 rounded-2xl border border-border p-3 hover:bg-surface"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-extrabold text-primary-foreground">
            {usuario.nombre.charAt(0)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-ink">{usuario.nombre}</span>
            <span className="block truncate text-xs text-muted-foreground">{usuario.telefono}</span>
          </span>
        </Link>
      </div>
    </aside>
  )
}
