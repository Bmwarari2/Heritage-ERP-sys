'use client'

import { useState } from 'react'

interface Market {
  id: string
  short: string
  name: string
  role: string
  coords: string
  desc: string
  stat: { n: string; l: string }
  img: string
}

interface MarketsProps {
  onNav: (id: string) => void
}

const markets: Market[] = [
  {
    id: 'uk',
    short: 'UK',
    name: 'United Kingdom',
    role: 'Headquarters · Operations',
    coords: '53.77° N, 2.70° W',
    desc: 'Origin point of every shipment. Our Preston HQ handles commercial terms, quality sign-off and customs coordination across all outbound markets.',
    stat: { n: '1', l: 'Central ops hub' },
    img: 'Preston HQ · warehouse',
  },
  {
    id: 'usa',
    short: 'USA',
    name: 'United States',
    role: 'Key client market',
    coords: '39.0° N, 98.0° W',
    desc: 'Mining operators in Nevada and Arizona, automotive parts distributors across the East Coast, and industrial pump resellers in Texas.',
    stat: { n: '34%', l: 'Of annual volume' },
    img: 'Arizona haul operation',
  },
  {
    id: 'eu',
    short: 'EU',
    name: 'Europe',
    role: 'Key client market',
    coords: '50.0° N, 10.0° E',
    desc: 'Short-haul routes to Germany, France and the Nordics. Preferred rail and sea lanes keep lead times tight for industrial engines and motors.',
    stat: { n: '48h', l: 'Avg dispatch window' },
    img: 'Hamburg port · containers',
  },
  {
    id: 'cn',
    short: 'CN',
    name: 'China',
    role: 'Primary manufacturing base',
    coords: '35.0° N, 105.0° E',
    desc: 'Direct relationships with Tier-1 manufacturers in Guangdong, Jiangsu and Shandong — where most of our mining equipment is built to spec.',
    stat: { n: '80+', l: 'Trusted factories' },
    img: 'Shenzhen fabrication',
  },
  {
    id: 'au',
    short: 'AU',
    name: 'Australia',
    role: 'Key client market',
    coords: '25.0° S, 135.0° E',
    desc: 'The Pilbara, the Goldfields, Queensland coal country. We move haul trucks, conveyors and hydraulic systems to mines that never stop.',
    stat: { n: '22', l: 'Active mine sites' },
    img: 'Pilbara haul truck',
  },
]

function MarketCard({ market, index }: { market: Market; index: number }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '28px 24px 32px',
        borderRight: '1px solid var(--line)',
        borderBottom: '1px solid var(--line)',
        background: hover ? 'var(--bg)' : 'transparent',
        transition: 'background 0.3s',
        position: 'relative',
        minHeight: 380,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="mono" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          {market.short}
        </span>
        <span className="mono" style={{ color: 'var(--muted)' }}>
          0{index + 1}
        </span>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="serif" style={{ fontSize: 24, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
          {market.name}
        </div>
        <div className="mono" style={{ color: 'var(--muted)', marginTop: 6 }}>
          {market.role}
        </div>
      </div>

      <div className="placeholder" data-label={market.img} style={{ height: 90, marginTop: 20 }} />

      <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 16, flex: 1 }}>{market.desc}</p>

      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid var(--line-2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span className="serif" style={{ fontSize: 26, letterSpacing: '-0.02em' }}>
          {market.stat.n}
        </span>
        <span className="mono" style={{ color: 'var(--muted)', fontSize: 9 }}>
          {market.stat.l}
        </span>
      </div>

      <div
        className="mono"
        style={{
          position: 'absolute',
          bottom: 8,
          left: 24,
          color: 'var(--muted)',
          fontSize: 9,
          opacity: hover ? 1 : 0.4,
          transition: 'opacity 0.3s',
        }}
      >
        {market.coords}
      </div>
    </div>
  )
}

export default function Markets({ onNav }: MarketsProps) {
  return (
    <section
      id="markets"
      className="hm-section"
      style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}
    >
      <div className="hm-container">
        <div className="section-head">
          <div>
            <div className="eyebrow">Markets</div>
          </div>
          <h2>
            Not a UK company.
            <br />A company from the UK, for the world.
          </h2>
        </div>

        <div
          className="markets-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 0,
            borderTop: '1px solid var(--line)',
            borderLeft: '1px solid var(--line)',
          }}
        >
          {markets.map((m, i) => (
            <MarketCard key={m.id} market={m} index={i} />
          ))}
        </div>

        <div
          style={{
            marginTop: 64,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 24,
          }}
        >
          <p
            className="serif"
            style={{
              fontSize: 28,
              maxWidth: 640,
              margin: 0,
              fontStyle: 'italic',
              color: 'var(--ink-2)',
            }}
          >
            “We act as the intermediary between manufacturers and consumers — one partner, every border, one
            accountable hand on the shipment.”
          </p>
          <button className="hm-btn hm-btn-ghost" onClick={() => onNav('process')}>
            See how sourcing works <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  )
}
