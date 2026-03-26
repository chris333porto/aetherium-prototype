'use client'

import { useEffect, useRef } from 'react'

const ORBS = [
  { x: 0.5,  y: -0.05, r: 0.62, c: [83,  74, 183] as [number,number,number], s: 0.08 },
  { x: 0.08, y:  0.88, r: 0.26, c: [45, 184, 133] as [number,number,number], s: 0.04 },
  { x: 0.92, y:  0.78, r: 0.24, c: [201,168,  76] as [number,number,number], s: 0.03 },
  { x: 0.88, y:  0.12, r: 0.20, c: [224,  90,  58] as [number,number,number], s: 0.03 },
  { x: 0.15, y:  0.40, r: 0.18, c: [ 74, 159, 212] as [number,number,number], s: 0.03 },
]

export function HomepageBgCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = 0, H = 0, t = 0, sy = 0
    let animId: number

    function resize() {
      W = canvas!.width  = innerWidth
      H = canvas!.height = innerHeight
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      const sp = sy / (document.body.scrollHeight - innerHeight || 1)

      ORBS.forEach((o, i) => {
        const dx = Math.sin(t * 0.00035 + i * 1.3) * 0.042
        const dy = Math.cos(t * 0.00028 + i * 1.1) * 0.032
        const cx = (o.x + dx) * W
        const cy = (o.y + dy + sp * 0.28) * H
        const r  = o.r * Math.max(W, H)
        const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0, `rgba(${o.c}, ${o.s})`)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      })

      // Hexagon geometry — removed (visual clutter)

      t++
      animId = requestAnimationFrame(draw)
    }

    function onScroll() { sy = window.scrollY }

    resize()
    draw()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
