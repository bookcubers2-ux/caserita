import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, Minus, Plus } from 'lucide-react'
import type { BolsaConVendedor } from '../types'
import { CENTRO_SCZ, UBICACION_USUARIO } from '../data/seed'

/**
 * Mapa real de Santa Cruz de la Sierra, navegable como en Uber o PedidosYa:
 * se arrastra, se hace zoom con rueda o pinza, tiene controles y boton de
 * "mi ubicacion" con geolocalizacion real del navegador.
 *
 * Cartografia: CARTO Positron sobre datos de OpenStreetMap. Es el estilo
 * gris minimalista que usan las apps de delivery para que los pines de marca
 * resalten sobre el mapa.
 */

/**
 * Los iconos se cachean por (negocio, precio, activo): construir un divIcon
 * nuevo en cada render obliga a react-leaflet a rehacer el DOM del marcador,
 * lo que corta las animaciones y quema CPU en pantallas que refrescan seguido.
 */
const cachePines = new Map<string, L.DivIcon>()

function pinPrecio(negocio: string, precio: number, activo: boolean) {
  const clave = `${negocio}|${precio}|${activo}`
  const guardado = cachePines.get(clave)
  if (guardado) return guardado

  const pill = activo
    ? 'bg-brand-dark text-primary-foreground ring-2 ring-white'
    : 'bg-white text-brand-dark ring-1 ring-black/5'
  const tail = activo ? 'bg-brand-dark' : 'bg-white'
  const icono = L.divIcon({
    className: 'caserita-pin',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    // El nombre del negocio va en el HTML porque Leaflet descarta el `alt`
    // de los divIcon (solo lo aplica a iconos <img>).
    html: `<span class="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-extrabold shadow-lift ${pill}" style="transition:transform .16s ease;transform-origin:bottom center;${
      activo ? 'transform:translate(-50%,-100%) scale(1.08);' : ''
    }"><span class="sr-only">${negocio}, </span>Bs ${precio}<span class="absolute left-1/2 top-full size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 ${tail}"></span></span>`,
  })
  cachePines.set(clave, icono)
  return icono
}

const ICONO_USUARIO = L.divIcon({
  className: 'caserita-pin',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  html: `<span class="absolute -translate-x-1/2 -translate-y-1/2"><span class="block size-4 rounded-full border-[3px] border-white bg-ubicacion shadow-card"></span><span class="absolute inset-0 -m-3 animate-ping rounded-full bg-ubicacion/25"></span></span>`,
})

/** Leaflet hace cuentas con el tamaño del contenedor: si mide cero, revienta. */
function tieneTamano(map: L.Map): boolean {
  const s = map.getSize()
  return s.x > 0 && s.y > 0
}

/** Encuadra una sola vez al montar; despues respeta el pan y zoom del usuario. */
function EncuadreInicial({ puntos }: { puntos: [number, number][] }) {
  const map = useMap()
  const hecho = useRef(false)

  useEffect(() => {
    if (hecho.current || puntos.length < 2) return

    const encuadrar = () => {
      map.invalidateSize()
      if (!tieneTamano(map)) return false
      map.fitBounds(L.latLngBounds(puntos).pad(0.22), { animate: false })
      hecho.current = true
      return true
    }

    if (encuadrar()) return
    // El contenedor todavía no tiene alto (layout en curso): reintentar.
    const t = window.setTimeout(encuadrar, 200)
    return () => window.clearTimeout(t)
  }, [map, puntos])

  return null
}

/** Al elegir una bolsa, vuela suave hacia ese pin (como al elegir un local). */
function SeguirSeleccion({ destino }: { destino: [number, number] | null }) {
  const map = useMap()
  const previo = useRef<string>('')

  useEffect(() => {
    if (!destino || !tieneTamano(map)) return
    const clave = destino.join(',')
    if (clave === previo.current) return
    previo.current = clave
    map.flyTo(destino, Math.max(map.getZoom(), 15), { duration: 0.7 })
  }, [map, destino])

  return null
}

/** Mantiene el mapa cuadrado con su contenedor cuando este cambia de tamaño. */
function AjustarAlContenedor() {
  const map = useMap()

  useEffect(() => {
    const cont = map.getContainer()
    const observador = new ResizeObserver(() => map.invalidateSize())
    observador.observe(cont)
    return () => observador.disconnect()
  }, [map])

  return null
}

/** Controles flotantes: zoom y recentrado, al estilo de las apps de delivery. */
function Controles({
  onUbicarme,
  buscando,
}: {
  onUbicarme: () => void
  buscando: boolean
}) {
  const map = useMap()

  return (
    <div className="absolute bottom-4 right-3 z-[600] flex flex-col gap-2">
      <button
        type="button"
        aria-label="Mi ubicación"
        onClick={onUbicarme}
        className="tap grid size-11 place-items-center rounded-full bg-white text-ink shadow-lift transition-transform active:scale-95"
      >
        <Crosshair className={`size-5 ${buscando ? 'animate-spin text-brand' : ''}`} aria-hidden />
      </button>
      <div className="overflow-hidden rounded-full bg-white shadow-lift">
        <button
          type="button"
          aria-label="Acercar"
          onClick={() => map.zoomIn()}
          className="tap grid size-11 place-items-center text-ink hover:bg-surface"
        >
          <Plus className="size-5" aria-hidden />
        </button>
        <span className="mx-auto block h-px w-6 bg-border" />
        <button
          type="button"
          aria-label="Alejar"
          onClick={() => map.zoomOut()}
          className="tap grid size-11 place-items-center text-ink hover:bg-surface"
        >
          <Minus className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  )
}

/** Encapsula la logica de geolocalizacion real dentro del contexto del mapa. */
/** Zoom razonable según qué tan precisa sea la lectura del GPS. */
function zoomSegunPrecision(metros: number): number {
  if (metros <= 30) return 18
  if (metros <= 100) return 17
  if (metros <= 500) return 15
  return 14
}

function CapaUsuario({
  posicion,
  precision,
  onPosicion,
  registrarUbicar,
  onAviso,
}: {
  posicion: [number, number]
  precision: number | null
  onPosicion: (p: [number, number], metros: number) => void
  registrarUbicar: (fn: () => void) => void
  onAviso: (m: string) => void
}) {
  const map = useMap()
  const vigilancia = useRef<number | null>(null)

  useEffect(() => {
    registrarUbicar(() => {
      if (!('geolocation' in navigator)) {
        onAviso('Tu navegador no comparte ubicación: mostramos el centro de Santa Cruz')
        map.flyTo(posicion, 15, { duration: 0.7 })
        return
      }

      // La primera lectura suele venir de wifi o antenas y es imprecisa; el GPS
      // se va afinando en los segundos siguientes. Por eso se ESCUCHA la
      // posición en vez de pedirla una sola vez, y nos quedamos con la mejor.
      if (vigilancia.current !== null) navigator.geolocation.clearWatch(vigilancia.current)

      let mejor = Infinity
      let primera = true

      vigilancia.current = navigator.geolocation.watchPosition(
        (pos) => {
          const metros = pos.coords.accuracy
          if (metros > mejor) return // ya teníamos una lectura mejor
          mejor = metros
          const p: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          onPosicion(p, metros)
          map.flyTo(p, zoomSegunPrecision(metros), { duration: primera ? 0.9 : 0.4 })
          if (primera) {
            primera = false
            onAviso(
              metros <= 50
                ? `Ubicación encontrada (±${Math.round(metros)} m)`
                : `Ubicación aproximada (±${Math.round(metros)} m): activa el GPS para más precisión`,
            )
          }
          // Con una lectura fina ya no hace falta seguir consumiendo batería.
          if (metros <= 20 && vigilancia.current !== null) {
            navigator.geolocation.clearWatch(vigilancia.current)
            vigilancia.current = null
          }
        },
        (err) => {
          onAviso(
            err.code === err.PERMISSION_DENIED
              ? 'Sin permiso de ubicación: mostramos una posición aproximada'
              : 'No pudimos leer tu ubicación: mostramos una posición aproximada',
          )
          map.flyTo(posicion, 15, { duration: 0.7 })
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      )

      // Tope de 20 s escuchando: pasado eso nos quedamos con lo mejor que haya.
      window.setTimeout(() => {
        if (vigilancia.current !== null) {
          navigator.geolocation.clearWatch(vigilancia.current)
          vigilancia.current = null
        }
      }, 20000)
    })
  }, [map, posicion, onPosicion, registrarUbicar, onAviso])

  useEffect(
    () => () => {
      if (vigilancia.current !== null) navigator.geolocation.clearWatch(vigilancia.current)
    },
    [],
  )

  return (
    <>
      {/* Círculo de precisión, como en Maps o Uber: dice hasta dónde puede
          estar el punto real en vez de fingir exactitud que no se tiene. */}
      {precision !== null && precision > 25 && (
        <Circle
          center={posicion}
          radius={precision}
          pathOptions={{
            color: '#1B5FD1',
            weight: 1,
            fillColor: '#1B5FD1',
            fillOpacity: 0.12,
          }}
          interactive={false}
        />
      )}
      <Marker position={posicion} icon={ICONO_USUARIO} interactive={false} keyboard={false} />
    </>
  )
}

interface Props {
  bolsas: BolsaConVendedor[]
  seleccionadaId?: string
  onSeleccionar?: (id: string) => void
  className?: string
  ruta?: boolean
  /** Zoom con la rueda del mouse. En listas largas conviene dejarlo apagado. */
  zoomRueda?: boolean
  /** Para avisar cosas al usuario (por ejemplo, permiso de ubicación negado). */
  onAviso?: (mensaje: string) => void
  /** Con bordes redondeados (tarjeta) o a sangre, ocupando todo el hueco. */
  enmarcado?: boolean
}

export default function MapaReal({
  bolsas,
  seleccionadaId,
  onSeleccionar,
  className = 'h-[420px]',
  ruta = false,
  zoomRueda = true,
  onAviso = () => {},
  enmarcado = true,
}: Props) {
  const [miPosicion, setMiPosicion] = useState<[number, number]>(UBICACION_USUARIO)
  const [precision, setPrecision] = useState<number | null>(null)
  const [buscando, setBuscando] = useState(false)
  const ubicarRef = useRef<() => void>(() => {})
  const [mapa, setMapa] = useState<L.Map | null>(null)

  // Solo en desarrollo: permite inspeccionar el mapa desde la consola.
  useEffect(() => {
    if (import.meta.env.DEV && mapa) {
      ;(window as unknown as { __mapa?: L.Map }).__mapa = mapa
    }
  }, [mapa])

  /** Posiciones estables por bolsa: un array nuevo por render haría que
   *  react-leaflet reubicara todos los marcadores en cada pasada. */
  const posiciones = useMemo(
    () =>
      new Map<string, [number, number]>(
        bolsas.map((b) => [b.id, [b.vendedor.lat, b.vendedor.lng] as [number, number]]),
      ),
    [bolsas],
  )

  const puntos = useMemo<[number, number][]>(
    () => [UBICACION_USUARIO, ...posiciones.values()],
    [posiciones],
  )

  // Si nadie eligió una bolsa, se toma la primera: así una pantalla con una
  // sola bolsa (el delivery) siempre tiene destino para la ruta y el resalte.
  const seleccionada = bolsas.find((b) => b.id === seleccionadaId) ?? bolsas[0]

  const destino = useMemo<[number, number] | null>(
    () => (seleccionada ? (posiciones.get(seleccionada.id) ?? null) : null),
    [seleccionada, posiciones],
  )

  const registrarUbicar = useCallback((fn: () => void) => {
    ubicarRef.current = fn
  }, [])

  const recibirPosicion = useCallback((p: [number, number], metros: number) => {
    setMiPosicion(p)
    setPrecision(metros)
  }, [])

  const ubicarme = useCallback(() => {
    setBuscando(true)
    ubicarRef.current()
    window.setTimeout(() => setBuscando(false), 1600)
  }, [])

  return (
    <div
      className={`isolate relative overflow-hidden ${
        enmarcado ? 'rounded-3xl border border-border' : ''
      } ${className}`}
      role="region"
      aria-label="Mapa de Santa Cruz de la Sierra con las bolsas disponibles"
    >
      <MapContainer
        ref={setMapa}
        center={CENTRO_SCZ}
        zoom={13}
        minZoom={11}
        maxZoom={19}
        zoomControl={false}
        scrollWheelZoom={zoomRueda}
        doubleClickZoom
        dragging
        touchZoom
        className="size-full"
      >
        {/* CARTO empezó a pedir API key (oct 2026) y devolvía "API KEY REQUIRED"
            en cada tile. Los tiles estándar de OSM no piden clave; se desaturan
            con CSS para que el mapa siga en segundo plano frente a los pines. */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
          className="tiles-suaves"
        />

        <AjustarAlContenedor />
        <EncuadreInicial puntos={puntos} />
        <SeguirSeleccion destino={destino} />

        {ruta && destino && (
          <Polyline
            positions={[destino, miPosicion]}
            pathOptions={{
              color: '#0E5A2B',
              weight: 5,
              dashArray: '1 10',
              lineCap: 'round',
            }}
          />
        )}

        {bolsas.map((b) => (
          <Marker
            key={b.id}
            position={posiciones.get(b.id)!}
            icon={pinPrecio(b.vendedor.nombre, b.precioNuevo, b.id === seleccionada?.id)}
            zIndexOffset={b.id === seleccionada?.id ? 600 : 0}
            eventHandlers={{
              click: () => onSeleccionar?.(b.id),
              // Leaflet marca los pines como botones enfocables; sin esto,
              // Enter y Espacio no hacen nada (fallo WCAG 2.1.1).
              keypress: (e: L.LeafletKeyboardEvent) => {
                if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
                  e.originalEvent.preventDefault()
                  onSeleccionar?.(b.id)
                }
              },
            }}
          />
        ))}

        <CapaUsuario
          posicion={miPosicion}
          precision={precision}
          onPosicion={recibirPosicion}
          registrarUbicar={registrarUbicar}
          onAviso={onAviso}
        />

        <Controles onUbicarme={ubicarme} buscando={buscando} />
      </MapContainer>

      <span className="pointer-events-none absolute left-3 top-3 z-[600] rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-card">
        Santa Cruz de la Sierra
      </span>
    </div>
  )
}
