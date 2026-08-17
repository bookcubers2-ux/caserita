import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Categoria } from '../types'
import { CATEGORIAS, FOTOS_DISPONIBLES, PLANTILLA_POR_CATEGORIA, TEXTO_SORPRESA } from '../data/seed'
import { useStore } from '../store'
import { useTitulo } from '../lib/useTitulo'
import Foto from '../components/Foto'
import { Button, Chip, EtiquetaSorpresa, LinkButton, RoleSwitch } from '../components/ui'

export default function Vendedor() {
  const navigate = useNavigate()
  const { setRol, mostrarToast, publicar: publicarEnTienda } = useStore()

  useTitulo(
    'Modo vendedor · Publica tu excedente en Caserita',
    'Publica lo que te sobró hoy: ponle nombre, foto y precio, y véndelo antes de cerrar.',
  )
  const [categoria, setCategoria] = useState<Categoria>('Pan del día')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagen, setImagen] = useState(PLANTILLA_POR_CATEGORIA['Pan del día'].imagen)
  const [sorpresa, setSorpresa] = useState(false)
  const [cantidad, setCantidad] = useState(5)
  const [precio, setPrecio] = useState(12)
  const [horario, setHorario] = useState('18:00-19:00')
  const [enviando, setEnviando] = useState(false)

  const tituloLimpio = titulo.trim()
  const descripcionLimpia = descripcion.trim()

  /** Cambiar de categoría trae su foto sugerida; se puede elegir otra. */
  const elegirCategoria = (c: Categoria) => {
    setCategoria(c)
    setImagen(PLANTILLA_POR_CATEGORIA[c].imagen)
  }

  const publicar = async () => {
    if (!tituloLimpio) {
      mostrarToast('Ponle un nombre a lo que vas a publicar')
      return
    }
    // La descripción solo deja de ser obligatoria si es una bolsa sorpresa.
    if (!sorpresa && !descripcionLimpia) {
      mostrarToast('Describe en una línea qué lleva, o publícalo como sorpresa')
      return
    }

    setEnviando(true)
    await publicarEnTienda({
      categoria,
      cantidad,
      precio,
      horario,
      titulo: tituloLimpio,
      descripcion: descripcionLimpia,
      imagen,
      sorpresa,
    })
    setEnviando(false)
    mostrarToast(`Publicaste ${cantidad} × ${tituloLimpio}`)
    navigate('/vendedor/hoy')
  }

  const cambiarRol = (r: 'comprador' | 'vendedor') => {
    setRol(r)
    if (r === 'comprador') navigate('/')
  }

  return (
    <div className="animate-rise pagina space-y-5 px-4 pb-10 pt-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Modo vendedor</p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink lg:text-3xl">
          Publica lo que te sobró hoy
        </h1>
        <p className="mt-1.5 hidden text-sm text-muted-foreground lg:block">
          Ponle nombre y foto para que el cliente sepa qué se lleva.
        </p>
      </div>

      <div className="lg:max-w-sm">
        <RoleSwitch rol="vendedor" onChange={cambiarRol} />
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="space-y-5 lg:rounded-3xl lg:border lg:border-border lg:bg-card lg:p-6 lg:shadow-card">
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-ink">¿Qué te sobró?</h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((c) => (
                <Chip key={c} activo={categoria === c} onClick={() => elegirCategoria(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </section>

          {/* El camino por defecto: decir qué es. La sorpresa viene después. */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-ink">Cuéntale al cliente qué es</h2>

            <label className="block rounded-2xl border border-border bg-card px-4 py-3 shadow-card focus-within:border-brand lg:shadow-none">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Nombre del producto
              </span>
              <div className="mt-1">
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Pan del día: marraqueta y cuñapé"
                  className="w-full bg-transparent text-base font-bold text-ink outline-none placeholder:font-normal placeholder:text-muted-foreground"
                />
              </div>
            </label>

            <label className="block rounded-2xl border border-border bg-card px-4 py-3 shadow-card focus-within:border-brand lg:shadow-none">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Descripción corta
                </span>
                {sorpresa && (
                  <span className="text-xs font-semibold text-muted-foreground">Opcional</span>
                )}
              </span>
              <div className="mt-1">
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                  placeholder={
                    sorpresa
                      ? 'En una sorpresa el cliente no verá esto'
                      : 'Ej. Recién horneado esta mañana, alcanza para dos'
                  }
                  className="w-full resize-none bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
                />
              </div>
            </label>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Foto
              </span>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {FOTOS_DISPONIBLES.map((f) => (
                  <button
                    key={f.src}
                    type="button"
                    aria-pressed={imagen === f.src}
                    aria-label={`Usar la foto de ${f.etiqueta.toLowerCase()}`}
                    onClick={() => setImagen(f.src)}
                    className={`tap shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                      imagen === f.src ? 'border-brand' : 'border-border'
                    }`}
                  >
                    <Foto src={f.src} alt={f.etiqueta} className="size-16 object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <label className="block rounded-2xl border border-border bg-card px-4 py-3 shadow-card focus-within:border-brand lg:shadow-none">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Bolsas
              </span>
              <div className="mt-1">
                <input
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-transparent text-lg font-bold text-ink outline-none"
                />
              </div>
            </label>
            <label className="block rounded-2xl border border-border bg-card px-4 py-3 shadow-card focus-within:border-brand lg:shadow-none">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Precio (Bs)
              </span>
              <div className="mt-1">
                <input
                  type="number"
                  min={1}
                  value={precio}
                  onChange={(e) => setPrecio(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-transparent text-lg font-bold text-ink outline-none"
                />
              </div>
            </label>
          </div>

          <label className="block rounded-2xl border border-border bg-card px-4 py-3 shadow-card focus-within:border-brand lg:shadow-none">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Horario de recojo
            </span>
            <div className="mt-1">
              <input
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="w-full bg-transparent text-lg font-bold text-ink outline-none"
              />
            </div>
          </label>

          {/* Control secundario: apagado por defecto y sin el verde de marca. */}
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface p-4">
            <input
              type="checkbox"
              checked={sorpresa}
              onChange={(e) => setSorpresa(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-brand"
            />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-ink">Publicar como sorpresa</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                El cliente ve el comercio y la categoría, pero no el contenido.
              </span>
            </span>
          </label>

          <Button full onClick={publicar} disabled={enviando}>
            {enviando ? 'Publicando…' : 'Publicar'}
          </Button>
        </div>

        <div className="mt-5 space-y-4 lg:mt-0">
          {/* Vista previa de como lo vera el comprador. */}
          <div className="hidden overflow-hidden rounded-3xl border border-border bg-card shadow-card lg:block">
            <Foto src={imagen} alt="" className="h-32 w-full object-cover" />
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Así lo verán
              </p>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-base font-bold text-ink">
                  {tituloLimpio || categoria}
                </span>
                <span className="shrink-0 text-2xl font-extrabold text-brand">Bs {precio}</span>
              </div>
              {sorpresa && (
                <span className="mt-2 inline-flex">
                  <EtiquetaSorpresa />
                </span>
              )}
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {sorpresa ? TEXTO_SORPRESA : descripcionLimpia || 'Sin descripción todavía'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {cantidad} {cantidad === 1 ? 'bolsa' : 'bolsas'} · recojo {horario}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Si se venden todas</span>
                <span className="text-sm font-extrabold text-brand-dark">
                  Bs {cantidad * precio} recuperados
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-sm font-bold text-ink">O publica por WhatsApp</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Escribe «tengo {cantidad} bolsas de {categoria.toLowerCase()}» al 700 12345 y listo,
              nosotros la publicamos.
            </p>
            <p className="mt-3 inline-flex rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-dark">
              Ideal si estás en el mostrador
            </p>
          </div>

          <LinkButton to="/vendedor/hoy">Ver lo publicado hoy</LinkButton>
        </div>
      </div>
    </div>
  )
}
