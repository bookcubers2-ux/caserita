import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Sidebar from './components/Sidebar'
import ScrollAlTope from './components/ScrollAlTope'
import { Toast } from './components/ui'
import { useStore } from './store'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Detalle from './pages/Detalle'
import Pago from './pages/Pago'
import Reserva from './pages/Reserva'
import Mapa from './pages/Mapa'
import Pedidos from './pages/Pedidos'
import Perfil from './pages/Perfil'
import Vendedor from './pages/Vendedor'
import VendedorHoy from './pages/VendedorHoy'
import DeliveryPage from './pages/Delivery'
import NoEncontrado from './pages/NoEncontrado'

/**
 * Un solo marco para las dos interfaces:
 * telefono = columna unica con barra inferior;
 * computadora (lg+) = barra lateral fija + contenido ancho.
 */
function Shell({ conNav = false }: { conNav?: boolean }) {
  return (
    <div className="lg:flex lg:items-start">
      <Sidebar />
      <main className={`shell shadow-card lg:shadow-none ${conNav ? 'pb-24 lg:pb-0' : ''}`}>
        <Outlet />
      </main>
      {conNav && <BottomNav />}
    </div>
  )
}

/** La primera visita entra por el tour; despues nunca mas estorba. */
function GuardiaOnboarding({ children }: { children: React.ReactNode }) {
  const { vistoOnboarding } = useStore()
  const { pathname } = useLocation()

  if (!vistoOnboarding && pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return <>{children}</>
}

/** Si el backend no responde, hay que decirlo en vez de mostrar una app vacía. */
function AvisoSinServidor() {
  const { errorRed, reintentar, cargando } = useStore()
  if (!errorRed || cargando) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[800] mx-auto flex w-full max-w-md items-center gap-3 bg-ink px-4 py-2.5 text-xs font-semibold text-background lg:max-w-none"
    >
      <span className="min-w-0 flex-1">{errorRed}</span>
      <button
        type="button"
        onClick={reintentar}
        className="tap shrink-0 rounded-full bg-background/15 px-3 py-1 font-bold"
      >
        Reintentar
      </button>
    </div>
  )
}

export default function App() {
  const { toast } = useStore()

  return (
    <>
      <ScrollAlTope />
      <AvisoSinServidor />
      <GuardiaOnboarding>
        <Routes>
          <Route element={<Shell conNav />}>
            <Route path="/" element={<Home />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>

          <Route element={<Shell />}>
            <Route path="/bolsa/:id" element={<Detalle />} />
            <Route path="/pago/:id" element={<Pago />} />
            <Route path="/reserva/:id" element={<Reserva />} />
            <Route path="/vendedor" element={<Vendedor />} />
            <Route path="/vendedor/hoy" element={<VendedorHoy />} />
            <Route path="/delivery/:id" element={<DeliveryPage />} />
          </Route>

          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </GuardiaOnboarding>

      {toast && <Toast mensaje={toast} />}
    </>
  )
}
