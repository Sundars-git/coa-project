import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  History,
  Award,
  Calendar,
  ChevronRight,
  TrendingUp,
  Percent,
  Search,
  BookOpen,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { submissionsApi, type Result } from '../../api/submissions'

export default function HistoryPage() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all')

  useEffect(() => {
    let isMounted = true

    async function fetchHistory() {
      setLoading(true)
      setError(null)
      try {
        const response = await submissionsApi.myResults()
        if (isMounted) {
          setResults(response.data || [])
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              err.message ||
              'Unable to fetch examination history. Please try again later.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchHistory()

    return () => {
      isMounted = false
    }
  }, [])

  // Calculate summary statistics
  const totalExams = results.length

  const avgScore = useMemo(() => {
    if (totalExams === 0) return 0
    const sum = results.reduce((acc, r) => {
      const pct =
        typeof r.percentage === 'number'
          ? r.percentage
          : (r.raw_score / r.total_marks) * 100
      return acc + pct
    }, 0)
    return Math.round(sum / totalExams)
  }, [results, totalExams])

  const passRate = useMemo(() => {
    if (totalExams === 0) return 0
    const passed = results.filter((r) => r.passed).length
    return Math.round((passed / totalExams) * 100)
  }, [results, totalExams])

  const bestGrade = useMemo(() => {
    if (totalExams === 0) return '-'
    const gradeRanks: Record<string, number> = {
      'A+': 100,
      A: 90,
      'B+': 85,
      B: 80,
      'C+': 75,
      C: 70,
      D: 60,
      F: 0,
    }
    const sorted = [...results].sort((a, b) => {
      const rankA = gradeRanks[a.grade?.toUpperCase()] || 0
      const rankB = gradeRanks[b.grade?.toUpperCase()] || 0
      return rankB - rankA
    })
    return sorted[0]?.grade || '-'
  }, [results, totalExams])

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (statusFilter === 'passed' && !r.passed) return false
      if (statusFilter === 'failed' && r.passed) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = (r.exam_title || '').toLowerCase().includes(q)
        const gradeMatch = (r.grade || '').toLowerCase().includes(q)
        if (!titleMatch && !gradeMatch) return false
      }

      return true
    })
  }, [results, statusFilter, searchQuery])

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
      {/* Title & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Examination History
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review past academic attempts, marks attained, evaluation transcripts, and answer reviews.
          </p>
        </div>

        <Link to="/student/exams" className="btn btn-primary btn-sm self-start md:self-auto">
          <BookOpen className="w-4 h-4" />
          <span>Take an Examination</span>
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
            className="btn btn-secondary btn-sm text-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary cards at top: 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total exams */}
        <div className="metric-card">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Exams
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? '-' : totalExams}
          </div>
          <div className="mt-1 text-xs text-slate-400">Recorded sessions</div>
        </div>

        {/* Avg score */}
        <div className="metric-card">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Avg Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? '-' : `${avgScore}%`}
          </div>
          <div className="mt-1 text-xs text-slate-400">Aggregate performance</div>
        </div>

        {/* Best grade */}
        <div className="metric-card">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Best Grade
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? '-' : bestGrade}
          </div>
          <div className="mt-1 text-xs text-slate-400">Highest letter grade</div>
        </div>

        {/* Pass rate */}
        <div className="metric-card">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Pass Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? '-' : `${passRate}%`}
          </div>
          <div className="mt-1 text-xs text-slate-400">Success ratio</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Results ({results.length})
          </button>
          <button
            onClick={() => setStatusFilter('passed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'passed'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Passed ({results.filter((r) => r.passed).length})
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'failed'
                ? 'bg-red-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Failed ({results.filter((r) => !r.passed).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exam name..."
            className="input pl-9 text-xs"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="card overflow-hidden border-slate-200 shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
            <p className="text-sm font-medium">Loading examination history...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50">
            <History className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              No results found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {totalExams === 0
                ? "You haven't participated in any examinations yet. Browse available tests to begin."
                : 'No examination records match your selected search or filter criteria.'}
            </p>
            {totalExams === 0 && (
              <Link to="/student/exams" className="btn btn-primary btn-sm mt-4">
                <BookOpen className="w-4 h-4" />
                <span>Browse Examinations</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Pass/Fail</th>
                  <th>Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((res) => {
                  const subId = res.submission_id || res.id
                  const pct =
                    typeof res.percentage === 'number'
                      ? Math.round(res.percentage)
                      : Math.round((res.raw_score / res.total_marks) * 100)

                  return (
                    <tr key={res.id || subId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="font-medium text-slate-900">
                        <div className="font-semibold">{res.exam_title || 'Examination'}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ID: {res.exam_id}
                        </div>
                      </td>

                      <td>
                        <span className="font-bold text-slate-900">
                          {res.raw_score}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {' '}
                          / {res.total_marks}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">{pct}%</span>
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${
                                res.passed ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${getGradeBadgeClass(res.grade)} font-semibold`}>
                          {res.grade}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            res.passed ? 'badge-green' : 'badge-red'
                          } font-medium`}
                        >
                          {res.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>

                      <td className="text-slate-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(res.graded_at)}</span>
                        </div>
                      </td>

                      <td className="text-right">
                        <Link
                          to={`/student/results/${subId}`}
                          className="btn btn-secondary btn-sm text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
