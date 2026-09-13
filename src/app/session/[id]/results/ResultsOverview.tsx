'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ChartForQuestion from '@/components/ChartForQuestion'
import { countValues, getMostCommon } from '@/lib/utils'
import Link from 'next/link'
import type { Session, Question, Response } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  mcq: '📊 Multiple Choice',
  rating: '⭐ Rating',
  word_cloud: '☁️ Word Cloud',
  open_text: '💬 Open Text',
}

interface Props {
  session: Session
  questions: Question[]
  initialResponses: Response[]
  initialParticipantCount: number
}

export default function ResultsOverview({ session, questions, initialResponses, initialParticipantCount }: Props) {
  const [responses, setResponses] = useState<Response[]>(initialResponses)
  const [participantCount, setParticipantCount] = useState(initialParticipantCount)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`results-${session.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses' },
        (payload) => setResponses(prev => [...prev, payload.new as Response])
      )
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'participants',
        filter: `session_id=eq.${session.id}`,
      }, () => setParticipantCount(prev => prev + 1))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.id])

  const totalResponses = responses.length
  const answeredQuestions = questions.filter(q => responses.some(r => r.question_id === q.id)).length

  return (
    <div style={{ minHeight: 'calc(100vh - 57px)', background: 'var(--background)' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <Link href={`/session/${session.id}/present`}
            style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} className="hover:text-white">
            ← Present View
          </Link>
          <div>
            <span className="font-semibold">{session.title}</span>
            <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>Results Overview</span>
          </div>
        </div>
        <span className="font-mono text-sm font-bold" style={{ color: '#a78bfa' }}>
          Code: {session.code}
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Participants', value: participantCount, icon: '👥' },
            { label: 'Total Responses', value: totalResponses, icon: '💬' },
            { label: 'Questions Answered', value: `${answeredQuestions} / ${questions.length}`, icon: '✅' },
          ].map(stat => (
            <div key={stat.label} className="card text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-3xl font-black mb-1">{stat.value}</div>
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Questions grid */}
        <h2 className="text-lg font-bold mb-5">All Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {questions.map((q, i) => {
            const qResponses = responses.filter(r => r.question_id === q.id)
            const mostCommon = getMostCommon(qResponses)
            const highlight = getHighlight(q, qResponses, mostCommon)

            return (
              <div key={q.id} className="card flex flex-col gap-4">
                {/* Question header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{ background: 'var(--primary)', color: 'white' }}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug">{q.prompt}</p>
                      <span className="text-xs mt-0.5 inline-block" style={{ color: 'var(--text-muted)' }}>
                        {TYPE_LABELS[q.type]}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs shrink-0 font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {qResponses.length} resp.
                  </span>
                </div>

                {/* Chart */}
                <ChartForQuestion question={q} responses={qResponses} compact />

                {/* Highlight — most common / average */}
                {highlight && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                    style={{ background: '#1e1433', border: '1px solid #4c1d95' }}>
                    <span>🏆</span>
                    <span style={{ color: '#c4b5fd' }}>{highlight}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-10">
          <Link href={`/session/${session.id}/present`} className="btn-secondary">
            ← Back to Present
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

function getHighlight(q: Question, responses: Response[], mostCommon: string | null): string | null {
  if (responses.length === 0) return null

  if (q.type === 'mcq' && mostCommon) {
    const counts = countValues(responses)
    const total = responses.length
    const pct = Math.round((counts[mostCommon] / total) * 100)
    return `Most voted: "${mostCommon}" — ${pct}% of respondents`
  }

  if (q.type === 'rating') {
    const avg = responses.reduce((s, r) => s + parseInt(r.value), 0) / responses.length
    const counts = countValues(responses)
    const topRating = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return `Average: ${avg.toFixed(1)} ★ · Most common: ${topRating[0]} ★ (${topRating[1]} votes)`
  }

  if (q.type === 'word_cloud' && mostCommon) {
    return `Top word: "${mostCommon}"`
  }

  if (q.type === 'open_text') {
    return `${responses.length} open response${responses.length !== 1 ? 's' : ''} collected`
  }

  return null
}
