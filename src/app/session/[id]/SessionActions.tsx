'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Session } from '@/lib/types'

export default function SessionActions({ session }: { session: Session }) {
  const router = useRouter()
  const supabase = createClient()

  async function updateStatus(status: 'active' | 'ended') {
    await supabase.from('sessions').update({ status }).eq('id', session.id)
    router.refresh()
  }

  return (
    <div className="flex gap-2 shrink-0">
      {session.status === 'draft' && (
        <button onClick={() => updateStatus('active')} className="btn-primary" style={{ fontSize: '0.8rem' }}>
          Activate
        </button>
      )}
      {session.status === 'active' && (
        <>
          <Link href={`/session/${session.id}/present`} className="btn-primary" style={{ fontSize: '0.8rem' }}>
            Present Live
          </Link>
          <button onClick={() => updateStatus('ended')} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
            End Session
          </button>
        </>
      )}
      {session.status === 'ended' && (
        <button onClick={() => updateStatus('active')} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
          Reactivate
        </button>
      )}
    </div>
  )
}
