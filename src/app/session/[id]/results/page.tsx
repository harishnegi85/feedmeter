import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ResultsOverview from './ResultsOverview'

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('presenter_id', user.id)
    .single()

  if (!session) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', id)
    .order('order_index')

  const { data: responses } = await supabase
    .from('responses')
    .select('*')
    .in('question_id', (questions ?? []).map((q: { id: string }) => q.id))

  const { count: participantCount } = await supabase
    .from('participants')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', id)

  return (
    <ResultsOverview
      session={session}
      questions={questions ?? []}
      initialResponses={responses ?? []}
      initialParticipantCount={participantCount ?? 0}
    />
  )
}
