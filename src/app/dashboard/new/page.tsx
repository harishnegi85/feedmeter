'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { generateCode } from '@/lib/utils'
import type { QuestionType, SessionMode } from '@/lib/types'

interface QuestionDraft {
  type: QuestionType
  prompt: string
  options: string[]
}

const TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'Multiple Choice',
  rating: 'Rating (1–5)',
  word_cloud: 'Word Cloud',
  open_text: 'Open Text',
}

export default function NewSessionPage() {
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<SessionMode>('live')
  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  function addQuestion() {
    setQuestions(prev => [...prev, { type: 'mcq', prompt: '', options: ['', ''] }])
  }

  function removeQuestion(i: number) {
    setQuestions(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateQuestion(i: number, patch: Partial<QuestionDraft>) {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, ...patch } : q))
  }

  function addOption(qi: number) {
    setQuestions(prev => prev.map((q, idx) =>
      idx === qi ? { ...q, options: [...q.options, ''] } : q
    ))
  }

  function updateOption(qi: number, oi: number, val: string) {
    setQuestions(prev => prev.map((q, idx) =>
      idx === qi ? { ...q, options: q.options.map((o, j) => j === oi ? val : o) } : q
    ))
  }

  function removeOption(qi: number, oi: number) {
    setQuestions(prev => prev.map((q, idx) =>
      idx === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q
    ))
  }

  async function handleSave(activate: boolean) {
    if (!title.trim()) { setError('Session title is required'); return }
    if (questions.length === 0) { setError('Add at least one question'); return }
    for (const q of questions) {
      if (!q.prompt.trim()) { setError('All questions need a prompt'); return }
      if (q.type === 'mcq' && q.options.filter(o => o.trim()).length < 2) {
        setError('MCQ questions need at least 2 options'); return
      }
    }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const code = generateCode()
    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .insert({ title: title.trim(), code, presenter_id: user.id, mode, status: activate ? 'active' : 'draft' })
      .select()
      .single()

    if (sessionErr || !session) {
      setError(sessionErr?.message || 'Failed to create session')
      setSaving(false)
      return
    }

    const questionRows = questions.map((q, i) => ({
      session_id: session.id,
      type: q.type,
      prompt: q.prompt.trim(),
      options: q.type === 'mcq' ? q.options.filter(o => o.trim()) : null,
      order_index: i,
    }))

    const { error: qErr } = await supabase.from('questions').insert(questionRows)
    if (qErr) {
      setError(qErr.message)
      setSaving(false)
      return
    }

    router.push(activate ? `/session/${session.id}/present` : `/session/${session.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">New Session</h1>

      {error && (
        <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: '#7f1d1d30', color: '#fca5a5', border: '1px solid #7f1d1d' }}>
          {error}
        </div>
      )}

      <div className="card mb-6">
        <label className="label">Session Title</label>
        <input
          className="input mb-4"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Team Retrospective, Workshop Day 1"
        />

        <label className="label">Mode</label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'live', icon: '🎤', title: 'Live', desc: 'You control which question is shown' },
            { value: 'self_paced', icon: '🎯', title: 'Self-paced', desc: 'Audience answers all questions on their own' },
          ] as { value: SessionMode; icon: string; title: string; desc: string }[]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className="text-left p-3 rounded-lg transition-all"
              style={{
                background: mode === opt.value ? '#1e1433' : 'var(--surface-2)',
                border: `2px solid ${mode === opt.value ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              <div className="text-lg mb-1">{opt.icon}</div>
              <div className="font-semibold text-sm">{opt.title}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {questions.map((q, qi) => (
          <div key={qi} className="card" style={{ borderColor: '#3a3a5c' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm">Question {qi + 1}</span>
              <button onClick={() => removeQuestion(qi)} className="btn-danger">Remove</button>
            </div>

            <div className="mb-3">
              <label className="label">Type</label>
              <select
                className="input"
                value={q.type}
                onChange={e => updateQuestion(qi, { type: e.target.value as QuestionType, options: ['', ''] })}
              >
                {(Object.keys(TYPE_LABELS) as QuestionType[]).map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="label">Question prompt</label>
              <input
                className="input"
                value={q.prompt}
                onChange={e => updateQuestion(qi, { prompt: e.target.value })}
                placeholder="Type your question here..."
              />
            </div>

            {q.type === 'mcq' && (
              <div>
                <label className="label">Options</label>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex gap-2">
                      <input
                        className="input"
                        value={opt}
                        onChange={e => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                      />
                      {q.options.length > 2 && (
                        <button onClick={() => removeOption(qi, oi)} className="btn-danger" style={{ whiteSpace: 'nowrap' }}>×</button>
                      )}
                    </div>
                  ))}
                  {q.options.length < 6 && (
                    <button onClick={() => addOption(qi)} className="btn-secondary" style={{ width: 'fit-content', fontSize: '0.8rem' }}>
                      + Add option
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addQuestion} className="btn-secondary w-full mb-8">
        + Add Question
      </button>

      <div className="flex gap-3">
        <button onClick={() => handleSave(false)} className="btn-secondary" disabled={saving}>
          Save as Draft
        </button>
        <button onClick={() => handleSave(true)} className="btn-primary" disabled={saving}>
          {saving ? 'Creating...' : 'Create & Start Session'}
        </button>
      </div>
    </div>
  )
}
