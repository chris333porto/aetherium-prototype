'use client'

import { useEffect, useRef } from 'react'

const DIM_COLORS: [number, number, number][] = [
  [149, 144, 236], // Aether — purple
  [224,  90,  58], // Fire
  [212, 133,  58], // Air
  [ 74, 159, 212], // Water
  [ 45, 184, 133], // Earth
]

export function HomepageMandala() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap   = wrapRef.current
    if (!canvas || !wrap) return

    const ctx = canvas.getContext('2d')!
    let t = 0
    let scrollOffset = 0
    let size = 0
    let animId: number

    function resize() {
      size = wrap!.offsetWidth
      canvas!.width  = canvas!.height  = size * devicePixelRatio
      canvas!.style.width = canvas!.style.height = size + 'px'
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(devicePixelRatio, devicePixelRatio)
    }

    function draw() {
      const s = size
      const cx = s / 2, cy = s / 2
      ctx.clearRect(0, 0, s, s)

      const scroll  = Math.min(scrollOffset / 600, 1)
      const breathe = Math.sin(t * 0.012) * 0.025
      const scale   = 1 + breathe + scroll * 0.08

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(scale, scale)
      ctx.translate(-cx, -cy)

      // Outer pentagon with dimension dots
      const r1 = s * 0.42
      for (let i = 0; i < 5; i++) {
        const a0 = (i / 5) * Math.PI * 2 - Math.PI / 2 + t * 0.0012
        const a1 = ((i + 1) / 5) * Math.PI * 2 - Math.PI / 2 + t * 0.0012
        const x0 = cx + Math.cos(a0) * r1, y0 = cy + Math.sin(a0) * r1
        const x1 = cx + Math.cos(a1) * r1, y1 = cy + Math.sin(a1) * r1
        const col = DIM_COLORS[i]
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1)
        ctx.strokeStyle = `rgba(${col}, .18)`; ctx.lineWidth = 1; ctx.stroke()
        const pulse = Math.sin(t * 0.018 + i * 1.26) * 0.35 + 0.65
        ctx.beginPath(); ctx.arc(x0, y0, 4.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${col}, ${pulse * 0.75})`; ctx.fill()
      }

      // Inner rings (counter-rotating segments)
      const rings = [0.38, 0.28, 0.19, 0.11]
      rings.forEach((rr, ri) => {
        const r = s * rr
        const segs = 5 + ri * 3
        for (let i = 0; i < segs; i++) {
          const dir = ri % 2 === 0 ? 1 : -1
          const spd = 0.0008 + ri * 0.0004
          const a0 = (i / segs) * Math.PI * 2 + t * spd * dir
          const a1 = ((i + 0.6) / segs) * Math.PI * 2 + t * spd * dir
          const x0 = cx + Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r
          const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r
          const gp = ctx.createLinearGradient(x0, y0, x1, y1)
          const col = DIM_COLORS[(i + ri) % 5]
          gp.addColorStop(0, `rgba(${col}, .35)`)
          gp.addColorStop(1, `rgba(${col}, .08)`)
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1)
          ctx.strokeStyle = gp; ctx.lineWidth = ri === 0 ? 1.2 : 0.8; ctx.stroke()
        }
      })

      // Rotating inner five-pointed star
      const r3 = s * 0.24
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + t * 0.006 - Math.PI / 2
        const x = cx + Math.cos(a) * r3, y = cy + Math.sin(a) * r3
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = `rgba(149,144,236,${0.18 + Math.sin(t * 0.015) * 0.06})`
      ctx.lineWidth = 0.8; ctx.stroke()

      // Five-petal breathing flower
      const r4 = s * 0.15
      for (let i = 0; i < 5; i++) {
        const a  = (i / 5) * Math.PI * 2 - t * 0.004 - Math.PI / 2
        const px = cx + Math.cos(a) * r4 * 0.7
        const py = cy + Math.sin(a) * r4 * 0.7
        const pr = r4 * (0.35 + Math.sin(t * 0.022 + i * 1.26) * 0.08)
        const col = DIM_COLORS[i]
        const fade = Math.sin(t * 0.018 + i * 1.26) * 0.5 + 0.5
        const gp = ctx.createRadialGradient(px, py, 0, px, py, pr)
        gp.addColorStop(0, `rgba(${col}, ${0.32 * fade})`)
        gp.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2)
        ctx.fillStyle = gp; ctx.fill()
      }

      // Center glow
      const cr = s * 0.055
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 3)
      cg.addColorStop(0, `rgba(149,144,236,${0.35 + breathe * 4})`)
      cg.addColorStop(0.4, `rgba(83,74,183,${0.12 + breathe * 2})`)
      cg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath(); ctx.arc(cx, cy, cr * 3, 0, Math.PI * 2)
      ctx.fillStyle = cg; ctx.fill()

      ctx.restore()
      t++
      animId = requestAnimationFrame(draw)
    }

    function onScroll() { scrollOffset = window.scrollY }

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
    <div ref={wrapRef} className="mandala-wrap">
      <canvas ref={canvasRef} />
      <div className="mandala-center">
        <span className="mandala-glyph">◈</span>
      </div>
    </div>
  )
}
