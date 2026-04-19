'use client'

import { useEffect, useState } from 'react'

interface QuoteModalProps {
  open: boolean
  onClose: () => void
}

interface QuoteData {
  category: string
  itemDesc: string
  quantity: string
  origin: string
  destination: string
  timeline: string
  company: string
  name: string
  email: string
  phone: string
  notes: string
}

const emptyData: QuoteData = {
  category: '',
  itemDesc: '',
  quantity: '',
  origin: '',
  destination: '',
  timeline: '',
  company: '',
  name: '',
  email: '',
  phone: '',
  notes: '',
}

const stepLabels = ['Category', 'Details', 'Shipping', 'Contact', 'Review']

const categories = [
  { id: 'mining', label: 'Mining equipment', hint: 'Our speciality' },
  { id: 'machinery', label: 'Heavy machinery', hint: 'Industrial plant' },
  { id: 'motors', label: 'Electric motors', hint: 'All classes' },
  { id: 'engines', label: 'Combustion engines', hint: 'Marine · stationary' },
  { id: 'pumps', label: 'Industrial pumps', hint: 'Slurry · centrifugal' },
  { id: 'auto', label: 'Car parts', hint: 'OEM & aftermarket' },
  { id: 'other', label: 'Something else', hint: 'We source a huge variety — just ask' },
]

const origins = ['China', 'Europe', 'United States', 'United Kingdom', 'Australia', 'Other / we advise']
const timelines = ['ASAP (< 4 weeks)', 'Standard (4–10 weeks)', 'Planned (10+ weeks)', 'Flexible']

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  multiline?: boolean
}) {
  const style: React.CSSProperties = {
    padding: '12px 14px',
    border: '1px solid var(--line)',
    background: 'var(--bg)',
    color: 'var(--ink)',
    fontFamily: 'inherit',
    fontSize: 14,
    borderRadius: 2,
    outline: 'none',
    resize: 'vertical',
  }
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="mono" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={style}
          onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--line)')}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={style}
          onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--line)')}
        />
      )}
    </label>
  )
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="mono" style={{ color: 'var(--muted)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(o => (
          <button
            key={o}
            onClick={() => onChange(o)}
            style={{
              padding: '8px 14px',
              fontSize: 13,
              border: '1px solid ' + (value === o ? 'var(--primary)' : 'var(--line)'),
              background: value === o ? 'color-mix(in srgb, var(--primary) 10%, var(--bg))' : 'var(--bg)',
              color: 'var(--ink)',
              borderRadius: 2,
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function QuoteModal({ open, onClose }: QuoteModalProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<QuoteData>(emptyData)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const update = <K extends keyof QuoteData>(k: K, v: QuoteData[K]) => setData(d => ({ ...d, [k]: v }))

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  if (!open) return null

  const canNext = () => {
    if (step === 0) return !!data.category
    if (step === 1) return !!data.itemDesc && !!data.quantity
    if (step === 2) return !!data.origin && !!data.destination && !!data.timeline
    if (step === 3) return !!data.company && !!data.name && !!data.email
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/leads/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Unable to submit. Please try again.')
      }
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to submit.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep(0)
      setData(emptyData)
      setSubmitted(false)
      setError('')
    }, 200)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(10, 12, 14, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(6px)',
      }}
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="quote-modal"
        style={{
          background: 'var(--bg)',
          maxWidth: 880,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--line)',
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
        }}
      >
        <aside
          className="quote-sidebar"
          style={{ background: 'var(--bg-2)', padding: 32, borderRight: '1px solid var(--line)' }}
        >
          <div className="eyebrow" style={{ marginBottom: 24 }}>
            Quote Request
          </div>
          <div className="serif" style={{ fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            Tell us what you need.
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 16, lineHeight: 1.55 }}>
            Five quick steps. We respond with a sourcing plan within 48 hours — no call needed.
          </p>

          <ol
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '40px 0 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {stepLabels.map((s, i) => (
              <li
                key={s}
                onClick={() => i < step && setStep(i)}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid var(--line-2)',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                  fontSize: 13,
                  color: i === step ? 'var(--ink)' : i < step ? 'var(--ink-2)' : 'var(--muted)',
                  cursor: i < step ? 'pointer' : 'default',
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 50,
                    background: i <= step ? 'var(--primary)' : 'transparent',
                    border: '1px solid ' + (i <= step ? 'var(--primary)' : 'var(--line)'),
                    color: i <= step ? '#fff' : 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {i < step ? '✓' : i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>

          <div className="mono" style={{ marginTop: 40, color: 'var(--muted)', fontSize: 9 }}>
            Heritage Global Solutions
            <br />
            +44 7428 77090
            <br />
            quotes@heritage-global.co.uk
          </div>
        </aside>

        <div
          className="quote-body"
          style={{ padding: 40, display: 'flex', flexDirection: 'column', minHeight: 560 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <div className="mono" style={{ color: 'var(--muted)' }}>
              {submitted ? 'Submitted' : `Step ${step + 1} of ${stepLabels.length}`}
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: '1px solid var(--line)',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                color: 'var(--ink)',
              }}
            >
              ×
            </button>
          </div>

          <div style={{ flex: 1 }}>
            {submitted ? (
              <div>
                <h3 className="serif" style={{ fontSize: 32, margin: 0, letterSpacing: '-0.01em' }}>
                  Request received.
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 12, lineHeight: 1.55 }}>
                  A Heritage representative will reply within 48 hours. We’ve logged your brief and your contact
                  details.
                </p>
                <div
                  style={{
                    marginTop: 24,
                    padding: 20,
                    background: 'var(--bg-2)',
                    border: '1px solid var(--line)',
                    borderLeft: '2px solid var(--primary)',
                  }}
                >
                  <div className="mono" style={{ color: 'var(--muted)' }}>
                    Reference
                  </div>
                  <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 14 }}>
                    HGS-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-{data.email.slice(0, 3).toUpperCase() || 'NEW'}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {step === 0 && (
                  <div>
                    <h3 className="serif" style={{ fontSize: 32, margin: 0, letterSpacing: '-0.01em' }}>
                      What are you sourcing?
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
                      These are our core categories — but our network is much wider. Pick <em>Something else</em>{' '}
                      for anything not listed.
                    </p>
                    <div
                      className="quote-category-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 10,
                        marginTop: 20,
                      }}
                    >
                      {categories.map(c => (
                        <button
                          key={c.id}
                          onClick={() => update('category', c.id)}
                          style={{
                            textAlign: 'left',
                            padding: 18,
                            border:
                              '1px solid ' + (data.category === c.id ? 'var(--primary)' : 'var(--line)'),
                            background:
                              data.category === c.id
                                ? 'color-mix(in srgb, var(--primary) 8%, var(--bg))'
                                : 'var(--bg)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ fontSize: 15, fontWeight: 500 }}>{c.label}</div>
                          <div className="mono" style={{ color: 'var(--muted)', marginTop: 4 }}>
                            {c.hint}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h3 className="serif" style={{ fontSize: 32, margin: 0, letterSpacing: '-0.01em' }}>
                      Describe the item.
                    </h3>
                    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                      <Field
                        label="Specification / model"
                        value={data.itemDesc}
                        onChange={v => update('itemDesc', v)}
                        placeholder="e.g. CAT 793F haul truck, 240-ton class, refurbished"
                        multiline
                      />
                      <Field
                        label="Quantity"
                        value={data.quantity}
                        onChange={v => update('quantity', v)}
                        placeholder="e.g. 2 units"
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h3 className="serif" style={{ fontSize: 32, margin: 0, letterSpacing: '-0.01em' }}>
                      Where and when?
                    </h3>
                    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                      <OptionGroup
                        label="Preferred origin"
                        options={origins}
                        value={data.origin}
                        onChange={v => update('origin', v)}
                      />
                      <Field
                        label="Destination (port / yard)"
                        value={data.destination}
                        onChange={v => update('destination', v)}
                        placeholder="e.g. Port of Fremantle, Australia"
                      />
                      <OptionGroup
                        label="Timeline"
                        options={timelines}
                        value={data.timeline}
                        onChange={v => update('timeline', v)}
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h3 className="serif" style={{ fontSize: 32, margin: 0, letterSpacing: '-0.01em' }}>
                      How do we reach you?
                    </h3>
                    <div
                      className="quote-contact-grid"
                      style={{
                        marginTop: 24,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 18,
                      }}
                    >
                      <Field label="Company" value={data.company} onChange={v => update('company', v)} />
                      <Field label="Your name" value={data.name} onChange={v => update('name', v)} />
                      <Field label="Email" value={data.email} onChange={v => update('email', v)} type="email" />
                      <Field label="Phone" value={data.phone} onChange={v => update('phone', v)} />
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Field
                          label="Anything else?"
                          value={data.notes}
                          onChange={v => update('notes', v)}
                          multiline
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h3 className="serif" style={{ fontSize: 32, margin: 0, letterSpacing: '-0.01em' }}>
                      Ready to send?
                    </h3>
                    <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>
                      Review your request. You&apos;ll get a reply within 48 hours.
                    </p>
                    <div
                      className="quote-review-grid"
                      style={{
                        marginTop: 24,
                        padding: 20,
                        background: 'var(--bg-2)',
                        border: '1px solid var(--line)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                        fontSize: 13,
                      }}
                    >
                      {[
                        ['Category', categories.find(c => c.id === data.category)?.label],
                        ['Item', data.itemDesc],
                        ['Quantity', data.quantity],
                        ['Origin', data.origin],
                        ['Destination', data.destination],
                        ['Timeline', data.timeline],
                        ['Company', data.company],
                        ['Contact', `${data.name} · ${data.email}`],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <div className="mono" style={{ color: 'var(--muted)' }}>
                            {k}
                          </div>
                          <div style={{ marginTop: 4 }}>{v || '—'}</div>
                        </div>
                      ))}
                    </div>
                    {error && (
                      <div
                        style={{
                          marginTop: 16,
                          padding: 12,
                          background: '#fee',
                          border: '1px solid #fcc',
                          color: '#933',
                          fontSize: 13,
                        }}
                      >
                        {error}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {!submitted && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 32,
                paddingTop: 24,
                borderTop: '1px solid var(--line)',
              }}
            >
              <button
                className="hm-btn hm-btn-ghost"
                onClick={() => (step > 0 ? setStep(step - 1) : handleClose())}
                disabled={submitting}
              >
                ← {step > 0 ? 'Back' : 'Cancel'}
              </button>
              {step < stepLabels.length - 1 ? (
                <button
                  className="hm-btn hm-btn-primary"
                  onClick={() => canNext() && setStep(step + 1)}
                  style={{ opacity: canNext() ? 1 : 0.4, pointerEvents: canNext() ? 'auto' : 'none' }}
                >
                  Continue <span className="arrow">→</span>
                </button>
              ) : (
                <button className="hm-btn hm-btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send request'} <span className="arrow">→</span>
                </button>
              )}
            </div>
          )}

          {submitted && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 32,
                paddingTop: 24,
                borderTop: '1px solid var(--line)',
              }}
            >
              <button className="hm-btn hm-btn-primary" onClick={handleClose}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
