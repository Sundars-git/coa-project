import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Clock,
  Award,
  Calendar,
  ChevronRight,
  Search,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { examsApi, type Exam } from '../../api/exams'

type TabType = 'all' | 'active' | 'upcoming' | 'closed'

export default function ExamListPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchExams() {
      setLoading(true)
      setError(null)
      try {
        const response = await examsApi.list()
        if (isMounted) {
          setExams(response.data || [])
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              err.message ||
              'Failed to retrieve examinations. Please try again later.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchExams()

    return () => {
      isMounted = false
    }
  }, [])

  // Categorize counts
  const counts = useMemo(() => {
    return {
      all: exams.length,
      active: exams.filter((e) => e.status === 'active').length,
      upcoming: exams.filter((e) => e.status === 'draft').length,
      closed: exams.filter((e) => e.status === 'closed').length,
    }
  }, [exams])

  // Filter exams by tab and search
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      // Tab matching:
      // 'active' -> status === 'active'
      // 'upcoming' -> status === 'draft'
      // 'closed' -> status === 'closed'
      if (activeTab === 'active' && exam.status !== 'active') return false
      if (activeTab === 'upcoming' && exam.status !== 'draft') return false
      if (activeTab === 'closed' && exam.status !== 'closed') return false

      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = exam.title.toLowerCase().includes(q)
        const subjectMatch = exam.subject.toLowerCase().includes(q)
        const descMatch = (exam.description || '').toLowerCase().includes(q)
        if (!titleMatch && !subjectMatch && !descMatch) return false
      }

      return true
    })
  }, [exams, activeTab, searchQuery])

  const getStatusBadge = (status: Exam['status']) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-green font-medium">Active Now</span>
      case 'draft':
        return <span className="badge badge-yellow font-medium">Upcoming</span>
      case 'closed':
        return <span className="badge badge-slate font-medium">Closed</span>
      default:
        return <span className="badge badge-slate font-medium capitalize">{status}</span>
    }
  }

  const formatScheduledDate = (dateStr: string) => {
    if (!dateStr) return 'Not scheduled'
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Available Examinations
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Browse and participate in online midterm, final, and diagnostic assessments.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or subject..."
            className="input pl-9 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
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

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <span>All Examinations</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'active'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <span>Active</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'active'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {counts.active}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'upcoming'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <span>Upcoming</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'upcoming'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {counts.upcoming}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('closed')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'closed'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <span>Closed</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'closed'
                ? 'bg-slate-200 text-slate-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {counts.closed}
          </span>
        </button>
      </div>

      {/* Grid of exam cards */}
      {loading ? (
        <div className="card p-16 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading examinations...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="card p-12 text-center bg-slate-50/50 border-dashed border-2 border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            No examinations found
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `No tests matching "${searchQuery}" in ${activeTab} category.`
              : `There are currently no examinations under the ${activeTab} category.`}
          </p>
          {(searchQuery || activeTab !== 'all') && (
            <button
              onClick={() => {
                setActiveTab('all')
                setSearchQuery('')
              }}
              className="btn btn-secondary btn-sm mt-4"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const isActive = exam.status === 'active'

            return (
              <div
                key={exam.id}
                className="card-hover p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span className="badge badge-blue font-semibold">
                      {exam.subject}
                    </span>
                    {getStatusBadge(exam.status)}
                  </div>

                  <h3 className="font-semibold text-base text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                    {exam.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {exam.description || 'Standard university evaluation paper.'}
                  </p>

                  {/* Scheduled Date */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">
                      Scheduled: {formatScheduledDate(exam.scheduled_at)}
                    </span>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[11px] text-slate-400 font-medium">Duration</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{exam.duration_minutes}m</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[11px] text-slate-400 font-medium">Total Marks</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center justify-center gap-1">
                        <Award className="w-3 h-3 text-slate-400" />
                        <span>{exam.total_marks}</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[11px] text-slate-400 font-medium">Pass Mark</div>
                      <div className="text-xs font-bold text-emerald-700 mt-0.5">
                        {exam.pass_mark}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {isActive ? 'Available immediately' : `Status: ${exam.status}`}
                  </span>

                  <Link
                    to={`/student/exams/${exam.id}`}
                    className={`btn btn-sm ${
                      isActive ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
