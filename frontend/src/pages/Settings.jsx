import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/authApi'
import { toast } from 'react-hot-toast'
import { LEARNING_STYLES } from '../utils/constants'

export default function Settings() {
  const { user, login, token } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    learning_style: user?.learning_style || 'Visual',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const updatedUser = await authApi.updateMe({
        name: formData.name,
        learning_style: formData.learning_style
      })
      // Update store
      login(updatedUser, token)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-surface.card rounded-2xl border border-white/5 p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-surface.elevated/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address (Read-only)</label>
            <input 
              value={user?.email || ''}
              disabled
              className="w-full bg-surface.elevated/10 border border-white/5 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Learning Style</label>
            <p className="text-xs text-slate-400 mb-3">Your AI Companion and tips will adapt to this style.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
               {LEARNING_STYLES.map((style) => (
                 <div
                   key={style}
                   onClick={() => setFormData(p => ({ ...p, learning_style: style }))}
                   className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${
                     formData.learning_style === style 
                     ? 'border-brand bg-brand/10 text-brand font-medium' 
                     : 'border-white/10 bg-surface.elevated/30 text-slate-400 hover:border-slate-500'
                   }`}
                 >
                   <span className="text-sm">{style}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
             <button 
               type="submit" disabled={loading}
               className="px-6 py-2.5 bg-brand hover:bg-brand.dark text-white rounded-xl shadow-lg shadow-brand/20 font-medium transition-colors disabled:opacity-50"
             >
               {loading ? 'Saving...' : 'Save Changes'}
             </button>
          </div>
        </form>
      </div>
    </div>
  )
}
