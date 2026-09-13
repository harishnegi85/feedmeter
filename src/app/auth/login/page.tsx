'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email to confirm your account, then sign in.')
        setMode('login')
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-57px)] px-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-xl font-bold mb-1">
          {mode === 'login' ? 'Presenter Login' : 'Create Account'}
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login' ? 'Sign in to manage your sessions' : 'Free forever for presenters'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#7f1d1d30', color: '#fca5a5', border: '1px solid #7f1d1d' }}>
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#052e16', color: '#4ade80', border: '1px solid #166534' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          <button type="submit" className="btn-primary justify-center" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
            style={{ color: '#a78bfa', fontWeight: 600 }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
