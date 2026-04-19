'use client'

export default function About() {
  const pillars = [
    {
      title: 'We specialise',
      body: 'Deep expertise in mining equipment. Long relationships with manufacturers across every major producing region.',
    },
    {
      title: 'We take on risk',
      body: 'Inspection, paperwork, export clearance and freight sit with us — not on your operations team.',
    },
    {
      title: 'We speak trade',
      body: 'Incoterms, HS codes, cargo insurance, consular invoices — we handle the fine print so you handle the work.',
    },
    {
      title: 'We move together',
      body: 'One project manager, one escalation path. You call one number, not a freight forwarder and three agents.',
    },
  ]

  const sources = [
    'Mining equipment (specialty)',
    'Heavy machinery',
    'Car parts & automotive',
    'Electric motors',
    'Combustion engines',
    'Industrial pumps',
  ]

  return (
    <section id="about" className="hm-section">
      <div className="hm-container">
        <div className="section-head">
          <div>
            <div className="eyebrow">About</div>
          </div>
          <h2>
            Between the maker and the market
            <br />— we hold the line.
          </h2>
        </div>

        <div
          className="about-grid"
          style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 80, alignItems: 'start' }}
        >
          <div>
            <p
              style={{
                fontSize: 22,
                lineHeight: 1.4,
                color: 'var(--ink)',
                margin: 0,
                fontFamily: 'var(--serif)',
                letterSpacing: '-0.005em',
              }}
            >
              Heritage is a global shipping company that makes sourcing items from different parts of the world
              effortless. We buy on your behalf from factories we know personally, inspect before it leaves the
              floor, and move it to your yard with a single line of accountability.
            </p>

            <div
              style={{
                marginTop: 48,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 32,
              }}
            >
              {pillars.map((b, i) => (
                <div key={i} style={{ paddingTop: 20, borderTop: '1px solid var(--line)' }}>
                  <div className="mono" style={{ color: 'var(--primary)' }}>
                    0{i + 1}
                  </div>
                  <div className="serif" style={{ fontSize: 22, marginTop: 10, letterSpacing: '-0.01em' }}>
                    {b.title}
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 10 }}>{b.body}</p>
                </div>
              ))}
            </div>
          </div>

          <aside style={{ position: 'sticky', top: 100 }}>
            <div className="placeholder" data-label="Operations floor · Preston" style={{ height: 320 }} />
            <div
              style={{
                marginTop: 20,
                padding: 24,
                background: 'var(--bg-2)',
                borderLeft: '2px solid var(--primary)',
              }}
            >
              <div className="mono" style={{ color: 'var(--muted)' }}>
                What we source
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
                {sources.map((t, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 14,
                      paddingBottom: 10,
                      borderBottom: '1px dashed var(--line)',
                    }}
                  >
                    <span>{t}</span>
                    <span className="mono" style={{ color: 'var(--muted)' }}>
                      / 0{i + 1}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
