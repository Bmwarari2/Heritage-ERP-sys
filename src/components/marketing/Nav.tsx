'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface NavProps {
  onNav: (id: string) => void
  onQuote: () => void
}

export default function Nav({ onNav, onQuote }: NavProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    h()
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const items = [
    { id: 'about', label: 'About' },
    { id: 'markets', label: 'Markets' },
    { id: 'products', label: 'Products' },
    { id: 'process', label: 'Process' },
    { id: 'contact', label: 'Contact' },
  ]

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? 'color-mix(in srgb, var(--bg) 85%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px) saturate(140%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(140%)' : 'none',
        borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
        transition: 'all 0.3s',
      }}
    >
      <div
        className="hm-container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}
      >
        <a
          href="#top"
          onClick={e => {
            e.preventDefault()
            onNav('top')
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              background: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--serif)',
              fontSize: 20,
              borderRadius: 2,
            }}
          >
            H
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 19, letterSpacing: '-0.01em' }}>Heritage</span>
            <span
              style={{
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginTop: 3,
              }}
            >
              Global Solutions
            </span>
          </div>
        </a>

        <nav className="nav-items" style={{ display: 'flex', gap: 36, fontSize: 13 }}>
          {items.map(it => (
            <a
              key={it.id}
              href={`#${it.id}`}
              onClick={e => {
                e.preventDefault()
                onNav(it.id)
              }}
              style={{ color: 'var(--ink-2)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-2)')}
            >
              {it.label}
            </a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/login"
            style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 50,
                background: '#4caf50',
                display: 'inline-block',
              }}
            />
            ERP Portal
          </Link>
          <button className="hm-btn hm-btn-primary" onClick={onQuote}>
            Request a quote <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </header>
  )
}
