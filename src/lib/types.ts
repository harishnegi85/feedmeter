export type QuestionType = 'mcq' | 'rating' | 'word_cloud' | 'open_text'
export type SessionStatus = 'draft' | 'active' | 'ended'
export type SessionMode = 'live' | 'self_paced'

export interface Session {
  id: string
  presenter_id: string
  title: string
  code: string
  status: SessionStatus
  mode: SessionMode
  active_question_index: number
  created_at: string
}

export interface Question {
  id: string
  session_id: string
  type: QuestionType
  prompt: string
  options: string[] | null
  order_index: number
  created_at: string
}

export interface Participant {
  id: string
  session_id: string
  joined_at: string
}

export interface Response {
  id: string
  question_id: string
  participant_id: string
  value: string
  created_at: string
}

export interface SessionWithQuestions extends Session {
  questions: Question[]
}
