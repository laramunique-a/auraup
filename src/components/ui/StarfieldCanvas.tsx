import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  radius: number
  alpha: number
  speed: number
}

export function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let stars: Star[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    const initStars = () => {
      const count = Math.floor((canvas.width * canvas.height) / 12000)
      stars = Array.from({ length: Math.min(count, 80) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.35 + 0.1,
        speed: Math.random() * 0.15 + 0.05,
      }))
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      stars.forEach(star => {
        star.y -= star.speed
        if (star.y < 0) {
          star.y = canvas.height
          star.x = Math.random() * canvas.width
        }

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(37, 99, 235, ${star.alpha})`
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    window.addEventListener('resize', resize)
    resize()
    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-60 transition-opacity duration-500"
      aria-hidden="true"
    />
  )
}
