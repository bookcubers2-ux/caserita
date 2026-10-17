import { useStore } from '../store'
import { useTitulo } from '../lib/useTitulo'
import Foto from '../components/Foto'
import { BackButton, EtiquetaSorpresa, LinkButton } from '../components/ui'

export default function VendedorHoy() {
  const { publicaciones: pubs } = useStore()

  useTitulo(
    'Lo publicado hoy · Caserita',
    'Revisa cuántas bolsas publicaste hoy y cuánto recuperaste.',
  )

  const totalBs = pubs.reduce((s, p) => s + p.vendidas * p.precio, 0)
  const totalVendidas = pubs.reduce((s, p) => s + p.vendidas, 0)

  return (
    <div className="animate-rise pagina space-y-5 px-4 pb-10 pt-5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <BackButton to="/vendedor" />
        <h1 className="min-w-0 truncate text-xl font-extrabold text-ink lg:text-3xl">
          Lo publicado hoy
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-brand-soft p-4 text-center lg:max-w-md lg:gap-6 lg:p-6">
        <div>
          <p className="text-lg font-extrabold text-brand-dark">{totalVendidas}</p>
          <p className="text-xs text-brand-dark">reservadas</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-brand-dark">Bs {totalBs}</p>
          <p className="text-xs text-brand-dark">recuperado hoy</p>
        </div>
      </div>

      {pubs.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <p className="text-sm font-bold text-ink">Todavía no publicaste nada hoy</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Publica tu excedente y aparecerá aquí con cuántas bolsas se vendieron.
          </p>
        </div>
      )}

      <div className="space-y-3 lg:grid lg:max-w-4xl lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {pubs.map((p) => (
          <div
            key={p.id}
            className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {p.imagen && (
                  <Foto
                    src={p.imagen}
                    alt=""
                    className="size-9 shrink-0 rounded-lg object-cover"
                  />
                )}
                <h2 className="min-w-0 truncate text-sm font-bold text-ink">
                  {p.titulo ?? p.categoria}
                </h2>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                  p.estado === 'activa'
                    ? 'bg-brand text-primary-foreground'
                    : 'bg-surface text-muted-foreground'
                }`}
              >
                {p.estado === 'activa' ? 'Activa' : 'Agotada'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {p.categoria} · Bs {p.precio} · recojo {p.horario}
              </p>
              {p.sorpresa && <EtiquetaSorpresa />}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.round((p.vendidas / p.cantidad) * 100)}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-bold text-ink">
                {p.vendidas}/{p.cantidad}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 lg:max-w-xs">
        <LinkButton to="/vendedor/pedidos" variant="brand">
          Ver los pedidos de hoy
        </LinkButton>
        <LinkButton to="/vendedor">Publicar otra cosa</LinkButton>
      </div>
    </div>
  )
}
