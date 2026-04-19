'use client'

import Link from 'next/link'

const columns = [
  { h: 'Company', items: ['About', 'Process', 'Careers', 'Press'] },
  { h: 'Markets', items: ['United States', 'Europe', 'China', 'Australia'] },
  { h: 'Tools', items: ['ERP Portal', 'Track shipment', 'Supplier login', 'Document vault'] },
]

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--ink)',
        color: 'rgba(255,255,255,0.6)',
        paddingTop: 60,
        paddingBottom: 40,
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="hm-container">
        <div
          className="footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: 40,
            paddingBottom: 40,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  background: 'var(--primary-2)',
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
              <div style={{ color: 'var(--bg)', fontFamily: 'var(--serif)', fontSize: 22 }}>
                Heritage Global Solutions
              </div>
            </div>
            <p style={{ maxWidth: 360, fontSize: 13, lineHeight: 1.55, marginTop: 20 }}>
              A global intermediary sourcing mining equipment, machinery, motors, engines, pumps and automotive
              parts — moved to four continents from a single UK base.
            </p>
          </div>
          {columns.map(col => (
            <div key={col.h}>
              <div className="mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {col.h}
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '16px 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {col.items.map(it => {
                  if (it === 'ERP Portal') {
                    return (
                      <li key={it}>
                        <Link href="/login" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                          {it}
                        </Link>
                      </li>
                    )
                  }
                  return (
                    <li key={it}>
                      <a
                        href="#"
                        onClick={e => e.preventDefault()}
                        style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}
                      >
                        {it}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div className="mono" style={{ fontSize: 10 }}>
            © {new Date().getFullYear()} Heritage Global Solutions Ltd — registered in England
          </div>
          <div className="mono" style={{ fontSize: 10 }}>
            UK · USA · EU · CN · AU
          </div>
        </div>
      </div>
    </footer>
  )
}
