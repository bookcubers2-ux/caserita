import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  BolsaConVendedor,
  MetodoPago,
  Publicacion,
  ReservaConBolsa,
  Rol,
  SesionVendedor,
  Usuario,
} from './types'
import * as api from './services/api'
import { datosCliente, guardarDatosCliente } from './lib/cliente'

/** Lo que se guarda en el dispositivo: el tour visto y la sesión de la casera. */
const CLAVE_TOUR = 'caserita:tour-visto'
const CLAVE_SESION = 'caserita:sesion-vendedor'

function leerSesion(): SesionVendedor | null {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION)
    return crudo ? (JSON.parse(crudo) as SesionVendedor) : null
  } catch {
    return null
  }
}

interface Store {
  cargando: boolean
  errorRed: string | null
  reintentar: () => void
  refrescar: () => Promise<void>
  rol: Rol
  setRol: (r: Rol) => void
  usuario: Usuario | null
  guardarUsuario: (d: { nombre: string; telefono: string }) => Promise<void>
  bolsas: BolsaConVendedor[]
  bolsaPorId: (id: string) => BolsaConVendedor | undefined
  reservas: ReservaConBolsa[]
  reservaPorId: (id: string) => ReservaConBolsa | undefined
  reservar: (
    bolsaId: string,
    metodoPago: MetodoPago,
    datos: { nombre: string; telefono: string; nota?: string },
  ) => Promise<ReservaConBolsa>
  subirComprobante: (reservaId: string, imagen: string) => Promise<ReservaConBolsa>
  pagarAlRecoger: (reservaId: string) => Promise<void>
  cancelarReserva: (reservaId: string) => Promise<void>
  marcarRecogida: (reservaId: string) => Promise<void>
  calificar: (reservaId: string, estrellas: number, comentario: string) => Promise<void>
  /** Sesión de la casera (panel de vendedora). */
  sesion: SesionVendedor | null
  entrarVendedor: (pin: string) => Promise<SesionVendedor>
  salirVendedor: () => void
  publicaciones: Publicacion[]
  publicar: (datos: Omit<Publicacion, 'id' | 'vendidas' | 'estado'>) => Promise<Publicacion>
  pedidosVendedor: ReservaConBolsa[]
  cargarPedidosVendedor: () => Promise<void>
  entregarPedido: (reservaId: string) => Promise<void>
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
  const [pedidosVendedor, setPedidosVendedor] = useState<ReservaConBolsa[]>([])
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorRed, setErrorRed] = useState<string | null>(null)
  const [rol, setRol] = useState<Rol>('comprador')
  const [toast, setToast] = useState<string | null>(null)
  const [sesion, setSesion] = useState<SesionVendedor | null>(() => {
    const s = leerSesion()
    api.fijarTokenVendedor(s?.token ?? null)
    return s
  })
  const [vistoOnboarding, setVisto] = useState<boolean>(() => localStorage.getItem(CLAVE_TOUR) === 'si')
  const temporizadorToast = useRef<number | undefined>(undefined)

  const mostrarToast = useCallback((m: string) => {
    setToast(m)
    window.clearTimeout(temporizadorToast.current)
    temporizadorToast.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  const cargarVendedora = useCallback(async () => {
    if (!sesion) return
    try {
      const [p, ped] = await Promise.all([api.getPublicaciones(), api.getPedidosVendedor()])
      setPublicaciones(p)
      setPedidosVendedor(ped)
    } catch (e) {
      // Si el token venció o la demo se reinició, se cierra la sesión sin drama.
      if (e instanceof api.ErrorApi && e.status === 401) {
        localStorage.removeItem(CLAVE_SESION)
        api.fijarTokenVendedor(null)
        setSesion(null)
      }
    }
  }, [sesion])

  /** Trae todo del servidor. Es la única fuente de verdad. */
  const cargarTodo = useCallback(async () => {
    try {
      const [b, r, u] = await Promise.all([api.getBolsas(), api.getReservas(), api.getUsuario()])
      setBolsas(b)
      setReservas(r)
      setUsuario(u)
      setErrorRed(null)
      if (sesion) await cargarVendedora()
    } catch (e) {
      setErrorRed(e instanceof api.ErrorApi ? e.message : 'No pudimos cargar los datos')
    } finally {
      setCargando(false)
    }
  }, [sesion, cargarVendedora])

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
    (bolsaId: string, metodoPago: MetodoPago, datos: { nombre: string; telefono: string; nota?: string }) => {
      guardarDatosCliente({ nombre: datos.nombre, telefono: datos.telefono })
      return conRefresco(() => api.crearReserva(bolsaId, metodoPago, datos))
    },
    [conRefresco],
  )

  const subirComprobante = useCallback(
    (reservaId: string, imagen: string) => conRefresco(() => api.subirComprobante(reservaId, imagen)),
    [conRefresco],
  )

  const pagarAlRecoger = useCallback(
    async (reservaId: string) => {
      await conRefresco(() => api.pagarAlRecoger(reservaId))
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

  const calificar = useCallback(
    async (reservaId: string, estrellas: number, comentario: string) => {
      await conRefresco(() => api.calificarApi(reservaId, estrellas, comentario))
    },
    [conRefresco],
  )

  const guardarUsuario = useCallback(
    async (d: { nombre: string; telefono: string }) => {
      guardarDatosCliente(d)
      await conRefresco(() => api.actualizarUsuario(d))
    },
    [conRefresco],
  )

  const entrarVendedor = useCallback(
    async (pin: string) => {
      try {
        const s = await api.entrarVendedor(pin)
        localStorage.setItem(CLAVE_SESION, JSON.stringify(s))
        api.fijarTokenVendedor(s.token)
        setSesion(s)
        return s
      } catch (e) {
        mostrarToast(e instanceof api.ErrorApi ? e.message : 'No pudimos entrar')
        throw e
      }
    },
    [mostrarToast],
  )

  const salirVendedor = useCallback(() => {
    localStorage.removeItem(CLAVE_SESION)
    api.fijarTokenVendedor(null)
    setSesion(null)
    setPublicaciones([])
    setPedidosVendedor([])
    setRol('comprador')
  }, [])

  const publicar = useCallback(
    (datos: Omit<Publicacion, 'id' | 'vendidas' | 'estado'>) => conRefresco(() => api.crearPublicacion(datos)),
    [conRefresco],
  )

  const cargarPedidosVendedor = useCallback(async () => {
    if (!sesion) return
    try {
      setPedidosVendedor(await api.getPedidosVendedor())
    } catch {
      // se reintenta en el siguiente sondeo
    }
  }, [sesion])

  const entregarPedido = useCallback(
    async (reservaId: string) => {
      await conRefresco(() => api.entregarPedido(reservaId))
    },
    [conRefresco],
  )

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

  const refrescar = useCallback(async () => {
    try {
      await cargarTodo()
    } catch {
      // silencioso: es un sondeo
    }
  }, [cargarTodo])

  const value = useMemo(
    () => ({
      cargando,
      errorRed,
      reintentar,
      refrescar,
      rol,
      setRol,
      usuario,
      guardarUsuario,
      bolsas,
      bolsaPorId,
      reservas,
      reservaPorId,
      reservar,
      subirComprobante,
      pagarAlRecoger,
      cancelarReserva,
      marcarRecogida,
      calificar,
      sesion,
      entrarVendedor,
      salirVendedor,
      publicaciones,
      publicar,
      pedidosVendedor,
      cargarPedidosVendedor,
      entregarPedido,
      vistoOnboarding,
      marcarOnboardingVisto,
      reiniciarDemo,
      toast,
      mostrarToast,
    }),
    [
      cargando, errorRed, reintentar, refrescar, rol, usuario, guardarUsuario, bolsas, bolsaPorId,
      reservas, reservaPorId, reservar, subirComprobante, pagarAlRecoger, cancelarReserva,
      marcarRecogida, calificar, sesion, entrarVendedor, salirVendedor, publicaciones, publicar,
      pedidosVendedor, cargarPedidosVendedor, entregarPedido, vistoOnboarding, marcarOnboardingVisto,
      reiniciarDemo, toast, mostrarToast,
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

/** Usuario listo para pintar, con los datos locales si el servidor aún no respondió. */
// eslint-disable-next-line react-refresh/only-export-components
export function useUsuario(): Usuario {
  const u = useStore().usuario
  if (u) return u
  const d = datosCliente()
  return { ...USUARIO_VACIO, nombre: d.nombre, telefono: d.telefono }
}

/**
 * Sondeo: mientras `activo` sea verdadero, vuelve a pedir los datos cada
 * `cadaMs`. Se usa cuando hay un pago en verificación o una casera esperando pedidos.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useSondeo(activo: boolean, cadaMs: number, accion?: () => Promise<void>) {
  const { refrescar } = useStore()
  useEffect(() => {
    if (!activo) return
    const fn = accion ?? refrescar
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') fn()
    }, cadaMs)
    return () => window.clearInterval(t)
  }, [activo, cadaMs, accion, refrescar])
}
