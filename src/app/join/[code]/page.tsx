import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AudienceView from './AudienceView'

export default async function JoinCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .neq('status', 'draft')
    .single()

  if (!session) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', session.id)
    .order('order_index')

  return <AudienceView session={session} questions={questions ?? []} />
}
