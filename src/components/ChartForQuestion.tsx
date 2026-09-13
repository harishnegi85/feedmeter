'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { countValues, getWordFrequencies } from '@/lib/utils'
import type { Question, Response } from '@/lib/types'

export const COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

function colorForWord(word: string): string {
  let hash = 0
  for (let i = 0; i < word.length; i++) hash = word.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

interface Props {
  question: Question
  responses: Response[]
  compact?: boolean
}

export default function ChartForQuestion({ question, responses, compact = false }: Props) {
  if (responses.length === 0) {
    return (
      <div className="flex items-center justify-center text-center" style={{ height: compact ? 100 : 192, color: 'var(--text-muted)' }}>
        <div>
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-sm">No responses yet</p>
        </div>
      </div>
    )
  }

  if (question.type === 'mcq') {
    const counts = countValues(responses)
    const total = responses.length
    const data = (question.options ?? []).map(opt => ({ name: opt, count: counts[opt] || 0 }))
    const chartHeight = compact ? 180 : 280
    const yWidth = compact ? 100 : 140
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40 }}>
          <XAxis type="number" allowDecimals={false} stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={yWidth} stroke="#64748b"
            tick={{ fill: '#e2e8f0', fontSize: compact ? 11 : 13 }} />
          <Tooltip
            contentStyle={{ background: '#1e1e2e', border: '1px solid #2a2a3d', borderRadius: 8 }}
            formatter={(val) => [
              `${val} votes (${total && typeof val === 'number' ? Math.round(val / total * 100) : 0}%)`, ''
            ]}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (question.type === 'rating') {
    const counts = countValues(responses)
    const data = [1, 2, 3, 4, 5].map(n => ({ name: '★'.repeat(n), count: counts[String(n)] || 0 }))
    const avg = responses.reduce((s, r) => s + parseInt(r.value), 0) / responses.length
    return (
      <div>
        <div className="text-center mb-3">
          <span className="font-bold" style={{ fontSize: compact ? '1.5rem' : '2.25rem' }}>{avg.toFixed(1)}</span>
          <span style={{ color: '#f59e0b', fontSize: compact ? '1rem' : '1.25rem' }}> ★</span>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>average · {responses.length} responses</p>
        </div>
        <ResponsiveContainer width="100%" height={compact ? 120 : 200}>
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#e2e8f0', fontSize: 11 }} />
            <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid #2a2a3d', borderRadius: 8 }} />
            <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (question.type === 'word_cloud') {
    const words = getWordFrequencies(responses)
    const max = words[0]?.count ?? 1
    const maxSize = compact ? 1.6 : 2.5
    return (
      <div className="flex flex-wrap gap-2 p-3 justify-center items-center" style={{ minHeight: compact ? 80 : 180 }}>
        {words.map(({ word, count }) => (
          <span key={word} style={{
            fontSize: `${Math.max(0.75, (count / max) * maxSize)}rem`,
            color: colorForWord(word),
            fontWeight: count === max ? 800 : 600,
            opacity: 0.55 + (count / max) * 0.45,
          }}>
            {word}
          </span>
        ))}
      </div>
    )
  }

  // open_text
  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: compact ? 160 : 288 }}>
      {responses.map(r => (
        <div key={r.id} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface-2)' }}>
          {r.value}
        </div>
      ))}
    </div>
  )
}
