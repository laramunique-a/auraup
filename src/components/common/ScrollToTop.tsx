import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Componente que garante que o PWA e a aplicação web
 * sempre iniciem qualquer rota e menu no topo absoluto da página.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    // Desativa a restauração automática do scroll do browser/PWA
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const resetScroll = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0

      const root = document.getElementById('root')
      if (root) root.scrollTop = 0
    }

    // Reseta imediatamente e reforça em micro-intervalos para vencer rendering assíncrono
    resetScroll()
    const raf = requestAnimationFrame(resetScroll)
    const timer = setTimeout(resetScroll, 20)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [pathname, search])

  return null
}
