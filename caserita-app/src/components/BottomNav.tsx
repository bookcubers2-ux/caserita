import { NavLink } from 'react-router-dom'
import { House, Map, Receipt, User } from 'lucide-react'

const ITEMS = [
  { to: '/', label: 'Inicio', Icon: House },
  { to: '/mapa', label: 'Mapa', Icon: Map },
  { to: '/pedidos', label: 'Pedidos', Icon: Receipt },
  { to: '/perfil', label: 'Perfil', Icon: User },
]

export default function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `tap flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold ${
                  isActive ? 'text-brand' : 'text-muted-foreground'
                }`
              }
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
