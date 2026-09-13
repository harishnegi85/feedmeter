import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import SessionActions from './SessionActions'
import type { Question } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  mcq: '📊 Multiple Choice',
  rating: '⭐ Rating',
  word_cloud: '☁️ Word Cloud',
  open_text: '💬 Open Text',
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('presenter_id', user.id)
    .single()

  if (!session) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', id)
    .order('order_index')

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} className="mb-2 inline-block hover:text-white">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`badge badge-${session.status}`}>{session.status}</span>
            <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
              Code: <span style={{ color: '#a78bfa', fontWeight: 700 }}>{session.code}</span>
            </span>
          </div>
        </div>
        <SessionActions session={session} />
      </div>

      {/* Join link info */}
      <div className="card mb-6" style={{ background: '#0d1f1a', borderColor: '#14532d' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#4ade80' }}>Audience join link</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Share this code: <span className="font-mono font-bold text-white text-lg">{session.code}</span>
          &nbsp; or send them to <span className="font-mono text-white">/join/{session.code}</span>
        </p>
      </div>

      <h2 className="font-bold mb-4">Questions ({questions?.length ?? 0})</h2>

      {!questions || questions.length === 0 ? (
        <div className="card text-center py-8" style={{ color: 'var(--text-muted)' }}>
          No questions added yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(questions as Question[]).map((q, i) => (
            <div key={q.id} className="card">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--primary)', color: 'white' }}>
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium mb-1">{q.prompt}</p>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{TYPE_LABELS[q.type]}</span>
                  {q.options && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {q.options.map((opt: string) => (
                        <span key={opt} className="px-2 py-0.5 rounded text-xs"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
