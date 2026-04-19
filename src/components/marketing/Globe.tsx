'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

interface GlobeProps {
  activeMarket?: string | null
  onMarketHover?: (id: string | null) => void
}

export default function Globe({ activeMarket, onMarketHover }: GlobeProps) {
  const [rot, setRot] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    let last = performance.now()
    const tick = (t: number) => {
      const dt = (t - last) / 1000
      last = t
      setRot(r => (r + dt * 6) % 360)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const dots = useMemo(() => {
    const arr: { lat: number; lon: number }[] = []
    const latStep = 8
    for (let lat = -80; lat <= 80; lat += latStep) {
      const circumScale = Math.cos((lat * Math.PI) / 180)
      const dotsAtLat = Math.max(6, Math.round(45 * circumScale))
      for (let i = 0; i < dotsAtLat; i++) {
        const lon = (i / dotsAtLat) * 360 - 180
        arr.push({ lat, lon })
      }
    }
    return arr
  }, [])

  const markets = [
    { id: 'usa', lat: 39, lon: -98, label: 'United States', short: 'USA' },
    { id: 'eu', lat: 50, lon: 10, label: 'Europe', short: 'EU' },
    { id: 'uk', lat: 53.8, lon: -2.7, label: 'United Kingdom — HQ', short: 'UK' },
    { id: 'cn', lat: 35, lon: 105, label: 'China', short: 'CN' },
    { id: 'au', lat: -25, lon: 135, label: 'Australia', short: 'AU' },
  ]

  const R = 260
  const project = (lat: number, lon: number) => {
    const latR = (lat * Math.PI) / 180
    const lonR = ((lon + rot) * Math.PI) / 180
    const x = R * Math.cos(latR) * Math.sin(lonR)
    const y = -R * Math.sin(latR)
    const z = R * Math.cos(latR) * Math.cos(lonR)
    return { x, y, z }
  }

  const size = R * 2 + 60
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: size,
        aspectRatio: '1 / 1',
        margin: '0 auto',
      }}
    >
      <svg
        viewBox={`${-R - 30} ${-R - 30} ${size} ${size}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <circle cx="0" cy="0" r={R + 16} fill="none" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2 4" />
        <circle cx="0" cy="0" r={R + 4} fill="none" stroke="var(--line)" strokeWidth="0.5" />
        {Array.from({ length: 72 }).map((_, i) => {
          const a = (i / 72) * Math.PI * 2
          const r1 = R + 16
          const r2 = R + (i % 9 === 0 ? 24 : 20)
          return (
            <line
              key={i}
              x1={Math.cos(a) * r1}
              y1={Math.sin(a) * r1}
              x2={Math.cos(a) * r2}
              y2={Math.sin(a) * r2}
              stroke="var(--line)"
              strokeWidth="0.5"
            />
          )
        })}
      </svg>

      <svg
        viewBox={`${-R - 30} ${-R - 30} ${size} ${size}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <radialGradient id="sphereGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="var(--bg)" stopOpacity="0.6" />
            <stop offset="70%" stopColor="var(--bg)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sphereShade" cx="70%" cy="70%">
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
          </radialGradient>
        </defs>

        <circle cx="0" cy="0" r={R} fill="var(--bg-2)" opacity="0.4" />
        <circle cx="0" cy="0" r={R} fill="url(#sphereGrad)" />
        <ellipse cx="0" cy="0" rx={R} ry={R * 0.05} fill="none" stroke="var(--line)" strokeWidth="0.6" />

        {dots.map((d, i) => {
          const p = project(d.lat, d.lon)
          const front = p.z > 0
          const alpha = front ? 0.6 : 0.1
          const size = front ? 1.3 : 0.8
          return <circle key={i} cx={p.x} cy={p.y} r={size} fill="var(--primary)" opacity={alpha} />
        })}

        <circle cx="0" cy="0" r={R} fill="url(#sphereShade)" />

        {markets.flatMap((a, i) =>
          markets.slice(i + 1).map(b => {
            const pa = project(a.lat, a.lon)
            const pb = project(b.lat, b.lon)
            if (pa.z < -50 || pb.z < -50) return null
            const mx = (pa.x + pb.x) / 2
            const my = (pa.y + pb.y) / 2
            const d = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1
            const lift = d * 0.3
            const nx = -(pb.y - pa.y) / d
            const ny = (pb.x - pa.x) / d
            const cx = mx + nx * lift * Math.sign(my) * -1
            const cy = my + ny * lift * Math.sign(my) * -1 - lift * 0.5
            const opacity = Math.min(pa.z, pb.z) > 0 ? 0.5 : 0.2
            return (
              <path
                key={`${a.id}-${b.id}`}
                d={`M ${pa.x} ${pa.y} Q ${cx} ${cy} ${pb.x} ${pb.y}`}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="0.7"
                strokeDasharray="2 3"
                opacity={opacity}
              />
            )
          })
        )}

        {markets.map(m => {
          const p = project(m.lat, m.lon)
          const front = p.z > 0
          if (!front) return null
          const isActive = activeMarket === m.id
          return (
            <g
              key={m.id}
              transform={`translate(${p.x}, ${p.y})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => onMarketHover?.(m.id)}
              onMouseLeave={() => onMarketHover?.(null)}
            >
              <circle r="4" fill="var(--primary)">
                <animate attributeName="r" from="4" to="18" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle r={isActive ? 5 : 3.5} fill="var(--primary)" stroke="var(--bg)" strokeWidth="1.5" />
              <text
                x="8"
                y="-6"
                fontSize="10"
                fill="var(--ink)"
                fontFamily="var(--mono)"
                style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}
              >
                {m.short}
              </text>
            </g>
          )
        })}
      </svg>

      <div
        style={{
          position: 'absolute',
          bottom: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.15em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        LON {Math.round(rot)}° — 4 markets, 1 origin — live routing
      </div>
    </div>
  )
}
