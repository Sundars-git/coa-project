import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Clock,
  Award,
  Calendar,
  ChevronRight,
  AlertCircle,
  FileText,
  ArrowRight,
  Loader2,
  Percent,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { examsApi, type Exam } from '../../api/exams'
import { submissionsApi, type Result } from '../../api/submissions'

export default function DashboardPage() {
  const { user } = useAuthStore()

  const [exams, setExams] = useState<Exam[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      setLoading(true)
      setError(null)
      try {
        const [examsRes, resultsRes] = await Promise.all([
          examsApi.list(),
          submissionsApi.myResults(),
        ])
        if (isMounted) {
          setExams(examsRes.data || [])
          setResults(resultsRes.data || [])
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              err.message ||
              'Failed to load dashboard data. Please try again.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  // Calculate statistics
  const totalExamsTaken = results.length
  const avgScore =
    totalExamsTaken > 0
      ? Math.round(
          results.reduce(
            (acc, r) => acc + (typeof r.percentage === 'number' ? r.percentage : (r.raw_score / r.total_marks) * 100),
            0
          ) / totalExamsTaken
        )
      : 0

  const passedCount = results.filter((r) => r.passed).length
  const passRate =
    totalExamsTaken > 0 ? Math.round((passedCount / totalExamsTaken) * 100) : 0

  // Active exams only
  const activeExams = exams.filter((e) => e.status === 'active')

  // Last 3 results sorted by graded_at desc
  const recentResults = [...results]
    .sort(
      (a, b) =>
        new Date(b.graded_at || 0).getTime() - new Date(a.graded_at || 0).getTime()
    )
    .slice(0, 3)

  const getGradeBadgeClass = (grade: string) => {
    const g = grade?.toUpperCase()
    if (g === 'A+' || g === 'A') return 'badge-green'
    if (g === 'B+' || g === 'B') return 'badge-blue'
    if (g === 'C+' || g === 'C') return 'badge-yellow'
    if (g === 'D') return 'badge-yellow'
    return 'badge-red'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.full_name || 'Student'}
            </h1>
            {user?.student_id && (
              <span className="badge badge-blue font-mono font-medium">
                {user.student_id}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Access your active examinations, track performance history, and view test analytics.
          </p>
        </div>

        <Link to="/student/exams" className="btn btn-primary btn-sm self-start sm:self-auto">
          <BookOpen className="w-4 h-4" />
          <span>Browse All Exams</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-secondary btn-sm text-red-700 hover:bg-red-100 border-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Profile Card & Quick Bio */}
      <div className="card p-5 bg-gradient-to-r from-blue-50/50 via-white to-slate-50 border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xl shadow-md ring-4 ring-primary-100 flex-shrink-0">
              {user?.avatar_initials || 'ST'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-slate-900">
                  {user?.full_name}
                </span>
                <span className="badge badge-slate capitalize">
                  {user?.role || 'Student'}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 font-medium">
                <span>{user?.email}</span>
                {user?.department && (
                  <>
                    <span>•</span>
                    <span className="text-slate-600">{user.department}</span>
                  </>
                )}
                {user?.student_id && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-slate-600">ID: {user.student_id}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200 self-stretch sm:self-auto justify-between sm:justify-start">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Academic Session {new Date().getFullYear()} - {new Date().getFullYear() + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row: 3 metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Exams Taken */}
        <div className="metric-card hover:border-primary-200 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Exams Taken
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {loading ? '-' : totalExamsTaken}
            </span>
            <span className="text-xs text-slate-500">completed sessions</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Recorded in student history</span>
          </div>
        </div>

        {/* Metric 2: Average Score % */}
        <div className="metric-card hover:border-primary-200 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {loading ? '-' : `${avgScore}%`}
            </span>
            <span className="text-xs text-slate-500">cumulative average</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
            <span>Based on evaluated attempts</span>
          </div>
        </div>

        {/* Metric 3: Pass Rate % */}
        <div className="metric-card hover:border-primary-200 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Pass Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {loading ? '-' : `${passRate}%`}
            </span>
            <span className="text-xs text-slate-500">
              ({passedCount}/{totalExamsTaken} passed)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-purple-500" />
            <span>Benchmark pass percentage</span>
          </div>
        </div>
      </div>

      {/* Available Exams Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-slate-900">Available Examinations</h2>
            <span className="badge badge-blue">{activeExams.length} active</span>
          </div>
          <Link
            to="/student/exams"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="card p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
            <span className="text-sm font-medium">Loading available examinations...</span>
          </div>
        ) : activeExams.length === 0 ? (
          <div className="card p-8 text-center bg-slate-50/50 border-dashed border-2 border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">
              No Active Examinations Available
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no examinations currently open for submission. Check back later or review your past attempts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeExams.map((exam) => (
              <div
                key={exam.id}
                className="card-hover p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="badge badge-blue font-medium">
                      {exam.subject}
                    </span>
                    <span className="badge badge-green">Open Now</span>
                  </div>

                  <h3 className="font-semibold text-base text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                    {exam.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {exam.description || 'Comprehensive evaluation covering course syllabus topics.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.duration_minutes} Minutes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.total_marks} Total Marks</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Pass mark: {exam.pass_mark}
                  </span>
                  <Link
                    to={`/student/exams/${exam.id}`}
                    className="btn btn-primary btn-sm group-hover:shadow-md transition-all"
                  >
                    <span>Start Exam</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Results Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-slate-900">Recent Results</h2>
          </div>
          <Link
            to="/student/history"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <span>Full History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="card p-10 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600 mb-2" />
            <span className="text-sm font-medium">Loading recent results...</span>
          </div>
        ) : recentResults.length === 0 ? (
          <div className="card p-8 text-center bg-slate-50/50 border-dashed border-2 border-slate-200">
            <Award className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No Results Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't completed any examinations yet. Take an active examination above to see your grading and answers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentResults.map((result) => {
              const subId = result.submission_id || result.id
              const percentage =
                typeof result.percentage === 'number'
                  ? Math.round(result.percentage)
                  : Math.round((result.raw_score / result.total_marks) * 100)

              return (
                <div
                  key={result.id || result.submission_id}
                  className="card p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`badge ${getGradeBadgeClass(result.grade)} font-semibold`}>
                        Grade {result.grade}
                      </span>
                      <span
                        className={
                          result.passed ? 'badge badge-green' : 'badge badge-red'
                        }
                      >
                        {result.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">
                      {result.exam_title || 'Examination'}
                    </h4>

                    <div className="mt-4 flex items-baseline justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">
                          {result.raw_score}
                          <span className="text-sm font-normal text-slate-500">
                            /{result.total_marks}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Score achieved ({percentage}%)
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Completed on</div>
                        <div className="text-xs font-medium text-slate-600 mt-0.5">
                          {formatDate(result.graded_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <Link
                      to={`/student/results/${subId}`}
                      className="btn btn-secondary btn-sm text-xs font-medium"
                    >
                      <span>Review Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
