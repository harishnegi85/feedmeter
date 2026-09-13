export function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function getOrCreateParticipantId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'fm_participant_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function countValues(responses: { value: string }[]): Record<string, number> {
  return responses.reduce((acc, r) => {
    acc[r.value] = (acc[r.value] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

export function getMostCommon(responses: { value: string }[]): string | null {
  if (responses.length === 0) return null
  const counts = countValues(responses)
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

export function getWordFrequencies(responses: { value: string }[]): { word: string; count: number }[] {
  const freq: Record<string, number> = {}
  for (const r of responses) {
    const words = r.value.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1
    }
  }
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 40)
}
