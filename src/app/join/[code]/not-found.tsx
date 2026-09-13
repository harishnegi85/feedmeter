import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-57px)] px-4">
      <div className="card text-center max-w-sm w-full">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-xl font-bold mb-2">Session not found</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          That code doesn&apos;t match any active session. Double-check with your presenter.
        </p>
        <Link href="/join" className="btn-primary justify-center">
          Try again
        </Link>
      </div>
    </div>
  )
}
