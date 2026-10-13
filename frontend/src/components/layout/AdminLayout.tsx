import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useState } from 'react'
import {
  GraduationCap, LayoutDashboard, FileText,
  Activity, BookOpen, LogOut, Menu, ChevronRight, BarChart2
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/exams', icon: BookOpen, label: 'Examinations' },
  { to: '/admin/submissions', icon: FileText, label: 'Submissions' },
  { to: '/admin/performance', icon: Activity, label: 'Performance Monitor' },
  { to: '/admin/report', icon: BarChart2, label: 'Case Study Report' },
]

export default function AdminLayout() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/student" replace />

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-700">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm leading-tight">UniPortal</div>
            <div className="text-xs text-primary-600 font-medium">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={isActive(to, exact) ? 'nav-item-active' : 'nav-item'}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive(to, exact) && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
              {user?.avatar_initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</div>
              <div className="text-xs text-primary-600 font-medium">Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-item w-full text-red-600 hover:bg-red-50 hover:text-red-700">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded bg-primary-700">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">Admin Panel</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
