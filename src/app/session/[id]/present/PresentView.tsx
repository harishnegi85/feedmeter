'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ChartForQuestion from '@/components/ChartForQuestion'
import Link from 'next/link'
import type { Session, Question, Response } from '@/lib/types'

interface Props {
  session: Session
  questions: Question[]
  initialResponses: Response[]
}

export default function PresentView({ session, questions, initialResponses }: Props) {
  const [responses, setResponses] = useState<Response[]>(initialResponses)
  const [currentIndex, setCurrentIndex] = useState(session.active_question_index)
  const [participantCount, setParticipantCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`present-${session.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses' },
        (payload) => setResponses(prev => [...prev, payload.new as Response])
      )
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'participants',
        filter: `session_id=eq.${session.id}`,
      }, () => setParticipantCount(prev => prev + 1))
      .subscribe()

    supabase
      .from('participants')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id)
      .then(({ count }) => setParticipantCount(count ?? 0))

    return () => { supabase.removeChannel(channel) }
  }, [session.id])

  async function navigate(dir: 'prev' | 'next') {
    const newIndex = dir === 'next'
      ? Math.min(currentIndex + 1, questions.length - 1)
      : Math.max(currentIndex - 1, 0)
    setCurrentIndex(newIndex)
    await supabase.from('sessions').update({ active_question_index: newIndex }).eq('id', session.id)
  }

  const currentQuestion = questions[currentIndex]
  const currentResponses = responses.filter(r => r.question_id === currentQuestion?.id)
  const isLastQuestion = currentIndex === questions.length - 1

  return (
    <div style={{ minHeight: 'calc(100vh - 57px)', background: 'var(--background)' }}>
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <Link href={`/session/${session.id}`} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}
            className="hover:text-white">
            ← Back
          </Link>
          <span className="font-semibold truncate">{session.title}</span>
        </div>
        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>👥 {participantCount} joined</span>
          <span className="font-mono" style={{ color: '#a78bfa', fontWeight: 700 }}>
            Code: {session.code}
          </span>
          <span>{currentIndex + 1} / {questions.length}</span>
          <Link href={`/session/${session.id}/results`} className="btn-secondary"
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
            Results Overview
          </Link>
        </div>
      </div>

      {!currentQuestion ? (
        <div className="flex items-center justify-center h-64 text-center" style={{ color: 'var(--text-muted)' }}>
          No questions in this session.
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            Question {currentIndex + 1} of {questions.length}
          </div>
          <h2 className="text-3xl font-bold mb-2">{currentQuestion.prompt}</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            {currentResponses.length} response{currentResponses.length !== 1 ? 's' : ''}
          </p>

          <div className="card mb-8" style={{ minHeight: 300 }}>
            <ChartForQuestion question={currentQuestion} responses={currentResponses} />
          </div>

          <div className="flex justify-between items-center">
            <button onClick={() => navigate('prev')} className="btn-secondary" disabled={currentIndex === 0}>
              ← Previous
            </button>

            {isLastQuestion ? (
              <Link href={`/session/${session.id}/results`} className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                View Results Overview →
              </Link>
            ) : (
              <button onClick={() => navigate('next')} className="btn-primary">
                Next →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
