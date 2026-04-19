'use client'

import { useState } from 'react'

interface Category {
  id: string
  name: string
  tag: string
  count: number
  items: string[]
  img: string
}

const categories: Category[] = [
  { id: 'mining', name: 'Mining equipment', tag: 'Speciality', count: 48, items: ['Haul trucks', 'Loaders', 'Drill rigs', 'Crushers', 'Conveyors', 'Hydraulic shovels'], img: 'CAT 793 haul truck' },
  { id: 'machinery', name: 'Heavy machinery', tag: 'Industrial', count: 32, items: ['Excavators', 'Cranes', 'Generators', 'Compressors'], img: 'excavator · yard' },
  { id: 'motors', name: 'Electric motors', tag: 'Industrial', count: 71, items: ['AC induction', 'DC servo', 'Brushless', 'Stepper', 'High-torque'], img: 'motor bank · racked' },
  { id: 'engines', name: 'Combustion engines', tag: 'Industrial', count: 26, items: ['Marine diesel', 'Stationary gas', 'Genset', 'Industrial petrol'], img: 'marine diesel block' },
  { id: 'pumps', name: 'Industrial pumps', tag: 'Industrial', count: 54, items: ['Centrifugal', 'Submersible', 'Slurry', 'Diaphragm', 'Gear'], img: 'slurry pump · mining' },
  { id: 'auto', name: 'Car parts', tag: 'Automotive', count: 210, items: ['OEM engines', 'Transmissions', 'Suspension', 'Body panels', 'Electronics'], img: 'parts catalogue' },
]

const tags = ['All', 'Speciality', 'Industrial', 'Automotive']

function ProductCard({ cat, i }: { cat: Category; i: number }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 24,
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        transition: 'all 0.3s',
        transform: hover ? 'translateY(-4px)' : 'none',
        boxShadow: hover ? '0 20px 40px rgba(0,0,0,0.06)' : 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minHeight: 420,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="mono" style={{ color: 'var(--primary)' }}>
          / {cat.tag}
        </span>
        <span className="mono" style={{ color: 'var(--muted)' }}>
          {String(i + 1).padStart(2, '0')}
        </span>
      </div>
      <div className="placeholder" data-label={cat.img} style={{ height: 160 }} />
      <div>
        <div className="serif" style={{ fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
          {cat.name}
        </div>
        <div className="mono" style={{ color: 'var(--muted)', marginTop: 6 }}>
          {cat.count} skus catalogued
        </div>
      </div>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        {cat.items.map(it => (
          <li
            key={it}
            style={{
              fontSize: 11,
              padding: '4px 10px',
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 40,
              color: 'var(--ink-2)',
            }}
          >
            {it}
          </li>
        ))}
      </ul>
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          borderTop: '1px solid var(--line)',
        }}
      >
        <span className="mono" style={{ color: 'var(--muted)' }}>
          Request catalogue
        </span>
        <span style={{ transform: hover ? 'translateX(4px)' : 'none', transition: 'transform 0.2s' }}>→</span>
      </div>
    </div>
  )
}

function AnythingElseCard({ onQuote }: { onQuote: () => void }) {
  const [hover, setHover] = useState(false)
  const examples = [
    'Conveyor belts',
    'Bearings',
    'Gearboxes',
    'Compressors',
    'Hydraulic hoses',
    'Welding rigs',
    'Steel plate',
    'Tyres',
    'Control systems',
    'Spare parts',
    'Lubricants',
    'Tooling',
  ]
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onQuote}
      style={{
        padding: 24,
        background: 'var(--bg)',
        border: '1px dashed var(--primary)',
        transition: 'all 0.3s',
        transform: hover ? 'translateY(-4px)' : 'none',
        boxShadow: hover ? '0 20px 40px rgba(0,0,0,0.06)' : 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minHeight: 420,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="mono" style={{ color: 'var(--primary)' }}>
          / And much more
        </span>
        <span className="mono" style={{ color: 'var(--muted)' }}>
          ++
        </span>
      </div>
      <div
        style={{
          height: 160,
          border: '1px solid var(--line)',
          background: 'var(--bg-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, var(--line-2) 1px, transparent 1px),
              linear-gradient(to bottom, var(--line-2) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
        <span
          className="serif"
          style={{
            fontSize: 54,
            lineHeight: 1,
            fontStyle: 'italic',
            color: 'var(--primary)',
            position: 'relative',
            letterSpacing: '-0.02em',
          }}
        >
          + anything else
        </span>
      </div>
      <div>
        <div className="serif" style={{ fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
          Can’t see what you need?
        </div>
        <div className="mono" style={{ color: 'var(--muted)', marginTop: 6 }}>
          We source a huge variety beyond this list
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {examples.map(it => (
          <li
            key={it}
            style={{
              fontSize: 11,
              padding: '4px 10px',
              background: 'var(--bg-2)',
              border: '1px solid var(--line)',
              borderRadius: 40,
              color: 'var(--ink-2)',
            }}
          >
            {it}
          </li>
        ))}
      </ul>
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          borderTop: '1px solid var(--line)',
        }}
      >
        <span className="mono" style={{ color: 'var(--primary)' }}>
          Ask us about anything
        </span>
        <span
          style={{
            transform: hover ? 'translateX(4px)' : 'none',
            transition: 'transform 0.2s',
            color: 'var(--primary)',
          }}
        >
          →
        </span>
      </div>
    </div>
  )
}

interface ProductsProps {
  onQuote: () => void
}

export default function Products({ onQuote }: ProductsProps) {
  const [filter, setFilter] = useState('All')
  const visible = filter === 'All' ? categories : categories.filter(c => c.tag === filter)

  return (
    <section id="products" className="hm-section">
      <div className="hm-container">
        <div className="section-head">
          <div>
            <div className="eyebrow">Products & Categories</div>
          </div>
          <h2>
            Six core categories —<br />
            and far beyond.
          </h2>
        </div>

        <p
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            maxWidth: 760,
            marginTop: -32,
            marginBottom: 48,
          }}
        >
          These are the categories we move most — but our sourcing network is much wider. If it’s industrial,
          mechanical, or built for heavy work, ask us. We’ve shipped it, or we know who builds it.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 4 }}>
            {tags.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  fontFamily: 'var(--mono)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: '1px solid var(--line)',
                  background: filter === t ? 'var(--ink)' : 'transparent',
                  color: filter === t ? 'var(--bg)' : 'var(--ink-2)',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mono" style={{ color: 'var(--muted)' }}>
            Showing {visible.length} / {categories.length}
          </div>
        </div>

        <div
          className="products-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}
        >
          {visible.map((c, i) => (
            <ProductCard key={c.id} cat={c} i={i} />
          ))}
          {filter === 'All' && <AnythingElseCard onQuote={onQuote} />}
        </div>
      </div>
    </section>
  )
}
