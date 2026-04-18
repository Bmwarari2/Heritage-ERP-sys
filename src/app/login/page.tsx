'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createSupabaseBrowserClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push(nextPath)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card-flat p-6 sm:p-8 space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="form-label">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="form-input"
          placeholder="you@heritage.co.ke"
        />
      </div>

      <div>
        <label className="form-label">Password</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="form-input"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full py-2.5"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Ambient background shield watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[520px] h-[560px] opacity-[0.05]">
          <Image src="/logo-mark.svg" alt="" width={520} height={560} aria-hidden />
        </div>
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 px-6 py-4 mb-4">
            <Image src="/logo.svg" alt="Heritage Global Solutions Ltd" width={260} height={124} priority />
          </div>
          <p className="text-sm text-slate-500">Trade ERP — Sign in to continue</p>
        </div>

        <Suspense fallback={<div className="card-flat p-8 text-center text-sm text-slate-500">Loading…</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-xs text-slate-400 text-center mt-6">
          Heritage Global Solutions Ltd. · Authorised access only.
        </p>
      </div>
    </div>
  )
}
