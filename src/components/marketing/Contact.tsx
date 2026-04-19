'use client'

const contacts: { label: string; value: string; href?: string }[] = [
  { label: 'Phone', value: '+44 7428 77090', href: 'tel:+447428770900' },
  { label: 'Email', value: 'hello@heritage-global.co.uk', href: 'mailto:hello@heritage-global.co.uk' },
  { label: 'Head office', value: '8 Avon Gardens, Cottam,\nPreston, PR4 0NR, United Kingdom' },
  { label: 'Hours', value: 'Mon–Fri · 08:00–18:00 GMT\nSat · by appointment' },
]

export default function Contact() {
  return (
    <section
      id="contact"
      className="hm-section"
      style={{ background: 'var(--ink)', color: 'var(--bg)', borderTop: '1px solid var(--line)' }}
    >
      <div className="hm-container">
        <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 80 }}>
          <div>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Contact
            </div>
            <h2
              className="serif"
              style={{
                fontSize: 'clamp(48px, 6vw, 88px)',
                lineHeight: 0.95,
                margin: '20px 0 0',
                letterSpacing: '-0.02em',
                fontWeight: 400,
                color: 'var(--bg)',
              }}
            >
              Tell us what you need moved.<br />
              <span style={{ fontStyle: 'italic', color: 'var(--primary-2)' }}>We’ll take it from there.</span>
            </h2>
            <p style={{ fontSize: 18, maxWidth: 520, marginTop: 24, color: 'rgba(255,255,255,0.7)' }}>
              Call, email, or send a written brief. A real person replies within the working day — usually faster.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {contacts.map(c => (
              <div key={c.label} style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
                <div className="mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {c.label}
                </div>
                {c.href ? (
                  <a
                    href={c.href}
                    style={{
                      color: 'var(--bg)',
                      fontSize: 22,
                      marginTop: 6,
                      display: 'block',
                      fontFamily: 'var(--serif)',
                    }}
                  >
                    {c.value}
                  </a>
                ) : (
                  <div
                    style={{
                      color: 'var(--bg)',
                      fontSize: 18,
                      marginTop: 6,
                      whiteSpace: 'pre-line',
                      fontFamily: 'var(--serif)',
                    }}
                  >
                    {c.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
