'use client'

import { useCallback, useEffect, useState } from 'react'
import Nav from '@/components/marketing/Nav'
import Hero from '@/components/marketing/Hero'
import About from '@/components/marketing/About'
import Markets from '@/components/marketing/Markets'
import Products from '@/components/marketing/Products'
import Process from '@/components/marketing/Process'
import Contact from '@/components/marketing/Contact'
import Footer from '@/components/marketing/Footer'
import QuoteModal from '@/components/marketing/QuoteModal'
import '@/components/marketing/marketing.css'

export default function MarketingHome() {
  const [quoteOpen, setQuoteOpen] = useState(false)

  const nav = useCallback((id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.getElementById(id)
    if (el) {
      const rect = el.getBoundingClientRect()
      window.scrollTo({ top: window.scrollY + rect.top - 72, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('in')
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -80px 0px' }
    )
    document.querySelectorAll('.heritage-marketing .reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="heritage-marketing">
      <Nav onNav={nav} onQuote={() => setQuoteOpen(true)} />
      <Hero onQuote={() => setQuoteOpen(true)} onNav={nav} />
      <About />
      <Markets onNav={nav} />
      <Products onQuote={() => setQuoteOpen(true)} />
      <Process />
      <Contact />
      <Footer />
      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </div>
  )
}
