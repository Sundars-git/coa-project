import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  BookOpen,
  FileCheck2,
  Activity,
  Award,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { metricsApi, type AdminStats } from '../../api/metrics'

interface SubmissionItem {
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const [statsRes, subsRes] = await Promise.all([
        metricsApi.adminDashboard(),
        metricsApi.allSubmissions(),
      ])
      setStats(statsRes.data)
      setSubmissions(subsRes.data || [])
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err as Error).message ||
        'Failed to load admin dashboard data.'
      setError(errorMsg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
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
    if (!grade) return <span className="text-slate-400">—</span>
    const g = grade.toUpperCase()
    let colorClass = 'badge-slate'
    if (g === 'A+' || g === 'A') colorClass = 'badge-green'
    else if (g === 'B+' || g === 'B') colorClass = 'badge-blue'
    else if (g === 'C+' || g === 'C') colorClass = 'badge-yellow'
    else if (g === 'D') colorClass = 'badge-yellow'
    else colorClass = 'badge-red'

    return <span className={`badge ${colorClass} font-semibold`}>Grade {grade}</span>
  }

  // 5 Stat cards configuration
  const statCards = [
    {
      title: 'Total Students',
      value: stats?.total_students ?? 0,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      description: 'Enrolled student accounts',
    },
    {
      title: 'Active Exams',
      value: stats?.active_exams ?? 0,
      icon: Clock,
      color: 'bg-emerald-50 text-emerald-600',
      description: 'Currently accepting responses',
    },
    {
      title: 'Total Exams',
      value: stats?.total_exams ?? 0,
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-600',
      description: 'Configured course assessments',
    },
    {
      title: 'Total Submissions',
      value: stats?.total_submissions ?? 0,
      icon: FileCheck2,
      color: 'bg-amber-50 text-amber-600',
      description: 'Recorded exam attempts',
    },
    {
      title: 'Results Graded',
      value: stats?.total_results ?? 0,
      icon: Award,
      color: 'bg-indigo-50 text-indigo-600',
      description: 'Evaluated & marks issued',
    },
  ]

  // Take latest 8 recent submissions for the dashboard view
  const recentSubmissions = submissions.slice(0, 8)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            System overview, student examination statistics, and operational telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link to="/admin/performance" className="btn btn-primary btn-sm shadow-sm">
            <Activity className="w-4 h-4" />
            <span>View Performance Monitor</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
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
            onClick={() => loadData(true)}
            className="btn btn-secondary btn-sm text-red-700 hover:bg-red-100 border-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5 Stat Cards in a Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="card p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3">
                  {loading ? (
                    <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
                  ) : (
                    <div className="text-3xl font-bold text-slate-900 tracking-tight">
                      {card.value.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="truncate">{card.description}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Performance Teaser / Quick Link Banner */}
      <div className="card p-5 bg-gradient-to-r from-primary-900 via-slate-900 to-primary-950 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pointer-events-none pr-8">
          <Activity className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-200 border border-primary-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Little's Law Live Monitor Available
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Real-Time Results Day Traffic Simulation & Capacity Sizing
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Analyze queuing theory dynamics (<span className="font-mono text-emerald-300">L = λ × W</span>),
              simulate sudden arrival spikes up to 3,000 req/s, observe database latency slowdowns, and verify
              IaaS auto-scaling thread provisioning.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/performance"
              className="btn bg-white text-primary-900 hover:bg-slate-100 font-semibold btn-sm shadow"
            >
              <Activity className="w-4 h-4 text-primary-700" />
              <span>Launch Monitor</span>
            </Link>
            <Link
              to="/admin/report"
              className="btn bg-primary-800/80 text-white hover:bg-primary-700/80 border border-primary-600/40 font-medium btn-sm"
            >
              <span>Case Study</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Submissions Section */}
      <div className="card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-slate-900">Recent Exam Submissions</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest student attempts recorded across all active and archived assessments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/submissions"
              className="btn btn-secondary btn-sm text-xs font-medium"
            >
              <span>View All Submissions ({submissions.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mb-3" />
            <span className="text-sm font-medium">Loading submissions data...</span>
          </div>
        ) : recentSubmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">No submissions recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Student exam attempts will appear here once submitted.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Exam</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSubmissions.map((sub) => {
                  const scoreDisplay =
                    sub.raw_score !== null && sub.total_marks !== null
                      ? `${sub.raw_score} / ${sub.total_marks}`
                      : '—'
                  const percentageDisplay =
                    sub.percentage !== null ? `(${Math.round(sub.percentage)}%)` : ''

                  return (
                    <tr key={sub.submission_id} className="transition-colors hover:bg-slate-50/80">
                      <td className="font-medium text-slate-900">
                        {sub.student_name}
                      </td>
                      <td>
                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {sub.student_id}
                        </span>
                      </td>
                      <td className="text-slate-800 font-medium max-w-xs truncate">
                        {sub.exam_title}
                      </td>
                      <td>{getStatusBadge(sub.status)}</td>
                      <td>
                        <span className="font-semibold text-slate-900">{scoreDisplay}</span>{' '}
                        <span className="text-xs text-slate-500">{percentageDisplay}</span>
                      </td>
                      <td>{getGradeBadge(sub.grade)}</td>
                      <td className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(sub.submitted_at || sub.started_at)}
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
            Showing {recentSubmissions.length} of {submissions.length} total records
          </span>
          <Link
            to="/admin/submissions"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <span>Browse complete history</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
