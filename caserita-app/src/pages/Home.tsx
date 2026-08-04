import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Search, Store } from 'lucide-react'
import type { Categoria } from '../types'
import { useStore } from '../store'
import { useTitulo } from '../lib/useTitulo'
import { CATEGORIAS } from '../data/seed'
import BolsaCard from '../components/BolsaCard'
import { Chip, Skeleton } from '../components/ui'

export default function Home() {
  const { bolsas: todas, cargando } = useStore()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState<Categoria | 'Todo'>('Todo')

  useTitulo(
    'Caserita · Bolsas sorpresa cerca de ti en Santa Cruz',
    'Descubre bolsas sorpresa de comida rescatada cerca de ti en Santa Cruz, desde Bs 7.',
  )

  const bolsas = cargando ? null : todas

  const visibles = useMemo(() => {
    if (!bolsas) return null
    const q = busqueda.trim().toLowerCase()
    return bolsas.filter((b) => {
      const porCategoria = categoria === 'Todo' || b.categoria === categoria
      const porTexto =
        !q ||
        b.titulo.toLowerCase().includes(q) ||
        b.descripcion.toLowerCase().includes(q) ||
        b.vendedor.nombre.toLowerCase().includes(q)
      return porCategoria && porTexto
    })
  }, [bolsas, busqueda, categoria])

  return (
    <div className="pagina pb-6">
      <header className="sticky top-0 z-30 space-y-3 bg-background/95 px-4 pb-3 pt-5 backdrop-blur lg:static lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0">
        {/* Cabecera de telefono: en escritorio la reemplaza la barra lateral. */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:hidden">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight text-brand-dark">
              Caserita
            </h1>
            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4 text-ubicacion" aria-hidden /> Santa Cruz
            </p>
          </div>
          <Link
            to="/vendedor"
            className="tap inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand-dark"
          >
            <Store className="size-4" aria-hidden /> Vender
          </Link>
        </div>

        {/* Titulo de escritorio. */}
        <div className="hidden lg:block">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Bolsas sorpresa cerca de ti
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Comida en buen estado que hoy se iba a botar, a mitad de precio en Santa Cruz.
          </p>
        </div>

        <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-card focus-within:border-brand lg:mt-6 lg:max-w-xl">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar comida cerca"
            aria-label="Buscar comida cerca"
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-muted-foreground"
          />
        </label>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0">
            <Chip activo={categoria === 'Todo'} onClick={() => setCategoria('Todo')}>
              Todo
            </Chip>
          </span>
          {CATEGORIAS.map((c) => (
            <span key={c} className="shrink-0">
              <Chip activo={categoria === c} onClick={() => setCategoria(c)}>
                {c}
              </Chip>
            </span>
          ))}
        </div>
      </header>

      <div className="space-y-3 px-4 pt-2 lg:space-y-0 lg:px-0 lg:pt-7">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-bold text-ink lg:hidden">Bolsas sorpresa cerca de ti</h2>
          {visibles && (
            <p className="hidden text-sm text-muted-foreground lg:block">
              {visibles.length} {visibles.length === 1 ? 'bolsa disponible' : 'bolsas disponibles'}
            </p>
          )}
        </div>

        {!visibles && (
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        )}

        {visibles?.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
            <p className="text-sm font-bold text-ink">No hay bolsas con ese filtro</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Prueba otra categoría o vuelve más tarde: los negocios publican al cerrar.
            </p>
          </div>
        )}

        {visibles && visibles.length > 0 && (
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:grid-cols-3">
            {visibles.map((b) => (
              <div key={b.id} className="animate-rise">
                <BolsaCard bolsa={b} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
