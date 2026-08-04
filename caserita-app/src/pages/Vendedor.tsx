import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Categoria } from '../types'
import { CATEGORIAS } from '../data/seed'
import { useStore } from '../store'
import { useTitulo } from '../lib/useTitulo'
import { Button, Chip, LinkButton, RoleSwitch } from '../components/ui'

export default function Vendedor() {
  const navigate = useNavigate()
  const { setRol, mostrarToast, publicar: publicarEnTienda } = useStore()

  useTitulo(
    'Modo vendedor · Publica tu excedente en Caserita',
    'Publica en un toque lo que te sobró hoy y véndelo antes de cerrar.',
  )
  const [categoria, setCategoria] = useState<Categoria>('Pan del día')
  const [cantidad, setCantidad] = useState(5)
  const [precio, setPrecio] = useState(12)
  const [horario, setHorario] = useState('18:00-19:00')
  const [enviando, setEnviando] = useState(false)

  const publicar = async () => {
    setEnviando(true)
    await publicarEnTienda({ categoria, cantidad, precio, horario })
    setEnviando(false)
    mostrarToast(`Publicaste ${cantidad} bolsas de ${categoria.toLowerCase()}`)
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
          Un toque y tu excedente se pone a la venta antes de cerrar.
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
                <Chip key={c} activo={categoria === c} onClick={() => setCategoria(c)}>
                  {c}
                </Chip>
              ))}
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

          <Button full onClick={publicar} disabled={enviando}>
            {enviando ? 'Publicando…' : 'Publicar (1 toque)'}
          </Button>
        </div>

        <div className="mt-5 space-y-4 lg:mt-0">
          {/* Vista previa de como lo vera el comprador. */}
          <div className="hidden rounded-3xl border border-border bg-card p-5 shadow-card lg:block">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Así lo verán
            </p>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <span className="text-base font-bold text-ink">{categoria}</span>
              <span className="text-2xl font-extrabold text-brand">Bs {precio}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {cantidad} {cantidad === 1 ? 'bolsa' : 'bolsas'} · recojo {horario}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Si se venden todas</span>
              <span className="text-sm font-extrabold text-brand-dark">
                Bs {cantidad * precio} recuperados
              </span>
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
