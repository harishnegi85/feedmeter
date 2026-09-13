'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Nav() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // createClient() only runs in the browser (never during SSR/static gen)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      className="px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl font-black"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          FeedMeter
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <Link href="/join"
          style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}
          className="hover:text-white transition-colors">
          Join Session
        </Link>
        {user ? (
          <>
            <Link href="/dashboard" className="btn-secondary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}>
              Dashboard
            </Link>
            <button onClick={signOut} className="btn-danger">Sign out</button>
          </>
        ) : (
          <Link href="/auth/login" className="btn-primary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}>
            Presenter Login
          </Link>
        )}
      </div>
    </nav>
  )
}
