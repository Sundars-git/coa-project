import { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  X,
  FileCheck2,
} from 'lucide-react'
import { metricsApi } from '../../api/metrics'

export interface SubmissionItem {
  submission_id: string
  student_name: string
  student_id: string
  exam_title: string
  status: 'in_progress' | 'submitted' | string
  started_at: string
  submitted_at: string | null
  raw_score: number | null
  total_marks: number | null
  percentage: number | null
  grade: string | null
  passed: boolean | null
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'submitted'>('all')

  const loadSubmissions = async (isManual = false) => {
    if (isManual) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const res = await metricsApi.allSubmissions()
      setSubmissions(res.data || [])
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err as Error).message ||
        'Failed to load submissions.'
      setError(errorMsg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadSubmissions()
  }, [])

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }

      // Search query filter: check student name, student id, or exam title
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchName = item.student_name?.toLowerCase().includes(query)
        const matchId = item.student_id?.toLowerCase().includes(query)
        const matchExam = item.exam_title?.toLowerCase().includes(query)
        if (!matchName && !matchId && !matchExam) {
          return false
        }
      }

      return true
    })
  }, [submissions, searchQuery, statusFilter])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
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

  const getStatusBadge = (status: string) => {
    if (status === 'submitted') {
      return <span className="badge badge-green">Submitted</span>
    }
    if (status === 'in_progress') {
      return <span className="badge badge-yellow">In Progress</span>
    }
    return <span className="badge badge-slate capitalize">{status}</span>
  }

  const getGradeBadge = (grade: string | null) => {
    if (!grade) return <span className="text-slate-400 font-mono text-xs">—</span>
    const g = grade.toUpperCase()
    let colorClass = 'badge-slate'
    if (g === 'A+' || g === 'A') colorClass = 'badge-green'
    else if (g === 'B+' || g === 'B') colorClass = 'badge-blue'
    else if (g === 'C+' || g === 'C') colorClass = 'badge-yellow'
    else if (g === 'D') colorClass = 'badge-yellow'
    else colorClass = 'badge-red'

    return <span className={`badge ${colorClass} font-semibold`}>{grade}</span>
  }

  const getPassFailBadge = (passed: boolean | null, status: string) => {
    if (status === 'in_progress' || passed === null) {
      return <span className="badge badge-slate text-xs">Pending</span>
    }
    if (passed) {
      return (
        <span className="badge badge-green flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          <span>Pass</span>
        </span>
      )
    }
    return (
      <span className="badge badge-red flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        <span>Fail</span>
      </span>
    )
  }

  // Summary counts
  const totalCount = submissions.length
  const submittedCount = submissions.filter((s) => s.status === 'submitted').length
  const inProgressCount = submissions.filter((s) => s.status === 'in_progress').length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Student Submissions
            </h1>
            <span className="badge badge-blue font-semibold">{totalCount} Total</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage and inspect all student test sessions, grading results, and timestamps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadSubmissions(true)}
            disabled={loading || refreshing}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`card p-4 cursor-pointer transition-all ${
            statusFilter === 'all'
              ? 'ring-2 ring-primary-500 border-primary-300 bg-primary-50/20'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              All Sessions
            </span>
            <FileText className="w-4 h-4 text-primary-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalCount}</div>
          <div className="text-xs text-slate-500 mt-1">All recorded attempts</div>
        </div>

        <div
          onClick={() => setStatusFilter('submitted')}
          className={`card p-4 cursor-pointer transition-all ${
            statusFilter === 'submitted'
              ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/20'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Submitted & Graded
            </span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{submittedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Completed test submissions</div>
        </div>

        <div
          onClick={() => setStatusFilter('in_progress')}
          className={`card p-4 cursor-pointer transition-all ${
            statusFilter === 'in_progress'
              ? 'ring-2 ring-amber-500 border-amber-300 bg-amber-50/20'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              In Progress
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700">{inProgressCount}</div>
          <div className="text-xs text-slate-500 mt-1">Active candidate test sessions</div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadSubmissions(true)}
            className="btn btn-secondary btn-sm text-red-700 hover:bg-red-100 border-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="card p-4 bg-white shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll number, or exam title..."
            className="input pl-9 pr-9 w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | 'in_progress' | 'submitted')
              }
              className="input py-2 text-sm"
            >
              <option value="all">All Statuses ({totalCount})</option>
              <option value="submitted">Submitted ({submittedCount})</option>
              <option value="in_progress">In Progress ({inProgressCount})</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
              className="btn btn-ghost btn-sm text-xs text-slate-500 whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mb-3" />
            <span className="text-sm font-medium">Fetching candidate submissions...</span>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">No matching submissions found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or resetting filters to see all student exam records.'
                : 'No examinations have been taken by students yet.'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
                className="btn btn-secondary btn-sm mt-4"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Exam Title</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Pass / Fail</th>
                  <th>Started At</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => {
                  const hasScore = sub.raw_score !== null && sub.total_marks !== null
                  const scoreDisplay = hasScore
                    ? `${sub.raw_score} / ${sub.total_marks}`
                    : '—'
                  const percentageDisplay =
                    sub.percentage !== null ? `(${Math.round(sub.percentage)}%)` : ''

                  return (
                    <tr
                      key={sub.submission_id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="font-semibold text-slate-900">
                        {sub.student_name}
                      </td>
                      <td>
                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {sub.student_id}
                        </span>
                      </td>
                      <td className="text-slate-800 font-medium max-w-xs truncate">
                        {sub.exam_title}
                      </td>
                      <td>{getStatusBadge(sub.status)}</td>
                      <td>
                        <span className="font-semibold text-slate-900">{scoreDisplay}</span>{' '}
                        {percentageDisplay && (
                          <span className="text-xs text-slate-500 font-medium">
                            {percentageDisplay}
                          </span>
                        )}
                      </td>
                      <td>{getGradeBadge(sub.grade)}</td>
                      <td>{getPassFailBadge(sub.passed, sub.status)}</td>
                      <td className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(sub.started_at)}
                      </td>
                      <td className="text-xs text-slate-500 whitespace-nowrap">
                        {sub.submitted_at ? (
                          formatDate(sub.submitted_at)
                        ) : (
                          <span className="text-amber-600 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-700">{filteredSubmissions.length}</strong> of{' '}
            <strong className="text-slate-700">{submissions.length}</strong> records
          </span>
          {filteredSubmissions.length < submissions.length && (
            <span className="text-primary-600 font-medium">Filtered results applied</span>
          )}
        </div>
      </div>
    </div>
  )
}
