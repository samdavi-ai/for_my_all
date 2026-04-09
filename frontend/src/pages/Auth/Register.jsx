import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { authApi } from '../../api/authApi'
import { useAuthStore } from '../../store/authStore'
import { LEARNING_STYLES } from '../../utils/constants'
import { EyeIcon, EyeSlashIcon, EyeDropperIcon, AcademicCapIcon, BookOpenIcon, HandRaisedIcon } from '@heroicons/react/24/outline'

const styleIcons = {
  'Visual': EyeDropperIcon,
  'Auditory': AcademicCapIcon,
  'Reading': BookOpenIcon,
  'Kinesthetic': HandRaisedIcon
}

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    learning_style: 'Visual',
    terms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match')
    }
    if (!formData.terms) {
      return toast.error('You must agree to the terms')
    }
    
    setLoading(true)
    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        learning_style: formData.learning_style
      }
      
      const { access_token } = await authApi.register(registerData)
      login(null, access_token)
      
      const userProfile = await authApi.getMe()
      login(userProfile, access_token)
      
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex text-slate-100 bg-surface">
      <div className="w-full flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-xl space-y-8 bg-surface-card p-8 rounded-2xl border border-white/5 shadow-xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-brand/20 mx-auto mb-4">
              SC
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Create your account</h2>
            <p className="mt-2 text-sm text-slate-400">
              Set up your profile to start optimizing your study habits
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300">Full Name</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl border border-white/10 bg-surface-elevated/30 px-3 py-2 text-white placeholder-slate-500 focus:border-brand focus:ring-1 focus:ring-brand sm:text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300">Email address</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl border border-white/10 bg-surface-elevated/30 px-3 py-2 text-white placeholder-slate-500 focus:border-brand focus:ring-1 focus:ring-brand sm:text-sm"
                  placeholder="name@university.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl border border-white/10 bg-surface-elevated/30 px-3 py-2 text-white focus:border-brand focus:ring-1 focus:ring-brand sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Confirm Password</label>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl border border-white/10 bg-surface-elevated/30 px-3 py-2 text-white focus:border-brand focus:ring-1 focus:ring-brand sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-sm text-brand hover:text-brand-light flex items-center"
                >
                    {showPassword ? <><EyeSlashIcon className="h-4 w-4 mr-1" /> Hide Passwords</> : <><EyeIcon className="h-4 w-4 mr-1" /> Show Passwords</>}
                </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Learning Style</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {LEARNING_STYLES.map((style) => {
                  const Icon = styleIcons[style]
                  const isSelected = formData.learning_style === style
                  return (
                    <div
                      key={style}
                      onClick={() => setFormData(p => ({ ...p, learning_style: style }))}
                      className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all ${
                        isSelected 
                        ? 'border-brand bg-brand/10 text-brand' 
                        : 'border-white/10 bg-surface-elevated/30 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-xs font-medium">{style}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={handleChange}
                className="h-4 w-4 rounded border-white/10 bg-surface text-brand focus:ring-brand focus:ring-offset-surface"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-slate-400">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand hover:text-brand-light">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
