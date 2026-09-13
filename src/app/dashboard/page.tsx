import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Session } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('presenter_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Sessions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
        </div>
        <Link href="/dashboard/new" className="btn-primary">
          + New Session
        </Link>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🎤</div>
          <h2 className="text-lg font-semibold mb-2">No sessions yet</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Create your first session and start collecting live feedback
          </p>
          <Link href="/dashboard/new" className="btn-primary">
            Create Session
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(sessions as Session[]).map(session => (
            <div key={session.id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold truncate">{session.title}</span>
                    <span className={`badge badge-${session.status}`}>{session.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>Code: <span className="font-mono font-bold" style={{ color: '#a78bfa' }}>{session.code}</span></span>
                    <span>{new Date(session.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/session/${session.id}`} className="btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>
                  Edit
                </Link>
                {session.status !== 'draft' && (
                  <Link href={`/session/${session.id}/present`} className="btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>
                    Present
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
