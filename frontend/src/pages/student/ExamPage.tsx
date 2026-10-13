import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Award,
  Check,
} from 'lucide-react'
import { examsApi, type ExamDetail, type Question } from '../../api/exams'
import { submissionsApi } from '../../api/submissions'

export default function ExamPage() {
  const params = useParams()
  const examId = params.examId || params.id || ''
  const submissionId = params.submissionId || ''
  const navigate = useNavigate()

  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [timerInitialized, setTimerInitialized] = useState(false)

  // Saving state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Auto-submit ref guard so we don't submit twice
  const hasSubmittedRef = useRef(false)

  // Fetch exam detail
  useEffect(() => {
    let isMounted = true

    async function fetchExamDetail() {
      if (!examId) {
        setError('Exam ID is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await examsApi.get(examId)
        if (isMounted) {
          const examData = response.data
          setExam(examData)

          // Sort questions by order_index if present
          const sorted = [...(examData.questions || [])].sort(
            (a, b) => a.order_index - b.order_index
          )
          setQuestions(sorted)

          // Initialize countdown timer
          if (examData.duration_minutes && !timerInitialized) {
            setTimeLeft(examData.duration_minutes * 60)
            setTimerInitialized(true)
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              err.message ||
              'Unable to load examination questions.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchExamDetail()

    return () => {
      isMounted = false
    }
  }, [examId, timerInitialized])

  // Submit Handler
  const handleFinalSubmit = useCallback(async () => {
    if (hasSubmittedRef.current) return
    hasSubmittedRef.current = true
    setSubmitting(true)
    setSubmitError(null)

    try {
      await submissionsApi.submit(submissionId)
      navigate(`/student/results/${submissionId}`, { replace: true })
    } catch (err: any) {
      hasSubmittedRef.current = false
      setSubmitting(false)
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to submit examination. Please try again.'
      setSubmitError(msg)
    }
  }, [submissionId, navigate])

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft === undefined) return

    if (timeLeft <= 0) {
      // Auto-submit when timer expires
      if (!hasSubmittedRef.current) {
        handleFinalSubmit()
      }
      return
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null
        if (prev <= 1) {
          clearInterval(interval)
          if (!hasSubmittedRef.current) {
            handleFinalSubmit()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft, handleFinalSubmit])

  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasSubmittedRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Auto-save debounced handler
  const handleSelectOption = (questionId: string, optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }))

    setSaveStatus('saving')

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (submissionId) {
          await submissionsApi.saveAnswer(submissionId, questionId, optionKey)
          setSaveStatus('saved')
        }
      } catch {
        setSaveStatus('error')
      }
    }, 400)
  }

  // Format MM:SS or HH:MM:SS
  const formatTimer = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return '--:--'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  const currentQuestion: Question | undefined = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const totalCount = questions.length

  // Unanswered question indices (1-indexed)
  const unansweredIndices = questions
    .map((q, idx) => ({ q, num: idx + 1 }))
    .filter(({ q }) => !answers[q.id])
    .map(({ num }) => num)

  const isCriticalTime = timeLeft !== null && timeLeft <= 300 // < 5 minutes

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
        <p className="text-sm font-medium">Preparing examination session...</p>
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="card p-6 max-w-lg bg-red-50 border-red-200 text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold">Session Error</h2>
              <p className="text-sm mt-1">{error || 'Exam could not be loaded.'}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/exams')}
            className="btn btn-secondary btn-sm mt-4 text-slate-700"
          >
            Back to Examinations
          </button>
        </div>
      </div>
    )
  }

  const options = [
    { key: 'A', text: currentQuestion?.option_a },
    { key: 'B', text: currentQuestion?.option_b },
    { key: 'C', text: currentQuestion?.option_c },
    { key: 'D', text: currentQuestion?.option_d },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top sticky bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Exam info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="badge badge-blue font-semibold text-xs">
                {exam.subject}
              </span>
              <h1 className="text-base font-bold text-slate-900 truncate">
                {exam.title}
              </h1>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Question {currentIndex + 1} of {totalCount}</span>
              <span>•</span>
              <span className="font-medium text-slate-700">
                {answeredCount}/{totalCount} Answered
              </span>
            </div>
          </div>

          {/* Timer & Submit Action */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Auto-save status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-primary-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Sync issue</span>
                </span>
              )}
            </div>

            {/* Countdown timer */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm tracking-wider transition-colors ${
                isCriticalTime
                  ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                  : 'bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <Clock className={`w-4 h-4 ${isCriticalTime ? 'text-red-600' : 'text-slate-500'}`} />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            {/* Submit button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="btn btn-primary btn-sm px-4 font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Exam</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body: Two-column layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Question Navigation Grid (4 columns on lg) */}
        <aside className="lg:col-span-4 xl:col-span-3 card p-5 border-slate-200 sticky top-24 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Question Palette</h2>
            <span className="text-xs font-semibold text-slate-500">
              {answeredCount}/{totalCount} Done
            </span>
          </div>

          {/* Grid of question buttons */}
          <div className="grid grid-cols-5 gap-2 max-h-72 lg:max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id]
              const isCurrent = idx === currentIndex

              let btnClasses = 'w-full aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center '

              if (isCurrent) {
                btnClasses += 'ring-2 ring-primary-500 ring-offset-2 '
              }

              if (isAnswered) {
                btnClasses += 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 '
              } else {
                btnClasses += 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 '
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={btnClasses}
                  aria-label={`Jump to question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary-600" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300" />
              <span>Unanswered ({totalCount - answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded ring-2 ring-primary-500 ring-offset-1 bg-white border" />
              <span>Current Question</span>
            </div>
          </div>
        </aside>

        {/* Right Panel: Active Question Content (8 columns on lg) */}
        <main className="lg:col-span-8 xl:col-span-9 card p-6 sm:p-8 border-slate-200 shadow-sm flex flex-col justify-between min-h-[500px]">
          {currentQuestion ? (
            <div>
              {/* Question header info */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <span className="badge badge-slate font-mono text-xs">
                  Question {currentIndex + 1} of {totalCount}
                </span>

                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-primary-500" />
                  <span>{currentQuestion.marks} Marks</span>
                </span>
              </div>

              {/* Question Prompt */}
              <div className="mt-6 mb-8">
                <h3 className="text-lg sm:text-xl font-medium text-slate-900 leading-relaxed select-text">
                  {currentQuestion.question_text}
                </h3>
              </div>

              {/* 4 Option Buttons */}
              <div className="space-y-3">
                {options.map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt.key

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, opt.key)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${
                        isSelected
                          ? 'bg-primary-50/80 border-primary-500 text-primary-950 shadow-sm ring-1 ring-primary-500'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-800'
                      }`}
                    >
                      {/* Key badge (A, B, C, D) */}
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {opt.key}
                      </span>

                      {/* Option text */}
                      <span className="text-sm sm:text-base font-normal flex-1">
                        {opt.text || `Option ${opt.key}`}
                      </span>

                      {/* Selected check */}
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              No questions found for this exam.
            </div>
          )}

          {/* Bottom Navigation buttons */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="btn btn-secondary btn-sm sm:btn"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="text-xs text-slate-400 hidden sm:block">
              Auto-saves on choice selection
            </div>

            {currentIndex < totalCount - 1 ? (
              <button
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))
                }
                className="btn btn-secondary btn-sm sm:btn"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="btn btn-primary btn-sm sm:btn font-semibold"
              >
                <span>Review & Submit</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="card p-6 max-w-md w-full bg-white shadow-xl border-slate-200 animate-slide-up space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Submit Examination?</h3>
                <p className="text-xs text-slate-500">
                  Please review your submission status.
                </p>
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Answer tally */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span>Total Questions:</span>
                <span className="font-bold">{totalCount}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Answered:</span>
                <span className="font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Unanswered:</span>
                <span className="font-bold text-red-600">
                  {totalCount - answeredCount}
                </span>
              </div>
            </div>

            {/* Unanswered list warning */}
            {unansweredIndices.length > 0 ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Unanswered Questions Remaining:</span>
                </div>
                <p className="leading-relaxed">
                  Questions <strong>{unansweredIndices.join(', ')}</strong> have not been answered yet. Unanswered questions receive zero marks.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>You have answered all questions in this examination.</span>
              </div>
            )}

            <p className="text-xs text-slate-500 leading-relaxed">
              Once confirmed, your answers will be finalized and evaluated immediately. You will not be able to modify them.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="btn btn-secondary btn-sm"
              >
                Back to Questions
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="btn btn-primary btn-sm font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Submit</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
