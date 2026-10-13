import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Loader2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'

interface DemoCredential {
  label: string
  roleDescription: string
  email: string
  pass: string
  roleType: 'admin' | 'student'
}

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    label: 'Admin',
    roleDescription: 'System Administrator',
    email: 'admin@uniportal.edu',
    pass: 'Admin@1234',
    roleType: 'admin',
  },
  {
    label: 'Student (Alice)',
    roleDescription: 'Computer Science • CS-2024-001',
    email: 'alice@student.edu',
    pass: 'Student@1234',
    roleType: 'student',
  },
  {
    label: 'Student (Bob)',
    roleDescription: 'Computer Science • CS-2024-002',
    email: 'bob@student.edu',
    pass: 'Student@1234',
    roleType: 'student',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const loginStore = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please provide both email and password.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await authApi.login(email.trim(), password)
      const { access_token, user } = response.data

      loginStore(access_token, user)

      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/student', { replace: true })
      }
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Authentication failed. Please verify your email and password.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickFill = (credEmail: string, credPass: string) => {
    setEmail(credEmail)
    setPassword(credPass)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Crest / Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 mb-3 ring-4 ring-primary-100">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            UniPortal
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            University Examination System
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-8 sm:px-10 shadow-md border-slate-200">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your institutional credentials to access examinations and evaluations.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Institutional Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@uniportal.edu"
                  className="input pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-2.5 text-sm font-semibold shadow-sm justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials Box */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                <span>Demo Access Credentials</span>
              </div>
              <span className="text-[11px] text-slate-400">Click to autofill</span>
            </div>

            <div className="space-y-2.5">
              {DEMO_CREDENTIALS.map((cred) => {
                const isSelected = email === cred.email
                const isAdmin = cred.roleType === 'admin'

                return (
                  <div
                    key={cred.email}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all text-xs ${
                      isSelected
                        ? 'bg-primary-50/70 border-primary-300 shadow-sm'
                        : 'bg-slate-50/80 hover:bg-slate-100/70 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isAdmin ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <span>{cred.label}</span>
                          <span
                            className={
                              isAdmin ? 'badge badge-purple text-[10px]' : 'badge badge-blue text-[10px]'
                            }
                          >
                            {cred.roleType}
                          </span>
                        </div>
                        <div className="text-slate-500 font-mono text-[11px] truncate">
                          {cred.email}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickFill(cred.email, cred.pass)}
                      className="btn btn-secondary btn-sm px-2.5 py-1 text-xs whitespace-nowrap ml-2 flex-shrink-0 font-medium"
                    >
                      Fill
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          UniPortal • Academic Verification & Testing Platform
        </p>
      </div>
    </div>
  )
}
