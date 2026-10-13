import api from './client'

export interface Question {
  id: string
  exam_id: string
  order_index: number
  marks: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

export interface Exam {
  id: string
  title: string
  subject: string
  description: string
  duration_minutes: number
  total_marks: number
  pass_mark: number
  scheduled_at: string
  status: 'draft' | 'active' | 'closed'
  question_count?: number
}

export interface ExamDetail extends Exam {
  questions: Question[]
}

export const examsApi = {
  list: () => api.get<Exam[]>('/api/exams'),
  get: (id: string) => api.get<ExamDetail>(`/api/exams/${id}`),
}
