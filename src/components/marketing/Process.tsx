'use client'

const steps = [
  {
    n: '01',
    title: 'Brief',
    desc: 'Tell us what you need — line items, spec sheets, target market. We respond with a sourcing plan within 48 hours.',
  },
  {
    n: '02',
    title: 'Source',
    desc: 'We shortlist manufacturers we have personally audited. You see options with quotes, lead times and QC history.',
  },
  {
    n: '03',
    title: 'Inspect',
    desc: 'Before anything leaves the factory, our people on the ground verify spec, run tests and photograph the unit.',
  },
  {
    n: '04',
    title: 'Ship',
    desc: 'Freight, insurance, customs and last-mile. One invoice. One point of contact. Tracked end to end.',
  },
  {
    n: '05',
    title: 'Land',
    desc: 'Delivered to your yard. Sign-off only when the equipment works. Aftercare available on every unit.',
  },
]

export default function Process() {
  return (
    <section id="process" className="hm-section" style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--line)' }}>
      <div className="hm-container">
        <div className="section-head">
          <div>
            <div className="eyebrow">Process</div>
          </div>
          <h2>
            Five steps.
            <br />
            One accountable partner.
          </h2>
        </div>

        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: '10%',
              right: '10%',
              height: 1,
              background: 'var(--line)',
            }}
          />
          <div
            className="process-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24 }}
          >
            {steps.map((s, i) => (
              <div key={i} style={{ position: 'relative', paddingTop: 44 }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 0,
                    width: 16,
                    height: 16,
                    borderRadius: 50,
                    background: 'var(--primary)',
                    border: '4px solid var(--bg-2)',
                  }}
                />
                <div className="mono" style={{ color: 'var(--primary)' }}>
                  {s.n}
                </div>
                <div className="serif" style={{ fontSize: 28, marginTop: 8, letterSpacing: '-0.01em' }}>
                  {s.title}
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 12 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
