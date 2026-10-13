import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useState } from 'react'
import {
  GraduationCap, LayoutDashboard, BookOpen,
  History, LogOut, Menu, ChevronRight
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/student/exams', icon: BookOpen, label: 'Examinations' },
  { to: '/student/history', icon: History, label: 'My Results' },
]

export default function StudentLayout() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'student') return <Navigate to="/admin" replace />

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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-600">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm leading-tight">UniPortal</div>
            <div className="text-xs text-slate-500">Examination System</div>
          </div>
        </div>

        {/* Nav */}
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

        {/* User info + logout */}
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
              {user?.avatar_initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</div>
              <div className="text-xs text-slate-500 truncate">{user?.student_id}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-item w-full text-red-600 hover:bg-red-50 hover:text-red-700">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded bg-primary-600">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">UniPortal</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
