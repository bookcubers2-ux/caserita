import { useEffect } from 'react'

/** Cambia el titulo de la pestana y la meta descripcion segun la pantalla. */
export function useTitulo(titulo: string, descripcion?: string) {
  useEffect(() => {
    document.title = titulo
    if (!descripcion) return
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', descripcion)
  }, [titulo, descripcion])
}
