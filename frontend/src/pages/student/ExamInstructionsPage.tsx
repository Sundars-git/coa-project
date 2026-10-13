import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Clock,
  Award,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { examsApi, type ExamDetail } from '../../api/exams'
import { submissionsApi, type Result, type Submission } from '../../api/submissions'

export default function ExamInstructionsPage() {
  const { id, examId } = useParams()
  const activeExamId = id || examId || ''
  const navigate = useNavigate()

  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [existingResult, setExistingResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedRead, setConfirmedRead] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadExamData() {
      if (!activeExamId) {
        setError('Exam ID was not specified.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [examRes, resultsRes] = await Promise.all([
          examsApi.get(activeExamId),
          submissionsApi.myResults(),
        ])

        if (isMounted) {
          setExam(examRes.data)
          // Check if student has already completed this exam
          const foundResult = resultsRes.data?.find(
            (r) => r.exam_id === activeExamId
          )
          if (foundResult) {
            setExistingResult(foundResult)
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              err.message ||
              'Unable to load examination details.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadExamData()

    return () => {
      isMounted = false
    }
  }, [activeExamId])

  const handleStartExam = async () => {
    if (!activeExamId || !confirmedRead) return

    setStarting(true)
    setError(null)

    try {
      const response = await submissionsApi.start(activeExamId)
      const submission: Submission = response.data
      navigate(`/student/exams/${activeExamId}/attempt/${submission.id}`)
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Could not initiate exam session. Please check if it is active or already submitted.'
      setError(msg)
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
        <p className="text-sm font-medium">Loading examination details...</p>
      </div>
    )
  }

  if (error && !exam) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card p-6 bg-red-50 border-red-200 text-red-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h2 className="text-base font-bold">Error Loading Examination</h2>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-red-200">
            <Link to="/student/exams" className="btn btn-secondary btn-sm">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Examinations</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!exam) return null

  // If already submitted
  if (existingResult) {
    const subId = existingResult.submission_id || existingResult.id
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="card p-8 border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="badge badge-green text-xs font-semibold px-3 py-1">
            Exam Completed
          </span>

          <h1 className="text-2xl font-bold text-slate-900 mt-3">
            {exam.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{exam.subject}</p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md mx-auto my-6 text-left">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Previous Attempt Summary
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-sm">
              <span className="text-slate-600">Score</span>
              <span className="font-bold text-slate-900">
                {existingResult.raw_score} / {existingResult.total_marks}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-sm">
              <span className="text-slate-600">Grade</span>
              <span className="font-bold text-primary-600">{existingResult.grade}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 text-sm">
              <span className="text-slate-600">Result</span>
              <span
                className={`font-semibold ${
                  existingResult.passed ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {existingResult.passed ? 'Passed' : 'Failed'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            You have already completed this examination. University policy permits only one attempt per registered student.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/student/exams" className="btn btn-secondary w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Exam List</span>
            </Link>
            <Link
              to={`/student/results/${subId}`}
              className="btn btn-primary w-full sm:w-auto"
            >
              <span>View Evaluation & Results</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isClosed = exam.status === 'closed'
  const isDraft = exam.status === 'draft'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/student/exams" className="hover:text-primary-600">
          Examinations
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate">{exam.title}</span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Unable to begin session</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Exam Header Overview Card */}
      <div className="card p-6 md:p-8 border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-blue font-semibold">{exam.subject}</span>
              <span
                className={`badge ${
                  exam.status === 'active'
                    ? 'badge-green'
                    : exam.status === 'draft'
                    ? 'badge-yellow'
                    : 'badge-slate'
                }`}
              >
                {exam.status === 'active'
                  ? 'Active Assessment'
                  : exam.status === 'draft'
                  ? 'Upcoming'
                  : 'Closed'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {exam.title}
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              {exam.description ||
                'This examination tests your proficiency in core theoretical concepts and applied problem solving.'}
            </p>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Clock className="w-4 h-4 text-primary-600" />
              <span>Duration</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {exam.duration_minutes} Mins
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Continuous timer</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Total Marks</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {exam.total_marks} Pts
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Full score possible</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pass Mark</span>
            </div>
            <div className="text-lg font-bold text-emerald-700 mt-1">
              {exam.pass_mark} Pts
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Minimum to pass</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Format</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              MCQ Single
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">A / B / C / D choices</div>
          </div>
        </div>
      </div>

      {/* Instructions list */}
      <div className="card p-6 md:p-8 border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ShieldAlert className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-bold text-slate-900">
            Candidate Instructions & Rules of Conduct
          </h2>
        </div>

        <p className="text-xs text-slate-500">
          Please carefully read the examination protocol prior to launching your session:
        </p>

        <ul className="space-y-3 text-sm text-slate-700">
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </span>
            <span>
              <strong>Read all questions carefully:</strong> Each question carries specific points. Review all four answer options before locking your choice.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </span>
            <span>
              <strong>Multiple Choice Question (MCQ) format:</strong> Every question features one strictly correct option. No negative marking is applied unless otherwise stated.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </span>
            <span>
              <strong>One attempt only:</strong> Once initiated, your session begins immediately. You cannot pause, restart, or re-attempt this exam.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              4
            </span>
            <span>
              <strong>Automatic submission on timer expiry:</strong> When the countdown reaches zero, your answers will be automatically submitted and locked.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              5
            </span>
            <span>
              <strong>Automatic progress saving:</strong> Each selected answer is automatically synchronized with the server in the background.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              6
            </span>
            <span>
              <strong>No tab switching or browser refresh:</strong> Navigating away or closing the browser window may result in automatic submission.
            </span>
          </li>
        </ul>

        {/* Readiness confirmation */}
        <div className="pt-4 mt-4 border-t border-slate-100">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmedRead}
              onChange={(e) => setConfirmedRead(e.target.checked)}
              disabled={isClosed || isDraft}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-xs font-medium text-slate-700">
              I have read, understood, and agree to abide by all the examination rules and academic integrity regulations stated above.
            </span>
          </label>
        </div>

        {/* Action button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/student/exams" className="btn btn-secondary w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel & Return</span>
          </Link>

          {isClosed ? (
            <div className="text-xs font-semibold text-slate-500">
              This examination is closed and cannot be started.
            </div>
          ) : isDraft ? (
            <div className="text-xs font-semibold text-yellow-700">
              This examination is upcoming and not yet active.
            </div>
          ) : (
            <button
              onClick={handleStartExam}
              disabled={!confirmedRead || starting}
              className="btn btn-primary btn-lg w-full sm:w-auto text-base font-semibold shadow-md disabled:shadow-none"
            >
              {starting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Initiating Exam Session...</span>
                </>
              ) : (
                <>
                  <span>Start Exam Now</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
