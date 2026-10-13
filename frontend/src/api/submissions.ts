import api from './client'

export interface Submission {
  id: string
  student_id: string
  exam_id: string
  started_at: string
  submitted_at: string | null
  status: 'in_progress' | 'submitted'
}

export interface AnswerReview {
  question_id: string
  question_text: string
  selected_option: string | null
  correct_option: string
  is_correct: boolean
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

export interface Result {
  id: string
  submission_id: string
  student_id: string
  exam_id: string
  exam_title: string
  raw_score: number
  total_marks: number
  percentage: number
  grade: string
  passed: boolean
  graded_at: string
  answers?: AnswerReview[]
}

export const submissionsApi = {
  start: (exam_id: string) =>
    api.post<Submission>('/api/submissions', { exam_id }),

  saveAnswer: (submissionId: string, question_id: string, selected_option: string) =>
    api.patch(`/api/submissions/${submissionId}/answers`, { question_id, selected_option }),

  submit: (submissionId: string) =>
    api.post<Result>(`/api/submissions/${submissionId}/submit`),

  getResult: (submissionId: string) =>
    api.get<Result>(`/api/submissions/${submissionId}/result`),

  myResults: () =>
    api.get<Result[]>('/api/submissions/my/results'),
}
