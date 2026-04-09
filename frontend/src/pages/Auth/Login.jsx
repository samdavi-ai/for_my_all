import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { authApi } from '../../api/authApi'
import { useAuthStore } from '../../store/authStore'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please enter both email and password')
    
    setLoading(true)
    try {
      const { access_token } = await authApi.login(email, password)
      login(null, access_token) // Set token first
      
      // Fetch user profile immediately
      const userProfile = await authApi.getMe()
      login(userProfile, access_token) // Update store with full user
      
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex text-slate-100 bg-surface">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-card items-center justify-center relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-purple-500/20 opacity-50"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-elevated/20 via-transparent to-transparent"></div>
        
        <div className="relative z-10 flex flex-col items-center max-w-lg text-center p-8">
          <div className="w-24 h-24 bg-brand rounded-2xl flex items-center justify-center text-4xl font-bold shadow-2xl shadow-brand/20 mb-8">
            SC
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Smart Study Companion</h1>
          <p className="text-lg text-slate-400">
            An AI-powered productivity and wellbeing tool designed to help you focus, organize, and thrive.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-400">
              Please sign in to your account to continue
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-white/10 bg-surface-elevated/30 px-3 py-2 text-white placeholder-slate-500 focus:border-brand focus:ring-1 focus:ring-brand sm:text-sm"
                  placeholder="name@university.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-white/10 bg-surface-elevated/30 px-3 py-2 text-white placeholder-slate-500 focus:border-brand focus:ring-1 focus:ring-brand sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/10 bg-surface text-brand focus:ring-brand focus:ring-offset-surface"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-400">
                  Remember me
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-brand hover:text-brand-light">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
