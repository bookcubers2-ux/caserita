import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  BolsaConVendedor,
  Delivery,
  EstadoPago,
  MetodoPago,
  PasoDelivery,
  Publicacion,
  ReservaConBolsa,
  Rol,
  Usuario,
} from './types'
import * as api from './services/api'

/** Ritmo del seguimiento de delivery, en segundos desde que se pidió. */
const FASE_EN_CAMINO = 15
const FASE_ENTREGADO = 75

export function calcularPaso(creadoEn: number, ahora = Date.now()): PasoDelivery {
  const seg = (ahora - creadoEn) / 1000
  if (seg < FASE_EN_CAMINO) return 'preparando'
  if (seg < FASE_ENTREGADO) return 'en_camino'
  return 'entregado'
}

export function calcularEta(creadoEn: number, ahora = Date.now()): number {
  return Math.max(0, Math.ceil((FASE_ENTREGADO - (ahora - creadoEn) / 1000) / 5))
}

/** Lo único que se guarda en el dispositivo: si ya viste el tour. */
const CLAVE_TOUR = 'caserita:tour-visto'

interface Store {
  cargando: boolean
  errorRed: string | null
  reintentar: () => void
  rol: Rol
  setRol: (r: Rol) => void
  usuario: Usuario | null
  bolsas: BolsaConVendedor[]
  bolsaPorId: (id: string) => BolsaConVendedor | undefined
  reservas: ReservaConBolsa[]
  reservaPorId: (id: string) => ReservaConBolsa | undefined
  reservar: (bolsaId: string, metodoPago: MetodoPago) => Promise<ReservaConBolsa>
  marcarPago: (reservaId: string, estado: EstadoPago, referencia?: string) => Promise<void>
  cancelarReserva: (reservaId: string) => Promise<void>
  marcarRecogida: (reservaId: string) => Promise<void>
  publicaciones: Publicacion[]
  publicar: (datos: Omit<Publicacion, 'id' | 'vendidas' | 'estado'>) => Promise<Publicacion>
  pedirDelivery: (reservaId: string) => Promise<Delivery>
  vistoOnboarding: boolean
  marcarOnboardingVisto: () => void
  reiniciarDemo: () => Promise<void>
  toast: string | null
  mostrarToast: (m: string) => void
}

const Ctx = createContext<Store | null>(null)

const USUARIO_VACIO: Usuario = {
  id: 'u1',
  nombre: '',
  ciudad: 'Santa Cruz de la Sierra',
  telefono: '',
  comidasRescatadas: 0,
  comidasEsteMes: 0,
  kgCO2Evitado: 0,
  bsAhorrados: 0,
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [bolsas, setBolsas] = useState<BolsaConVendedor[]>([])
  const [reservas, setReservas] = useState<ReservaConBolsa[]>([])
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorRed, setErrorRed] = useState<string | null>(null)
  const [rol, setRol] = useState<Rol>('comprador')
  const [toast, setToast] = useState<string | null>(null)
  const [vistoOnboarding, setVisto] = useState<boolean>(
    () => localStorage.getItem(CLAVE_TOUR) === 'si',
  )
  const temporizadorToast = useRef<number | undefined>(undefined)

  const mostrarToast = useCallback((m: string) => {
    setToast(m)
    window.clearTimeout(temporizadorToast.current)
    temporizadorToast.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  /** Trae todo del servidor. Es la única fuente de verdad. */
  const cargarTodo = useCallback(async () => {
    try {
      const [b, r, p, u] = await Promise.all([
        api.getBolsas(),
        api.getReservas(),
        api.getPublicaciones(),
        api.getUsuario(),
      ])
      setBolsas(b)
      setReservas(r)
      setPublicaciones(p)
      setUsuario(u)
      setErrorRed(null)
    } catch (e) {
      setErrorRed(e instanceof api.ErrorApi ? e.message : 'No pudimos cargar los datos')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarTodo()
  }, [cargarTodo])

  useEffect(() => () => window.clearTimeout(temporizadorToast.current), [])

  /** Envuelve una acción: la ejecuta, refresca y traduce el error a un aviso. */
  const conRefresco = useCallback(
    async <T,>(accion: () => Promise<T>): Promise<T> => {
      try {
        const resultado = await accion()
        await cargarTodo()
        return resultado
      } catch (e) {
        const msg = e instanceof api.ErrorApi ? e.message : 'Algo salió mal'
        mostrarToast(msg)
        throw e
      }
    },
    [cargarTodo, mostrarToast],
  )

  const bolsaPorId = useCallback((id: string) => bolsas.find((b) => b.id === id), [bolsas])
  const reservaPorId = useCallback((id: string) => reservas.find((r) => r.id === id), [reservas])

  const reservar = useCallback(
    (bolsaId: string, metodoPago: MetodoPago) =>
      conRefresco(() => api.crearReserva(bolsaId, metodoPago)),
    [conRefresco],
  )

  const marcarPago = useCallback(
    async (reservaId: string, estado: EstadoPago, referencia?: string) => {
      await conRefresco(() => api.actualizarPago(reservaId, estado, referencia))
    },
    [conRefresco],
  )

  const cancelarReserva = useCallback(
    async (reservaId: string) => {
      await conRefresco(() => api.cancelarReservaApi(reservaId))
    },
    [conRefresco],
  )

  const marcarRecogida = useCallback(
    async (reservaId: string) => {
      await conRefresco(() => api.marcarRecogidaApi(reservaId))
    },
    [conRefresco],
  )

  const publicar = useCallback(
    (datos: Omit<Publicacion, 'id' | 'vendidas' | 'estado'>) =>
      conRefresco(() => api.crearPublicacion(datos)),
    [conRefresco],
  )

  const pedirDelivery = useCallback((reservaId: string) => api.crearDelivery(reservaId), [])

  const marcarOnboardingVisto = useCallback(() => {
    localStorage.setItem(CLAVE_TOUR, 'si')
    setVisto(true)
  }, [])

  const reiniciarDemo = useCallback(async () => {
    await conRefresco(() => api.reiniciarServidor())
  }, [conRefresco])

  const reintentar = useCallback(() => {
    setCargando(true)
    cargarTodo()
  }, [cargarTodo])

  const value = useMemo(
    () => ({
      cargando,
      errorRed,
      reintentar,
      rol,
      setRol,
      usuario,
      bolsas,
      bolsaPorId,
      reservas,
      reservaPorId,
      reservar,
      marcarPago,
      cancelarReserva,
      marcarRecogida,
      publicaciones,
      publicar,
      pedirDelivery,
      vistoOnboarding,
      marcarOnboardingVisto,
      reiniciarDemo,
      toast,
      mostrarToast,
    }),
    [
      cargando,
      errorRed,
      reintentar,
      rol,
      usuario,
      bolsas,
      bolsaPorId,
      reservas,
      reservaPorId,
      reservar,
      marcarPago,
      cancelarReserva,
      marcarRecogida,
      publicaciones,
      publicar,
      pedirDelivery,
      vistoOnboarding,
      marcarOnboardingVisto,
      reiniciarDemo,
      toast,
      mostrarToast,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): Store {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore debe usarse dentro de StoreProvider')
  return c
}

/** Usuario listo para pintar, sin tener que comprobar null en cada pantalla. */
// eslint-disable-next-line react-refresh/only-export-components
export function useUsuario(): Usuario {
  return useStore().usuario ?? USUARIO_VACIO
}
