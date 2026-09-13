'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinPage() {
  const [code, setCode] = useState('')
  const router = useRouter()

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length >= 4) {
      router.push(`/join/${trimmed}`)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-57px)] px-4">
      <div className="card w-full max-w-sm text-center">
        <div className="text-4xl mb-4">🎟️</div>
        <h1 className="text-xl font-bold mb-2">Join a Session</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Enter the code shown by your presenter
        </p>
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            className="input text-center text-2xl font-mono font-bold tracking-widest uppercase"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="ABCD12"
            maxLength={8}
            autoFocus
          />
          <button type="submit" className="btn-primary justify-center" disabled={code.trim().length < 4}>
            Join Session
          </button>
        </form>
      </div>
    </div>
  )
}
