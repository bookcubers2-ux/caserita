import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Cada cambio de pantalla arranca desde arriba, como en una app nativa. */
export default function ScrollAlTope() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}
