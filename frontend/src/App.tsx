import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Layouts
import StudentLayout from './components/layout/StudentLayout'
import AdminLayout from './components/layout/AdminLayout'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'

// Student Pages
import DashboardPage from './pages/student/DashboardPage'
import ExamListPage from './pages/student/ExamListPage'
import ExamInstructionsPage from './pages/student/ExamInstructionsPage'
import ExamPage from './pages/student/ExamPage'
import ResultPage from './pages/student/ResultPage'
import HistoryPage from './pages/student/HistoryPage'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminExamsPage from './pages/admin/AdminExamsPage'
import SubmissionsPage from './pages/admin/SubmissionsPage'
import PerformancePage from './pages/admin/PerformancePage'
import CaseStudyReportPage from './pages/admin/CaseStudyReportPage'

// Root Redirection Component
function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/student" replace />
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Auth Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Student Portal Routes */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="exams" element={<ExamListPage />} />
          <Route path="exams/:id" element={<ExamInstructionsPage />} />
          <Route path="exams/:examId/attempt/:submissionId" element={<ExamPage />} />
          <Route path="exams/:id/attempt/:submissionId" element={<ExamPage />} />
          <Route path="exams/:id/take" element={<ExamPage />} />
          <Route path="results/:submissionId" element={<ResultPage />} />
          <Route path="results/:id" element={<ResultPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>

        {/* Admin Portal Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="exams" element={<AdminExamsPage />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="report" element={<CaseStudyReportPage />} />
        </Route>

        {/* Root & Fallback */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
