import { Link } from 'react-router-dom'
import { Clock, MapPin } from 'lucide-react'
import type { BolsaConVendedor } from '../types'
import { ventanaDeRecojo } from '../lib/horarios'
import Foto from './Foto'
import { Rating } from './ui'

export function descuento(b: { precioViejo: number; precioNuevo: number }): number {
  return Math.round((1 - b.precioNuevo / b.precioViejo) * 100)
}

export default function BolsaCard({ bolsa }: { bolsa: BolsaConVendedor }) {
  const agotada = bolsa.disponibles <= 0
  const ventana = ventanaDeRecojo(bolsa.recojoInicio, bolsa.recojoFin)

  return (
    <Link
      to={`/bolsa/${bolsa.id}`}
      className="block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-transform active:scale-[0.99]"
    >
      <div className="relative">
        <Foto
          src={bolsa.imagen}
          alt={`${bolsa.titulo} de ${bolsa.vendedor.nombre}`}
          className={`h-40 w-full object-cover lg:h-44 ${agotada ? 'grayscale' : ''}`}
        />
        <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-extrabold text-primary-foreground">
          -{descuento(bolsa)}%
        </span>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur ${
            agotada ? 'bg-ink/85 text-background' : 'bg-card/90 text-ink'
          }`}
        >
          {agotada ? 'Agotada por hoy' : `${bolsa.disponibles} disponibles`}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-base font-bold text-ink">{bolsa.vendedor.nombre}</h3>
          <span className="shrink-0">
            <Rating value={bolsa.vendedor.rating} />
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{bolsa.descripcion}</p>
        <div className="flex items-end justify-between gap-3 pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground line-through">Bs {bolsa.precioViejo}</span>
            <span className="text-lg font-extrabold text-brand">Bs {bolsa.precioNuevo}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" aria-hidden /> {ventana.etiqueta}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" aria-hidden /> {bolsa.distanciaKm} km
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
