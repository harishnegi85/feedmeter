'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateParticipantId } from '@/lib/utils'
import type { Session, Question } from '@/lib/types'

interface Props {
  session: Session
  questions: Question[]
}

export default function AudienceView({ session, questions }: Props) {
  const [currentIndex, setCurrentIndex] = useState(session.active_question_index)
  const [sessionStatus, setSessionStatus] = useState(session.status)
  const [participantId, setParticipantId] = useState<string>('')
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())
  const [answer, setAnswer] = useState('')
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [registeredParticipant, setRegisteredParticipant] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const pid = getOrCreateParticipantId()
    setParticipantId(pid)

    // Register participant
    supabase.from('participants').upsert({ id: pid, session_id: session.id }, { onConflict: 'id' }).then(() => {
      setRegisteredParticipant(true)
    })

    // Load already-submitted question IDs from this device
    supabase.from('responses')
      .select('question_id')
      .eq('participant_id', pid)
      .then(({ data }) => {
        if (data) setSubmitted(new Set(data.map(r => r.question_id)))
      })

    // Subscribe to session changes (question navigation + status)
    const channel = supabase
      .channel(`audience-${session.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${session.id}`,
      }, (payload) => {
        setCurrentIndex(payload.new.active_question_index)
        setSessionStatus(payload.new.status)
        setAnswer('')
        setRating(0)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.id])

  const currentQuestion = questions[currentIndex]
  const alreadySubmitted = currentQuestion ? submitted.has(currentQuestion.id) : false

  async function submitResponse() {
    if (!currentQuestion || !participantId || submitting || alreadySubmitted) return

    let value = ''
    if (currentQuestion.type === 'rating') {
      if (rating === 0) return
      value = String(rating)
    } else {
      if (!answer.trim()) return
      value = answer.trim()
    }

    setSubmitting(true)
    const { error } = await supabase.from('responses').upsert({
      question_id: currentQuestion.id,
      participant_id: participantId,
      value,
    }, { onConflict: 'question_id,participant_id' })

    if (!error) {
      setSubmitted(prev => new Set([...prev, currentQuestion.id]))
      setAnswer('')
      setRating(0)
    }
    setSubmitting(false)
  }

  if (sessionStatus === 'ended') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-57px)] px-4">
        <div className="card text-center max-w-sm w-full">
          <div className="text-4xl mb-3">🏁</div>
          <h2 className="text-xl font-bold mb-2">Session ended</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Thanks for participating in <strong>{session.title}</strong>!</p>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-57px)] px-4">
        <div className="card text-center max-w-sm w-full">
          <div className="text-3xl mb-3">⏳</div>
          <h2 className="font-bold mb-2">Waiting for the presenter...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10 min-h-[calc(100vh-57px)]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {session.title}
        </p>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-6">{currentQuestion.prompt}</h2>

        {alreadySubmitted ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold">Response submitted!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Waiting for the next question...</p>
          </div>
        ) : (
          <>
            {currentQuestion.type === 'mcq' && (
              <div className="flex flex-col gap-2">
                {(currentQuestion.options ?? []).map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => setAnswer(opt)}
                    className="w-full text-left px-4 py-3 rounded-lg font-medium transition-all text-sm"
                    style={{
                      background: answer === opt ? 'var(--primary)' : 'var(--surface-2)',
                      border: `2px solid ${answer === opt ? 'var(--primary)' : 'var(--border)'}`,
                      color: answer === opt ? 'white' : 'var(--text)',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'rating' && (
              <div className="flex justify-center gap-3 py-4">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className="text-4xl transition-transform hover:scale-110"
                    style={{ opacity: n <= rating ? 1 : 0.3, filter: n <= rating ? 'none' : 'grayscale(1)' }}
                  >
                    ★
                  </button>
                ))}
              </div>
            )}

            {(currentQuestion.type === 'word_cloud' || currentQuestion.type === 'open_text') && (
              <textarea
                className="input"
                rows={currentQuestion.type === 'open_text' ? 4 : 2}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder={currentQuestion.type === 'word_cloud' ? 'Type one or a few words...' : 'Type your answer...'}
              />
            )}

            <button
              onClick={submitResponse}
              className="btn-primary w-full justify-center mt-4"
              disabled={submitting || (currentQuestion.type === 'rating' ? rating === 0 : !answer.trim())}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
