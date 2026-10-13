import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Clock,
  Award,
  Search,
  CheckCircle,
  Eye,
  HelpCircle,
  Layers,
  RefreshCw,
  X,
  FileCheck2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { examsApi, type Exam, type ExamDetail } from '../../api/exams'

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Inspection modal state
  const [selectedExamDetail, setSelectedExamDetail] = useState<ExamDetail | null>(null)
  const [inspectLoading, setInspectLoading] = useState(false)
  const [inspectError, setInspectError] = useState<string | null>(null)

  const loadExams = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await examsApi.list()
      setExams(res.data || [])
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err as Error).message ||
        'Failed to load examinations.'
      setError(msg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadExams()
  }, [])

  const handleInspectExam = async (examId: string) => {
    setInspectLoading(true)
    setInspectError(null)
    setSelectedExamDetail(null)

    try {
      const res = await examsApi.get(examId)
      setSelectedExamDetail(res.data)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err as Error).message ||
        'Unable to load questions for this examination.'
      setInspectError(msg)
    } finally {
      setInspectLoading(false)
    }
  }

  // Unique subjects for filter
  const subjects = useMemo(() => {
    const list = Array.from(new Set(exams.map((e) => e.subject).filter(Boolean)))
    return ['all', ...list]
  }, [exams])

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      if (selectedSubject !== 'all' && e.subject !== selectedSubject) return false
      if (statusFilter !== 'all' && e.status !== statusFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = e.title.toLowerCase().includes(q)
        const subMatch = (e.subject || '').toLowerCase().includes(q)
        const descMatch = (e.description || '').toLowerCase().includes(q)
        if (!titleMatch && !subMatch && !descMatch) return false
      }

      return true
    })
  }, [exams, selectedSubject, statusFilter, searchQuery])

  // Aggregate stats
  const totalQuestions = useMemo(() => {
    return exams.reduce((sum, e) => sum + (e.question_count || 0), 0)
  }, [exams])

  const activeCount = useMemo(() => {
    return exams.filter((e) => e.status === 'active').length
  }, [exams])

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-blue">Curriculum Management</span>
            <span className="text-xs text-slate-400">Faculty & Department Coursework</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
            Examinations Repository
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage course examinations, review question sets, and inspect grading standards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadExams(true)}
            disabled={refreshing || loading}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh List'}</span>
          </button>
        </div>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Total Exams</span>
            <BookOpen className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : exams.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Across registered curricula</div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Active Exams</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : activeCount}</div>
          <div className="text-xs text-emerald-600 mt-0.5">Currently accepting student submissions</div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Question Bank</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : totalQuestions}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total curated questions</div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Avg Duration</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {exams.length > 0
              ? `${Math.round(exams.reduce((acc, e) => acc + e.duration_minutes, 0) / exams.length)}m`
              : '0m'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Standard testing window</div>
        </div>
      </div>

      {/* ── Filters & Search ────────────────────────────────────────────────── */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, subject, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Subject Selector */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input text-xs w-auto py-2"
            >
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub === 'all' ? 'All Subjects' : sub}
                </option>
              ))}
            </select>

            {/* Status Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input text-xs w-auto py-2"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="draft">Draft Only</option>
              <option value="closed">Closed Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadExams()}
            className="btn btn-secondary btn-sm text-xs bg-white text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Exams Grid ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
          <span className="text-sm font-medium">Loading course examinations...</span>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="card p-12 text-center bg-slate-50/50 border-dashed border-2 border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No Examinations Match Filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, subject filter, or status toggles to locate desired records.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="card-hover p-6 flex flex-col justify-between group border-slate-200 transition-all hover:shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="badge badge-blue font-semibold">{exam.subject}</span>
                  <span
                    className={`badge ${
                      exam.status === 'active'
                        ? 'badge-green'
                        : exam.status === 'draft'
                        ? 'badge-yellow'
                        : 'badge-slate'
                    } uppercase text-[10px] tracking-wider`}
                  >
                    {exam.status}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                  {exam.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {exam.description || 'Comprehensive evaluation covering coursework materials and assignments.'}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.duration_minutes} Mins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.total_marks} Total Marks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.question_count || 10} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pass: {exam.pass_mark}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-400">ID: {exam.id}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleInspectExam(exam.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                  <Link
                    to={`/student/exams/${exam.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    <span>Preview</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Inspection Modal ────────────────────────────────────────────────── */}
      {(selectedExamDetail || inspectLoading || inspectError) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-3xl max-h-[90vh] flex flex-col bg-white shadow-2xl overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedExamDetail ? selectedExamDetail.title : 'Loading Exam Details...'}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Faculty Question Key & Configuration Inspection
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedExamDetail(null)
                  setInspectError(null)
                }}
                className="btn btn-ghost btn-sm p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {inspectLoading ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
                  <p className="text-sm">Fetching questions and answers from database...</p>
                </div>
              ) : inspectError ? (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {inspectError}
                </div>
              ) : selectedExamDetail ? (
                <>
                  {/* Meta Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Subject</span>
                      <span className="font-semibold text-slate-800">{selectedExamDetail.subject}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Duration</span>
                      <span className="font-semibold text-slate-800">{selectedExamDetail.duration_minutes} Mins</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Total Marks</span>
                      <span className="font-semibold text-slate-800">{selectedExamDetail.total_marks} Marks</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Pass Criteria</span>
                      <span className="font-semibold text-slate-800">Min {selectedExamDetail.pass_mark}</span>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Curated Questions ({selectedExamDetail.questions.length})
                      </h4>
                      <span className="badge badge-green text-[10px]">Admin Privilege: Answer Key Visible</span>
                    </div>

                    {selectedExamDetail.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">ID: {q.id}</span>
                          </div>
                          <span className="badge badge-blue text-[11px] font-medium">{q.marks} Mark</span>
                        </div>

                        <p className="text-sm font-medium text-slate-900 leading-snug">
                          {q.question_text}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                            <span className="font-bold text-slate-500 mr-1.5">A.</span>
                            <span className="text-slate-800">{q.option_a}</span>
                          </div>
                          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                            <span className="font-bold text-slate-500 mr-1.5">B.</span>
                            <span className="text-slate-800">{q.option_b}</span>
                          </div>
                          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                            <span className="font-bold text-slate-500 mr-1.5">C.</span>
                            <span className="text-slate-800">{q.option_c}</span>
                          </div>
                          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                            <span className="font-bold text-slate-500 mr-1.5">D.</span>
                            <span className="text-slate-800">{q.option_d}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedExamDetail(null)
                  setInspectError(null)
                }}
                className="btn btn-secondary btn-sm"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
