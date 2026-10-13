import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  History,
  LayoutDashboard,
  Check,
  X,
  MinusCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { submissionsApi, type Result, type AnswerReview } from '../../api/submissions'

export default function ResultPage() {
  const { submissionId, id } = useParams()
  const activeSubmissionId = submissionId || id || ''

  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchResult() {
      if (!activeSubmissionId) {
        setError('Submission ID is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await submissionsApi.getResult(activeSubmissionId)
        if (isMounted) {
          setResult(response.data)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              err.message ||
              'Unable to load examination results. Please try again.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchResult()

    return () => {
      isMounted = false
    }
  }, [activeSubmissionId])

  const getGradeBadge = (grade: string) => {
    const g = (grade || '').trim().toUpperCase()
    switch (g) {
      case 'A+':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'A':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'B':
      case 'B+':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      case 'C':
      case 'C+':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'D':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'F':
      default:
        return 'bg-red-100 text-red-800 border-red-300'
    }
  }

  const getOptionText = (q: AnswerReview, optKey: string | null) => {
    if (!optKey) return 'No answer provided'
    switch (optKey.toUpperCase()) {
      case 'A':
        return q.option_a
      case 'B':
        return q.option_b
      case 'C':
        return q.option_c
      case 'D':
        return q.option_d
      default:
        return optKey
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
        <p className="text-sm font-medium">Computing evaluation results...</p>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card p-6 bg-red-50 border-red-200 text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold">Failed to load result</h2>
              <p className="text-sm mt-1">{error || 'Result details are unavailable.'}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-red-200 flex gap-3">
            <Link to="/student/history" className="btn btn-secondary btn-sm">
              <History className="w-4 h-4" />
              <span>Examination History</span>
            </Link>
            <Link to="/student" className="btn btn-ghost btn-sm text-red-800">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const percentage = Math.round(
    typeof result.percentage === 'number'
      ? result.percentage
      : (result.raw_score / result.total_marks) * 100
  )

  // Circular progress calculations
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference

  const answers = result.answers || []
  const correctCount = answers.filter((a) => a.is_correct).length
  const incorrectCount = answers.filter((a) => !a.is_correct && a.selected_option).length
  const unansweredCount = answers.filter((a) => !a.selected_option).length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/student" className="hover:text-primary-600">
              Dashboard
            </Link>
            <span>/</span>
            <Link to="/student/history" className="hover:text-primary-600">
              History
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Evaluation Result</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Examination Results: {result.exam_title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Graded on {formatDate(result.graded_at)} • Submission ID: {result.submission_id || activeSubmissionId}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link to="/student" className="btn btn-secondary btn-sm">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <Link to="/student/history" className="btn btn-primary btn-sm">
            <History className="w-4 h-4" />
            <span>All Results</span>
          </Link>
        </div>
      </div>

      {/* Hero Section: Score, Grade & Circular Progress */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left stats: Score, Percentage, Grade & Status */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`badge px-3 py-1 font-bold text-xs border ${getGradeBadge(
                  result.grade
                )}`}
              >
                Grade: {result.grade}
              </span>

              <span
                className={`badge px-3 py-1 font-bold text-xs ${
                  result.passed ? 'badge-green' : 'badge-red'
                }`}
              >
                {result.passed ? 'Passed Examination' : 'Failed Examination'}
              </span>

              <span className="badge badge-slate text-xs font-mono">
                {result.raw_score} of {result.total_marks} Marks
              </span>
            </div>

            <div>
              <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                {result.raw_score}
                <span className="text-2xl font-medium text-slate-400">
                  {' '}
                  / {result.total_marks}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                You obtained an aggregate score of <strong>{percentage}%</strong> in this assessment session.
              </p>
            </div>

            {/* Quick tally breakdown */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200/80 max-w-lg">
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Correct</span>
                </div>
                <div className="text-base font-bold text-emerald-900 mt-0.5">
                  {correctCount}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-red-50/70 border border-red-100">
                <div className="flex items-center gap-1.5 text-xs text-red-800 font-medium">
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>Incorrect</span>
                </div>
                <div className="text-base font-bold text-red-900 mt-0.5">
                  {incorrectCount}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-100/70 border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                  <MinusCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unanswered</span>
                </div>
                <div className="text-base font-bold text-slate-800 mt-0.5">
                  {unansweredCount}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Circular Progress-like visual */}
          <div className="md:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Background Track */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-slate-200"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Progress Bar */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className={
                    result.passed ? 'stroke-emerald-500' : 'stroke-red-500'
                  }
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>

              {/* Inner Percentage Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-slate-900">
                  {percentage}%
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                  Score
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 mt-2 font-medium">
              Passing requirement met: {result.passed ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Question Review Table & Item Breakdown */}
      <div className="card p-6 border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Detailed Question Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your answers alongside official answer keys and correct options.
            </p>
          </div>
          <span className="badge badge-slate text-xs font-mono">
            {answers.length} Questions
          </span>
        </div>

        {answers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No detailed question breakdown is available for this exam session.
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((item, idx) => {
              const hasAnswered = !!item.selected_option
              const isCorrect = item.is_correct

              return (
                <div
                  key={item.question_id || idx}
                  className={`p-4 sm:p-5 rounded-xl border transition-all ${
                    isCorrect
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : hasAnswered
                      ? 'bg-red-50/30 border-red-200'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  {/* Question header row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        Q{idx + 1}.
                      </span>
                      <span
                        className={`badge text-xs font-semibold ${
                          isCorrect
                            ? 'badge-green'
                            : hasAnswered
                            ? 'badge-red'
                            : 'badge-slate'
                        }`}
                      >
                        {isCorrect
                          ? 'Correct'
                          : hasAnswered
                          ? 'Incorrect'
                          : 'Unanswered'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isCorrect ? (
                        <div className="flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Full marks</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-700 text-xs font-semibold">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>0 marks</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm font-medium text-slate-900 mb-4 leading-relaxed">
                    {item.question_text}
                  </p>

                  {/* Answers Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 text-xs">
                    {/* Student's answer */}
                    <div
                      className={`p-3 rounded-lg border ${
                        isCorrect
                          ? 'bg-emerald-100/50 border-emerald-200 text-emerald-950'
                          : hasAnswered
                          ? 'bg-red-100/50 border-red-200 text-red-950'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                        {isCorrect ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : hasAnswered ? (
                          <X className="w-3.5 h-3.5 text-red-600" />
                        ) : (
                          <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>Your Response:</span>
                      </div>
                      <div className="font-semibold text-xs">
                        {item.selected_option
                          ? `Option ${item.selected_option}: ${getOptionText(
                              item,
                              item.selected_option
                            )}`
                          : 'Not Answered'}
                      </div>
                    </div>

                    {/* Correct answer */}
                    <div className="p-3 rounded-lg bg-emerald-100/50 border border-emerald-200 text-emerald-950">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Correct Answer:</span>
                      </div>
                      <div className="font-semibold text-xs">
                        Option {item.correct_option}:{' '}
                        {getOptionText(item, item.correct_option)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <Link to="/student" className="btn btn-secondary w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <Link to="/student/history" className="btn btn-primary w-full sm:w-auto">
          <span>View All Results</span>
          <History className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
