'use client'

import { useState } from 'react'
import Globe from './Globe'

interface HeroProps {
  onQuote: () => void
  onNav: (id: string) => void
}

export default function Hero({ onQuote, onNav }: HeroProps) {
  const [active, setActive] = useState<string | null>(null)

  return (
    <section
      id="top"
      style={{ paddingTop: 140, paddingBottom: 60, minHeight: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, var(--line-2) 1px, transparent 1px),
            linear-gradient(to bottom, var(--line-2) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
          pointerEvents: 'none',
        }}
      />

      <div className="hm-container" style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 24,
            marginBottom: 40,
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div className="eyebrow">Heritage Global Solutions — est. United Kingdom</div>
          <div
            style={{
              display: 'flex',
              gap: 24,
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.15em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
            }}
          >
            <span>UK · USA · EU · CN · AU</span>
            <span>ISO 9001 Sourcing</span>
            <span style={{ color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 50, background: '#4caf50' }} />
              14 live shipments
            </span>
          </div>
        </div>

        <div
          className="hero-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}
        >
          <div>
            <h1
              className="serif"
              style={{
                fontSize: 'clamp(54px, 7.5vw, 110px)',
                lineHeight: 0.95,
                margin: 0,
                fontWeight: 400,
                letterSpacing: '-0.03em',
              }}
            >
              Sourcing the world,<br />
              <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>shipped</span> to you.
            </h1>
            <p
              style={{
                fontSize: 19,
                lineHeight: 1.5,
                color: 'var(--ink-2)',
                maxWidth: 520,
                marginTop: 32,
                textWrap: 'pretty',
              }}
            >
              A global intermediary between manufacturers and consumers. We specialise in mining equipment, heavy
              machinery, engines, motors, pumps and automotive parts — moved across four continents with a single
              point of accountability.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap' }}>
              <button className="hm-btn hm-btn-primary" onClick={onQuote}>
                Request a quote <span className="arrow">→</span>
              </button>
              <button className="hm-btn hm-btn-ghost" onClick={() => onNav('products')}>
                Browse capabilities
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 24,
                marginTop: 64,
                paddingTop: 24,
                borderTop: '1px solid var(--line)',
              }}
            >
              {[
                { n: '4', l: 'Continents active' },
                { n: '120+', l: 'Manufacturer partners' },
                { n: '18 yrs', l: 'In heavy sourcing' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="serif" style={{ fontSize: 44, lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {s.n}
                  </div>
                  <div className="mono" style={{ color: 'var(--muted)', marginTop: 8 }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Globe activeMarket={active} onMarketHover={setActive} />
          </div>
        </div>
      </div>
    </section>
  )
}
