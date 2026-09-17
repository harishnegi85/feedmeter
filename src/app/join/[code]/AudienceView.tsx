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
  const isSelfPaced = session.mode === 'self_paced'

  // In self-paced mode: local index the audience controls themselves
  // In live mode: follows the presenter's active_question_index
  const [currentIndex, setCurrentIndex] = useState(
    isSelfPaced ? 0 : session.active_question_index
  )
  const [sessionStatus, setSessionStatus] = useState(session.status)
  const [participantId, setParticipantId] = useState<string>('')
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())
  const [answer, setAnswer] = useState('')
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [allDone, setAllDone] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const pid = getOrCreateParticipantId()
    setParticipantId(pid)

    supabase.from('participants')
      .upsert({ id: pid, session_id: session.id }, { onConflict: 'id' })

    supabase.from('responses')
      .select('question_id')
      .eq('participant_id', pid)
      .then(({ data }) => {
        if (data) setSubmitted(new Set(data.map(r => r.question_id)))
      })

    const channel = supabase
      .channel(`audience-${session.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${session.id}`,
      }, (payload) => {
        setSessionStatus(payload.new.status)
        // Only follow presenter navigation in live mode
        if (!isSelfPaced) {
          setCurrentIndex(payload.new.active_question_index)
          setAnswer('')
          setRating(0)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.id, isSelfPaced])

  const currentQuestion = questions[currentIndex]
  const alreadySubmitted = currentQuestion ? submitted.has(currentQuestion.id) : false
  const isLastQuestion = currentIndex === questions.length - 1

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

  function goToNext() {
    if (isLastQuestion) {
      setAllDone(true)
    } else {
      setCurrentIndex(prev => prev + 1)
      setAnswer('')
      setRating(0)
    }
  }

  // ── Completed all questions (self-paced) ──────────────────────────────
  if (allDone) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-57px)] px-4">
        <div className="card text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">All done!</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            You&apos;ve answered all {questions.length} questions in <strong>{session.title}</strong>. Thanks for your feedback!
          </p>
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex justify-center gap-1 mb-1">
              {questions.map((_, i) => (
                <span key={i} className="w-2 h-2 rounded-full" style={{ background: '#4ade80' }} />
              ))}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {questions.length}/{questions.length} answered
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Session ended ─────────────────────────────────────────────────────
  if (sessionStatus === 'ended') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-57px)] px-4">
        <div className="card text-center max-w-sm w-full">
          <div className="text-4xl mb-3">🏁</div>
          <h2 className="text-xl font-bold mb-2">Session ended</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Thanks for participating in <strong>{session.title}</strong>!
          </p>
        </div>
      </div>
    )
  }

  // ── Live mode: waiting for presenter ─────────────────────────────────
  if (!isSelfPaced && !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-57px)] px-4">
        <div className="card text-center max-w-sm w-full">
          <div className="text-3xl mb-3">⏳</div>
          <h2 className="font-bold mb-2">Waiting for the presenter...</h2>
        </div>
      </div>
    )
  }

  // ── Main response UI ──────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-6 py-10 min-h-[calc(100vh-57px)]">
      {/* Progress bar (self-paced only) */}
      {isSelfPaced && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            <span className="font-semibold uppercase tracking-widest">{session.title}</span>
            <span>{currentIndex + 1} of {questions.length}</span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: 'var(--surface-2)' }}>
            <div className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
              }} />
          </div>
        </div>
      )}

      {/* Header (live mode) */}
      {!isSelfPaced && (
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {session.title}
          </p>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {currentIndex + 1}/{questions.length}
          </span>
        </div>
      )}

      <div className="card mb-4">
        <h2 className="text-xl font-bold mb-6">{currentQuestion?.prompt}</h2>

        {alreadySubmitted ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold">Response submitted!</p>
            {isSelfPaced ? (
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Click Next to continue
              </p>
            ) : (
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Waiting for the next question...
              </p>
            )}
          </div>
        ) : (
          <>
            {currentQuestion?.type === 'mcq' && (
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

            {currentQuestion?.type === 'rating' && (
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

            {(currentQuestion?.type === 'word_cloud' || currentQuestion?.type === 'open_text') && (
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
              disabled={submitting || (currentQuestion?.type === 'rating' ? rating === 0 : !answer.trim())}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </>
        )}
      </div>

      {/* Self-paced navigation */}
      {isSelfPaced && alreadySubmitted && (
        <button onClick={goToNext} className="btn-primary w-full justify-center"
          style={{ background: isLastQuestion ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : undefined }}>
          {isLastQuestion ? 'Finish ✓' : 'Next Question →'}
        </button>
      )}
    </div>
  )
}
